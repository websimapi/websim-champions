// Main initialization and coordination
// removed character data - now in characters.js
// removed WebAudio setup and sound functions - now in audio.js  
// removed color shader functions - now in color-shader.js
// removed updateCharacterSlot() function - now in characters.js
// removed initializeCharacterSelection() function - now in ui.js
// removed forceLandscape() function - now in mobile.js
// removed initializeStartOverlay() function - now in ui.js
// removed initializeRelicCursor() function - now in cursor.js
// removed preprocessCharacters() function - now in characters.js

let preprocessPromise = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMobile();
    initializeCharacterSelection();
    preprocessPromise = preprocessCharacters();
    window.preprocessPromise = preprocessPromise; // Make available globally
    initializeStartOverlay();
    initializeRelicCursor();
});