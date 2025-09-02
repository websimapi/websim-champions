// Character data
const characters = [
    { name: 'Warrior', img: '/character1.png', baseHue: 240, stats: { strength: 9, speed: 5, magic: 2, armour: 8 } },
    { name: 'Archer', img: '/character2.png', baseHue: 120, stats: { strength: 6, speed: 9, magic: 4, armour: 5 } },
    { name: 'Wizard', img: '/character3.png', baseHue: 60, stats: { strength: 3, speed: 6, magic: 10, armour: 3 } },
    { name: 'Valkyrie', img: '/character4.png', baseHue: 0, stats: { strength: 7, speed: 7, magic: 6, armour: 6 } }
];

// WebAudio setup
let audioContext;
let stoneShiftBuffer;
let backgroundMusicBuffer;
let isMusicPlaying = false;

// Function to load a sound
async function loadSound(url) {
    if (!audioContext) return null;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sound: ${url}`, error);
        return null;
    }
}

// Function to play a sound
function playSound(buffer) {
    if (!audioContext || !buffer) return;

    // Resume AudioContext if it's in a suspended state (required by browser autoplay policies)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            if (!isMusicPlaying) {
                playBackgroundMusic();
            }
        });
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function playBackgroundMusic() {
    if (!audioContext || !backgroundMusicBuffer || isMusicPlaying) return;

    if (audioContext.state !== 'running') {
        // Wait for user interaction to start music
        return;
    }

    isMusicPlaying = true;
    
    const source = audioContext.createBufferSource();
    source.buffer = backgroundMusicBuffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // Set volume to half

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);

    source.onended = () => {
        isMusicPlaying = false;
        setTimeout(playBackgroundMusic, 5000); // Wait 5 seconds before repeating
    };
}

const slotColors = {
    blue: 240,
    green: 120,
    yellow: 60,
    red: 0
};

const ANIMATION_DURATION = 500; // ms

// Update a character slot with new character data
function updateCharacterSlot(slot, character, direction) {
    const imageWrapper = slot.querySelector('.character-image-wrapper');
    const oldImage = imageWrapper.querySelector('.character-image');
    const arrows = slot.querySelectorAll('.arrow');
    const nameText = slot.querySelector('.character-name-text');

    // Disable arrows during animation
    arrows.forEach(arrow => arrow.disabled = true);
    
    // Fade out name
    nameText.classList.add('fade-out');

    // Create new image
    const newImage = document.createElement('img');
    newImage.src = character.img;
    newImage.alt = character.name;
    newImage.className = 'character-image';
    newImage.dataset.baseHue = character.baseHue;
    
    // Position new image for entry animation
    newImage.classList.add(direction === 'right' ? 'slide-in-from-right' : 'slide-in-from-left');
    imageWrapper.appendChild(newImage);

    // Apply color shader to new image immediately
    applyColorShaderToImage(newImage, slot.dataset.color);

    // Animate old image out
    oldImage.classList.add(direction === 'right' ? 'slide-out-to-left' : 'slide-out-to-right');

    // Play sound
    playSound(stoneShiftBuffer);

    // After animation is complete, clean up and update stats
    setTimeout(() => {
        oldImage.remove();
        newImage.classList.remove('slide-in-from-left', 'slide-in-from-right');
        
        // Update the stat text (except name, which is handled separately for timing)
        slot.querySelector('.strength').textContent = `Strength: ${character.stats.strength}`;
        slot.querySelector('.speed').textContent = `Speed: ${character.stats.speed}`;
        slot.querySelector('.magic').textContent = `Magic: ${character.stats.magic}`;
        slot.querySelector('.armour').textContent = `Armour: ${character.stats.armour}`;
        
        // Re-enable arrows
        arrows.forEach(arrow => arrow.disabled = false);
    }, ANIMATION_DURATION);

    // Halfway through the animation, change the name and fade it in
    setTimeout(() => {
        nameText.textContent = character.name;
        nameText.classList.remove('fade-out');
    }, ANIMATION_DURATION / 2);
}

// Apply CSS filter to shift image color
function applyColorShader(slot) {
    const image = slot.querySelector('.character-image');
    const slotColorName = slot.dataset.color;
    applyColorShaderToImage(image, slotColorName);
}

function applyColorShaderToImage(image, slotColorName) {
    if (!image) return;
    const targetHue = slotColors[slotColorName];
    const baseHue = parseInt(image.dataset.baseHue, 10);
    const hueShift = targetHue - baseHue;

    image.style.filter = `hue-rotate(${hueShift}deg)`;
}

// Force landscape orientation on mobile
function forceLandscape() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Lock orientation to landscape if supported
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                console.log('Orientation lock not supported');
            });
        }
        
        // Add class for mobile-specific styling
        document.body.classList.add('mobile');
        
        // Show orientation message if in portrait
        function checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                showOrientationMessage();
            } else {
                hideOrientationMessage();
            }
        }
        
        function showOrientationMessage() {
            let message = document.getElementById('orientation-message');
            if (!message) {
                message = document.createElement('div');
                message.id = 'orientation-message';
                message.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        color: white;
                        text-align: center;
                        font-family: 'Cinzel', serif;
                    ">
                        <div>
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📱</div>
                            <div style="font-size: 1.5rem; font-weight: 600;">Please rotate your device</div>
                            <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.8;">This game is best played in landscape mode</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(message);
            }
        }
        
        function hideOrientationMessage() {
            const message = document.getElementById('orientation-message');
            if (message) {
                message.remove();
            }
        }
        
        // Check orientation on load and resize
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });
    }
}

// Initialize character selection interactions
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');
    
    characterSlots.forEach(slot => {
        // Initial color shader application
        applyColorShader(slot);

        slot.addEventListener('click', (e) => {
            // Don't trigger selection when clicking arrows
            if (e.target.classList.contains('arrow')) {
                return;
            }

            // Remove selected state from all slots
            characterSlots.forEach(s => s.classList.remove('selected'));
            
            // Add selected state to clicked slot
            slot.classList.add('selected');
        });

        // Arrow click listeners for character swapping
        const leftArrow = slot.querySelector('.left-arrow');
        const rightArrow = slot.querySelector('.right-arrow');

        leftArrow.addEventListener('click', () => {
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex - 1 + characters.length) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'left');
        });

        rightArrow.addEventListener('click', () => {
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'right');
        });
    });
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');
    
    startOverlay.addEventListener('click', async () => {
        startOverlay.classList.add('hidden');

        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume context if it was suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Preload sounds now that we have user interaction
            if (!stoneShiftBuffer) {
                 stoneShiftBuffer = await loadSound('stone_shift.mp3');
            }
            if (!backgroundMusicBuffer) {
                backgroundMusicBuffer = await loadSound('/Ancient_Champions.ogg');
            }
            
            // Start background music
            playBackgroundMusic();

        } catch (e) {
            console.error("Web Audio API is not supported or failed to initialize.", e);
        }

    }, { once: true }); // The event listener will only run once
}

function initializeRelicCursor() {
    const fine = window.matchMedia('(pointer: fine)').matches;
    console.info('[RelicCursor] Pointer fine:', fine);
    if (!fine) { console.info('[RelicCursor] Using system cursor (coarse pointer).'); return; }

    // Ensure CSS variable is applied
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--relic-cursor').trim();
    console.info('[RelicCursor] --relic-cursor:', computed || '(missing)');
    if (!computed) document.documentElement.style.setProperty('--relic-cursor', "url('/relic_cursor.png') 16 2, auto");

    const img = new Image();
    img.onload = () => {
        console.info('[RelicCursor] Loaded relic_cursor.png', { w: img.naturalWidth, h: img.naturalHeight });
        document.documentElement.classList.add('use-custom-cursor');
        let cursor = document.getElementById('custom-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'custom-cursor';
            document.body.appendChild(cursor);
        }
        const show = () => (cursor.style.opacity = '1');
        const hide = () => (cursor.style.opacity = '0');
        window.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            show();
        });
        window.addEventListener('mouseenter', show);
        window.addEventListener('mouseleave', hide);
        window.addEventListener('blur', hide);
        window.addEventListener('touchstart', () => {
            console.info('[RelicCursor] Touch detected, hiding custom cursor.');
            hide();
            document.documentElement.classList.remove('use-custom-cursor');
        }, { passive: true });
        console.info('[RelicCursor] Custom cursor active.');
    };
    img.onerror = (e) => console.error('[RelicCursor] Failed to load /relic_cursor.png', e);
    img.src = '/relic_cursor.png';
}

function initializeClickAssist() {
    const selectors = ['.arrow', '.character-slot', '#start-overlay'];
    const stepsX = [-24, 0, 24];
    const stepsY = [-30, 0, 30];
    document.addEventListener('pointerup', (e) => {
        if (selectors.some(s => e.target.closest(s))) return;
        for (let dx of stepsX) for (let dy of stepsY) {
            const el = document.elementFromPoint(e.clientX + dx, e.clientY + dy);
            const hit = el && el.closest(selectors.join(','));
            if (hit) { hit.click(); return; }
        }
    }, true);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    forceLandscape();
    initializeCharacterSelection();
    initializeStartOverlay();
    initializeRelicCursor();
    initializeClickAssist();
});