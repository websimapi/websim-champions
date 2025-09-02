import { startScanner, stopScanner } from './qr.js';

// UI interaction management
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach(slot => {
        // Initial gender setup for archer
        if(slot.dataset.characterIndex === '1') {
            slot.dataset.archerGender = 'male';
            slot.querySelector('.gender-toggle-container').style.visibility = 'visible';
        }

        // Initial color shader application
        applyColorShader(slot);

        // Arrow click listeners for character swapping
        const leftArrow = slot.querySelector('.left-arrow');
        const rightArrow = slot.querySelector('.right-arrow');

        leftArrow.addEventListener('click', () => {
            if (slot.classList.contains('locked')) return;
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex - 1 + characters.length) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'left');
        });

        rightArrow.addEventListener('click', () => {
            if (slot.classList.contains('locked')) return;
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'right');
        });

        // Gender toggle listeners
        const genderToggles = slot.querySelectorAll('.gender-toggle');
        genderToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                if (slot.classList.contains('locked')) return;
                const newGender = toggle.dataset.gender;
                if (slot.dataset.archerGender === newGender) return; // No change

                // Update state and UI
                slot.dataset.archerGender = newGender;
                genderToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');

                // Trigger character update
                const currentIndex = parseInt(slot.dataset.characterIndex, 10);
                const currentCharacter = characters[currentIndex];
                if (currentCharacter.genders) {
                    // Use a subtle fade for gender swap
                    updateCharacterSlot(slot, currentCharacter, 'fade');
                }
            });
        });
    });
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');
    const scanButton = document.getElementById('scan-to-play');

    scanButton.addEventListener('click', () => {
        const scannerContainer = document.getElementById('qr-scanner-container');
        scannerContainer.classList.remove('hidden');
        startScanner('qr-reader', (decodedText, decodedResult) => {
            // on successful scan
            console.log(`Scan result: ${decodedText}`);
            stopScanner();
            scannerContainer.classList.add('hidden');
            
            // Redirect to join the host's game
            window.location.href = decodedText;
        });
    });

    // The start overlay is now hidden by network.js after connection
}

function initializeScannerControls() {
    const closeButton = document.getElementById('close-scanner');
    const scannerContainer = document.getElementById('qr-scanner-container');

    closeButton.addEventListener('click', () => {
        stopScanner();
        scannerContainer.classList.add('hidden');
    });
}

export function initializeUI() {
    initializeStartOverlay();
    initializeScannerControls();
    initializeCharacterSelection();
}

export function activatePlayerSlot(playerNum, isHost = false) {
    const slot = document.querySelector(`.character-slot[data-player="${playerNum}"]`);
    if (slot && slot.classList.contains('empty')) {
        slot.classList.remove('empty');
        slot.querySelector('.character-image').style.display = 'block';
        slot.querySelector('.character-stats').style.visibility = 'visible';
        
        if (!isHost) {
            // Lock controls for non-host players viewing other slots
            slot.classList.add('locked');
        }
        
        // Initial character setup
        const charIndex = parseInt(slot.dataset.characterIndex, 10);
        updateCharacterSlot(slot, characters[charIndex], 'fade'); 
    }
}