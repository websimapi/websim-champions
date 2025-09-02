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
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

const slotColors = {
    blue: 240,
    green: 120,
    yellow: 60,
    red: 0
};

// Update a character slot with new character data
function updateCharacterSlot(slot, character) {
    slot.querySelector('.character-image').src = character.img;
    slot.querySelector('.character-image').alt = character.name;
    slot.querySelector('.character-image').dataset.baseHue = character.baseHue;
    slot.querySelector('.stat-label').textContent = character.name;
    slot.querySelector('.strength').textContent = `Strength: ${character.stats.strength}`;
    slot.querySelector('.speed').textContent = `Speed: ${character.stats.speed}`;
    slot.querySelector('.magic').textContent = `Magic: ${character.stats.magic}`;
    slot.querySelector('.armour').textContent = `Armour: ${character.stats.armour}`;

    applyColorShader(slot);
}

// Apply CSS filter to shift image color
function applyColorShader(slot) {
    const image = slot.querySelector('.character-image');
    const slotColorName = slot.dataset.color;
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
            playSound(stoneShiftBuffer);
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex - 1 + characters.length) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex]);
        });

        rightArrow.addEventListener('click', () => {
            playSound(stoneShiftBuffer);
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex]);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    forceLandscape();
    initializeCharacterSelection();

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Preload the sound effect
        stoneShiftBuffer = await loadSound('stone_shift.mp3');
    } catch (e) {
        console.error("Web Audio API is not supported in this browser or the sound failed to load.", e);
    }
});