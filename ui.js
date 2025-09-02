// UI interaction management
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach(slot => {
        // Initial color shader application
        applyColorShader(slot);
        
        // Initial gender toggle visibility check
        const initialCharacter = characters[parseInt(slot.dataset.characterIndex, 10)];
        const genderToggle = slot.querySelector('.gender-toggle');
        if (genderToggle) {
             if (initialCharacter.img_female) {
                genderToggle.style.display = 'inline-block';
                slot.dataset.gender = 'male'; // Default
                genderToggle.textContent = '♂';
            } else {
                genderToggle.style.display = 'none';
            }
        }

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
        if (genderToggle) {
            genderToggle.addEventListener('click', () => {
                const currentGender = slot.dataset.gender || 'male';
                const newGender = currentGender === 'male' ? 'female' : 'male';
                slot.dataset.gender = newGender;
                genderToggle.textContent = newGender === 'male' ? '♂' : '♀';
                
                const characterIndex = parseInt(slot.dataset.characterIndex, 10);
                const character = characters[characterIndex];
                
                // Animate character image swap
                const imageWrapper = slot.querySelector('.character-image-wrapper');
                const oldImage = imageWrapper.querySelector('.character-image');
                const color = slot.dataset.color;
                
                const newImage = document.createElement('img');
                const baseImgSrc = newGender === 'female' ? character.img_female : character.img;
                const cachedSrc = characterImageCache[baseImgSrc]?.[color];
                newImage.src = cachedSrc || baseImgSrc;
                
                newImage.alt = character.name;
                newImage.className = 'character-image';
                newImage.dataset.baseHue = character.baseHue;
                
                newImage.style.opacity = '0';
                imageWrapper.appendChild(newImage);

                if (!cachedSrc) {
                    applyColorShaderToImage(newImage, color);
                }

                setTimeout(() => {
                    oldImage.style.opacity = '0';
                    newImage.style.opacity = '1';
                }, 10);

                setTimeout(() => {
                    if (oldImage.dataset.blobUrl) {
                        URL.revokeObjectURL(oldImage.dataset.blobUrl);
                    }
                    oldImage.remove();
                }, 300); // fade duration
            });
        }
    });
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');

    startOverlay.addEventListener('click', async () => {
        startOverlay.classList.add('hidden');
        await initializeAudio();
    }, { once: true }); // The event listener will only run once
}