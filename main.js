// Character data
const characters = [
    { name: 'Warrior', img: '/character1.png', baseHue: 240, stats: { strength: 9, speed: 5, magic: 2, armour: 8 } },
    { name: 'Archer', img: '/character2.png', baseHue: 120, stats: { strength: 6, speed: 9, magic: 4, armour: 5 } },
    { name: 'Wizard', img: '/character3.png', baseHue: 60, stats: { strength: 3, speed: 6, magic: 10, armour: 3 } },
    { name: 'Valkyrie', img: '/character4.png', baseHue: 0, stats: { strength: 7, speed: 7, magic: 6, armour: 6 } }
];

let preloadedImages = {};
let imagesLoaded = false;
let loadPromises = [];

function preloadImages() {
    characters.forEach(character => {
        const img = new Image();
        img.src = character.img;
        preloadedImages[character.img] = img;
        const promise = new Promise((resolve) => {
            img.onload = resolve;
        });
        loadPromises.push(promise);
    });
    return Promise.all(loadPromises).then(() => {
        imagesLoaded = true;
    });
}

const slotColors = {
    blue: 240,
    green: 120,
    yellow: 60,
    red: 0
};

// Update a character slot with new character data
function updateCharacterSlot(slot, character) {
    slot.querySelector('.stat-label').textContent = character.name;
    slot.querySelector('.strength').textContent = `Strength: ${character.stats.strength}`;
    slot.querySelector('.speed').textContent = `Speed: ${character.stats.speed}`;
    slot.querySelector('.magic').textContent = `Magic: ${character.stats.magic}`;
    slot.querySelector('.armour').textContent = `Armour: ${character.stats.armour}`;
    applyColorShader(slot, character);
}

// Helper function to convert RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        h /= 360;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Apply CSS filter to shift image color
function applyColorShader(slot, character) {
    if (!imagesLoaded) return;

    const canvas = slot.querySelector('.character-image');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const image = preloadedImages[character.img];

    if (!image.complete) {
        image.onload = () => applyColorShader(slot, character);
        return;
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);

    const slotColorName = slot.dataset.color;
    const targetHue = slotColors[slotColorName];
    const baseHue = character.baseHue;
    const hueShift = targetHue - baseHue;
    
    if (hueShift === 0) return; // No change needed

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const hueTolerance = 30; // degrees

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i+3];

        if (alpha === 0) continue; // Skip transparent pixels

        const [h, s, l] = rgbToHsl(r, g, b);

        // Change only pixels that are close to the base hue and are not grayscale/white/black
        const hueDistance = Math.min(Math.abs(h - baseHue), 360 - Math.abs(h - baseHue));
        if (hueDistance < hueTolerance && s > 0.1 && l < 0.95 && l > 0.05) {
            let newHue = (h + hueShift + 360) % 360;
            const [newR, newG, newB] = hslToRgb(newHue, s, l);
            data[i] = newR;
            data[i + 1] = newG;
            data[i + 2] = newB;
        }
    }
    ctx.putImageData(imageData, 0, 0);
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
        const initialCharacterIndex = parseInt(slot.dataset.characterIndex, 10);
        updateCharacterSlot(slot, characters[initialCharacterIndex]);

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
            updateCharacterSlot(slot, characters[currentIndex]);
        });

        rightArrow.addEventListener('click', () => {
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex]);
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    forceLandscape();
    preloadImages().then(() => {
        initializeCharacterSelection();
    });
});