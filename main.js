// Main initialization and coordination
import { initializeNetwork } from './network.js';
import { initializeUI } from './ui.js';

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
document.addEventListener('DOMContentLoaded', async () => {
    forceLandscape();
    initializeRelicCursor();
    
    // Preload all character images before doing anything else
    await preloadAllCharacterImages();

    // Hide preloader
    const preloader = document.getElementById('preloader');
    preloader.classList.add('hidden');

    // Initialize UI elements like start screen and scanner
    initializeUI();

    // Initialize networking, which will handle game state and player connections
    await initializeNetwork();
});