// UI interaction management
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach(slot => {
        // Initial gender setup
        slot.dataset.variant = 'Male'; // Default to Male for all slots

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

        // Gender toggle listener
        const genderToggle = slot.querySelector('.gender-toggle');
        genderToggle.addEventListener('click', () => {
            const currentIndex = parseInt(slot.dataset.characterIndex, 10);
            const character = characters[currentIndex];
            if (!character.variants) return;

            // Toggle variant
            const currentVariant = slot.dataset.variant;
            const newVariant = currentVariant === 'Male' ? 'Female' : 'Male';
            slot.dataset.variant = newVariant;

            // Update button text immediately
            genderToggle.textContent = newVariant === 'Female' ? '♀' : '♂';
            
            // Update image with animation
            switchCharacterVariant(slot, character, newVariant);
        });
    });
}

function switchCharacterVariant(slot, character, newVariant) {
    const imageWrapper = slot.querySelector('.character-image-wrapper');
    const oldImage = imageWrapper.querySelector('.character-image');
    const color = slot.dataset.color;
    const genderToggle = slot.querySelector('.gender-toggle');

    // Disable toggle during animation
    genderToggle.disabled = true;

    const newImgSrc = character.variants[newVariant].img;

    // Create new image
    const newImage = document.createElement('img');
    const cachedSrc = characterImageCache[newImgSrc]?.[color];
    newImage.src = cachedSrc || newImgSrc;
    
    newImage.alt = character.name;
    newImage.className = 'character-image';
    newImage.dataset.baseHue = character.baseHue;
    
    // Position new image for entry animation (fade)
    newImage.style.opacity = '0';
    imageWrapper.appendChild(newImage);

    if (!cachedSrc) {
        applyColorShaderToImage(newImage, color);
    }
    
    // Animate old image out, new image in (cross-fade)
    oldImage.style.transition = 'opacity 0.25s ease-in-out';
    newImage.style.transition = 'opacity 0.25s ease-in-out';
    
    oldImage.style.opacity = '0';
    setTimeout(() => {
        newImage.style.opacity = '1';
    }, 50);


    // After animation is complete, clean up
    setTimeout(() => {
        if (oldImage.dataset.blobUrl) {
            URL.revokeObjectURL(oldImage.dataset.blobUrl);
        }
        oldImage.remove();
        
        // Re-enable toggle
        genderToggle.disabled = false;
        document.dispatchEvent(new CustomEvent('relic-cursor-refresh'));

    }, ANIMATION_DURATION);
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');

    startOverlay.addEventListener('click', async () => {
        startOverlay.classList.add('hidden');
        await initializeAudio();
    }, { once: true }); // The event listener will only run once
}