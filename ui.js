// UI interaction management
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach(slot => {
        // Initial color shader application
        applyColorShader(slot);
        
        // Setup initial gender toggle state
        const initialCharacter = characters[parseInt(slot.dataset.characterIndex, 10)];
        updateGenderToggle(slot, initialCharacter);

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

function updateGenderToggle(slot, character) {
    const container = slot.querySelector('.gender-toggle-container');
    if (!container) return;

    if (character.variants) {
        let currentGender = slot.dataset.gender || 'male';
        if (!container.querySelector('.gender-toggle')) {
            container.innerHTML = `
                <div class="gender-toggle">
                    <button data-gender="male" class="${currentGender === 'male' ? 'active' : ''}">M</button>
                    <button data-gender="female" class="${currentGender === 'female' ? 'active' : ''}">F</button>
                </div>
            `;
            container.querySelector('.gender-toggle').addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const newGender = e.target.dataset.gender;
                    switchCharacterGender(slot, newGender);
                }
            });
        }
    } else {
        container.innerHTML = '';
    }
}

function switchCharacterGender(slot, newGender) {
    const currentGender = slot.dataset.gender || 'male';
    if (newGender === currentGender) return;

    slot.dataset.gender = newGender;

    const characterIndex = parseInt(slot.dataset.characterIndex, 10);
    const character = characters[characterIndex];
    const newImgSrc = character.variants[newGender];

    const imageWrapper = slot.querySelector('.character-image-wrapper');
    const oldImage = imageWrapper.querySelector('.character-image');
    const color = slot.dataset.color;

    // Update toggle button active state
    const toggle = slot.querySelector('.gender-toggle');
    toggle.querySelector('button.active').classList.remove('active');
    toggle.querySelector(`button[data-gender="${newGender}"]`).classList.add('active');

    // Create new image
    const newImage = document.createElement('img');
    const cachedSrc = characterImageCache[newImgSrc]?.[color];
    newImage.src = cachedSrc || newImgSrc;
    
    newImage.alt = character.name;
    newImage.className = 'character-image';
    newImage.dataset.baseHue = character.baseHue;
    
    // Add new image, but don't animate for gender swap, just replace
    imageWrapper.appendChild(newImage);
    if (!cachedSrc) {
        applyColorShaderToImage(newImage, color);
    }
    
    // Clean up old image
    if (oldImage.dataset.blobUrl) {
        URL.revokeObjectURL(oldImage.dataset.blobUrl);
    }
    oldImage.remove();
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');

    startOverlay.addEventListener('click', async () => {
        startOverlay.classList.add('hidden');
        await initializeAudio();
    }, { once: true }); // The event listener will only run once
}