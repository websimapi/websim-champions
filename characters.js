// Character data and management
const characters = [
    { name: 'Warrior', img: '/character1.png', baseHue: 240, stats: { strength: 9, speed: 5, magic: 2, armour: 8 } },
    { name: 'Archer', img: '/character2.png', baseHue: 120, stats: { strength: 6, speed: 9, magic: 4, armour: 5 } },
    { name: 'Wizard', img: '/character3.png', baseHue: 60, stats: { strength: 3, speed: 6, magic: 10, armour: 3 } },
    { name: 'Valkyrie', img: '/character4.png', baseHue: 0, stats: { strength: 7, speed: 7, magic: 6, armour: 6 } }
];

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

function preprocessCharacters() {
    const tasks = [];
    document.querySelectorAll('.character-slot').forEach(slot => {
        const img = slot.querySelector('.character-image');
        const color = slot.dataset.color;
        tasks.push(applyColorShaderToImage(img, color));
    });
    return Promise.all(tasks);
}