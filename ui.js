// UI interaction management

let html5QrCode = null;

function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot:not(.empty-slot)');

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

        // Gender toggle listeners
        const genderToggles = slot.querySelectorAll('.gender-toggle');
        genderToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
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
    const hostBtn = document.getElementById('host-game-btn');
    const joinBtn = document.getElementById('scan-to-join-btn');
    const qrScannerContainer = document.getElementById('qr-scanner-container');
    const closeScannerBtn = document.getElementById('close-scanner-btn');

    hostBtn.addEventListener('click', async () => {
        startOverlay.classList.add('hidden');
        await initializeAudio();
        // The network module will handle creating the peer and showing the QR code
        document.dispatchEvent(new CustomEvent('start-hosting'));
    });

    joinBtn.addEventListener('click', () => {
        qrScannerContainer.classList.remove('hidden');
        startQrScanner();
    });

    closeScannerBtn.addEventListener('click', () => {
        stopQrScanner();
        qrScannerContainer.classList.add('hidden');
    });
}

function startQrScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        stopQrScanner();
        document.getElementById('qr-scanner-container').classList.add('hidden');
        
        // Connect to the host
        document.dispatchEvent(new CustomEvent('start-joining', { detail: { peerId: decodedText }}));

        // Hide start overlay if it's still visible
        const startOverlay = document.getElementById('start-overlay');
        if (!startOverlay.classList.contains('hidden')) {
            startOverlay.classList.add('hidden');
            initializeAudio();
        }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Prefer the back camera
            const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
            html5QrCode.start(
                cameraId,
                config,
                qrCodeSuccessCallback,
                (errorMessage) => { /* console.log(errorMessage) */ }
            ).catch((err) => {
                console.error("Unable to start scanning.", err);
            });
        }
    }).catch(err => {
        console.error("Error getting cameras", err);
    });
}

function stopQrScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then((ignore) => {
            // QR Code scanning is stopped.
        }).catch((err) => {
            // Stop failed, handle it.
            console.error("Failed to stop QR scanner.", err);
        });
    }
}