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
    document.dispatchEvent(new CustomEvent('relic-cursor-refresh'));
    
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
        document.dispatchEvent(new CustomEvent('relic-cursor-refresh'));
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
    if (baseHue === 120) { // Archer: selectively recolor only green regions
        selectiveRecolorArcher(image, targetHue);
        return;
    }
    const hueShift = targetHue - baseHue;
    image.style.filter = `hue-rotate(${hueShift}deg)`;
}

function selectiveRecolorArcher(img, targetHue) {
    const shift = ((targetHue - 120) + 360) % 360; // shift from green
    const process = () => {
        try {
            const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            x.drawImage(img, 0, 0);
            const d = x.getImageData(0, 0, c.width, c.height); const p = d.data;
            for (let i = 0; i < p.length; i += 4) {
                const r = p[i], g = p[i+1], b = p[i+2], a = p[i+3];
                if (a < 5) continue;
                const hsl = rgbToHsl(r, g, b); // h:0-360 s,l:0-1
                if (isGreenish(hsl.h, hsl.s, hsl.l, r, g, b)) {
                    let h = (hsl.h + shift) % 360;
                    const rgb = hslToRgb(h, hsl.s, hsl.l);
                    p[i] = rgb.r; p[i+1] = rgb.g; p[i+2] = rgb.b;
                }
            }
            x.putImageData(d, 0, 0);
            c.toBlob(blob => {
                if (!blob) return;
                if (img.dataset.blobUrl) URL.revokeObjectURL(img.dataset.blobUrl);
                const url = URL.createObjectURL(blob);
                img.dataset.blobUrl = url;
                img.style.filter = ''; img.src = url;
                console.info('[Archer Recolor] Applied selective green shift -> hue', targetHue);
            });
        } catch (e) { console.warn('[Archer Recolor] Fallback to CSS filter', e); img.style.filter = `hue-rotate(${targetHue-120}deg)`; }
    };
    if (img.complete && img.naturalWidth) process(); else img.addEventListener('load', process, { once: true });
}

function isGreenish(h, s, l, r, g, b) {
    const d = Math.abs(h - 120); const hueDist = Math.min(d, 360 - d);
    const hueOK = hueDist <= 40; // generous cone around green
    const greenDominance = g - Math.max(r, b);
    const chromaOK = greenDominance > 10; // RGB dominance guard
    const satOK = s > 0.18;
    const lightOK = l > 0.10 && l < 0.92;
    return (hueOK && satOK && lightOK) || (chromaOK && l < 0.85);
}

function rgbToHsl(r, g, b) {
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = 0; s = 0; }
    else {
        const d = max - min;
        s = l > .5 ? d/(2-max-min) : d/(max+min);
        switch (max) {
            case r: h = (g-b)/d + (g<b?6:0); break;
            case g: h = (b-r)/d + 2; break;
            default: h = (r-g)/d + 4;
        }
        h *= 60;
    }
    return { h, s, l };
}

function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2*l - 1)) * s;
    const hp = h / 60; const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1=0,g1=0,b1=0;
    if (hp>=0&&hp<1) { r1=c; g1=x; }
    else if (hp<2) { r1=x; g1=c; }
    else if (hp<3) { g1=c; b1=x; }
    else if (hp<4) { g1=x; b1=c; }
    else if (hp<5) { r1=x; b1=c; }
    else { r1=c; b1=x; }
    const m = l - c/2;
    return { r: Math.round((r1+m)*255), g: Math.round((g1+m)*255), b: Math.round((b1+m)*255) };
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
        const INTERACTIVE_SELECTOR = '.arrow';
        const show = () => (cursor.style.opacity = '1');
        const hide = () => { cursor.style.opacity = '0'; cursor.classList.remove('active'); cursor.classList.remove('cooldown'); };
        let lastPos = { x: 0, y: 0, has: false };
        const updateAt = (x, y) => {
            cursor.style.left = x + 'px'; cursor.style.top = y + 'px';
            const el = document.elementFromPoint(x, y);
            const interactive = el && el.closest(INTERACTIVE_SELECTOR);
            const isDisabled = !!(interactive && interactive.disabled);
            cursor.classList.toggle('active', !!interactive);
            cursor.classList.toggle('cooldown', !!(interactive && isDisabled));
            show();
        };
        window.addEventListener('mousemove', (e) => {
            lastPos = { x: e.clientX, y: e.clientY, has: true };
            updateAt(e.clientX, e.clientY);
        });
        document.addEventListener('relic-cursor-refresh', () => {
            if (lastPos.has) updateAt(lastPos.x, lastPos.y);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    forceLandscape();
    initializeCharacterSelection();
    initializeStartOverlay();
    initializeRelicCursor();
});