// Character data and management
const characters = [
    { name: 'Warrior', img: '/character1.png', baseHue: 240, stats: { strength: 9, speed: 5, magic: 2, armour: 8 } },
    { 
        name: 'Archer', 
        img: '/character2.png', 
        baseHue: 120, 
        stats: { strength: 6, speed: 9, magic: 4, armour: 5 },
        variants: {
            'Male': { img: '/character2.png' },
            'Female': { img: '/character2_female.png' }
        }
    },
    { name: 'Wizard', img: '/character3.png', baseHue: 60, stats: { strength: 3, speed: 6, magic: 10, armour: 3 } },
    { name: 'Valkyrie', img: '/character4.png', baseHue: 0, stats: { strength: 7, speed: 7, magic: 6, armour: 6 } }
];

const ANIMATION_DURATION = 500; // ms

// Cache for pre-processed character images
const characterImageCache = {};

// Update a character slot with new character data
function updateCharacterSlot(slot, character, direction) {
    const imageWrapper = slot.querySelector('.character-image-wrapper');
    const oldImage = imageWrapper.querySelector('.character-image');
    const arrows = slot.querySelectorAll('.arrow');
    const nameText = slot.querySelector('.character-name-text');
    const color = slot.dataset.color;

    // Disable arrows during animation
    arrows.forEach(arrow => arrow.disabled = true);
    document.dispatchEvent(new CustomEvent('relic-cursor-refresh'));
    
    // Fade out name
    nameText.classList.add('fade-out');

    // Handle variants
    let characterImgSrc = character.img;
    if (character.variants) {
        // If switching to a character with variants, default to Male
        const currentVariant = slot.dataset.variant || 'Male';
        characterImgSrc = character.variants[currentVariant].img;
    }

    // Create new image
    const newImage = document.createElement('img');
    const cachedSrc = characterImageCache[characterImgSrc]?.[color];
    newImage.src = cachedSrc || characterImgSrc; // Use cached image if available
    
    newImage.alt = character.name;
    newImage.className = 'character-image';
    newImage.dataset.baseHue = character.baseHue;
    
    // Position new image for entry animation
    newImage.classList.add(direction === 'right' ? 'slide-in-from-right' : 'slide-in-from-left');
    imageWrapper.appendChild(newImage);

    // If we used a fallback, apply shader (should be rare after preloading)
    if (!cachedSrc) {
        applyColorShaderToImage(newImage, color);
    }

    // Animate old image out
    oldImage.classList.add(direction === 'right' ? 'slide-out-to-left' : 'slide-out-to-right');

    // Play sound
    playSound(stoneShiftBuffer);

    // After animation is complete, clean up and update stats
    setTimeout(() => {
        // Revoke old blob url if it exists to prevent memory leaks
        if (oldImage.dataset.blobUrl) {
            URL.revokeObjectURL(oldImage.dataset.blobUrl);
        }
        oldImage.remove();
        newImage.classList.remove('slide-in-from-left', 'slide-in-from-right');
        
        // Update the stat text (except name, which is handled separately for timing)
        slot.querySelector('.strength').textContent = `Strength: ${character.stats.strength}`;
        slot.querySelector('.speed').textContent = `Speed: ${character.stats.speed}`;
        slot.querySelector('.magic').textContent = `Magic: ${character.stats.magic}`;
        slot.querySelector('.armour').textContent = `Armour: ${character.stats.armour}`;
        
        // Update gender toggle visibility
        const genderToggle = slot.querySelector('.gender-toggle');
        if (character.variants) {
            genderToggle.style.display = 'block';
            genderToggle.textContent = slot.dataset.variant === 'Female' ? '♀' : '♂';
        } else {
            genderToggle.style.display = 'none';
        }

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

function preprocessCharacters() {
    const tasks = [];
    document.querySelectorAll('.character-slot').forEach(slot => {
        const img = slot.querySelector('.character-image');
        const color = slot.dataset.color;
        const character = characters[parseInt(slot.dataset.characterIndex, 10)];
        const cachedSrc = characterImageCache[character.img]?.[color];
        
        if (cachedSrc) {
            if (img.dataset.blobUrl) URL.revokeObjectURL(img.dataset.blobUrl);
            img.src = cachedSrc;
            img.dataset.blobUrl = cachedSrc;
        } else {
             // Fallback for safety, though should not be needed after preloading
            tasks.push(applyColorShaderToImage(img, color));
        }
    });
    return Promise.all(tasks);
}

async function preloadAllCharacterImages() {
    console.log("Preloading all character image variants...");
    const colors = ['blue', 'green', 'yellow', 'red'];
    const promises = [];

    for (const character of characters) {
        const imagesToLoad = [];
        if (character.variants) {
            Object.values(character.variants).forEach(variant => imagesToLoad.push(variant.img));
        } else {
            imagesToLoad.push(character.img);
        }

        for (const imgSrc of imagesToLoad) {
            characterImageCache[imgSrc] = {};
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Necessary for canvas operations
            img.src = imgSrc;

            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    for (const color of colors) {
                        // The character data passed to processAndCacheImage needs the baseHue
                        const characterDataForProcessing = { ...character, img: imgSrc };
                        const colorPromise = processAndCacheImage(img, characterDataForProcessing, color)
                            .then(blobUrl => {
                                if (blobUrl) {
                                    characterImageCache[imgSrc][color] = blobUrl;
                                }
                            });
                        promises.push(colorPromise);
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${imgSrc}`);
                    reject(`Failed to load image: ${imgSrc}`);
                };
            });
            await loadPromise; // Wait for each image to load before processing the next one
        }
    }

    await Promise.all(promises);
    console.log("Preloading complete.", characterImageCache);
}