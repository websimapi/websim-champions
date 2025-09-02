// UI interaction management
function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach((slot, index) => {
        // Initial setup
        const slotData = playerSlots[index];
        if (!slotData.occupied) {
            slot.classList.add('empty');
        }

        // Initial gender setup for archer
        if(slot.dataset.characterIndex === '1') {
            slot.dataset.archerGender = 'male';
            slot.querySelector('.gender-toggle-container').style.visibility = 'visible';
        }

        // Initial color shader application
        applyColorShader(slot);

        // Arrow click listeners for character swapping (only for host or own slot)
        const leftArrow = slot.querySelector('.left-arrow');
        const rightArrow = slot.querySelector('.right-arrow');

        leftArrow.addEventListener('click', () => {
            if (!canControlSlot(index)) return;
            
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex - 1 + characters.length) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'left');
            
            // Update player slot data and broadcast if host
            if (isHost || index === 0) {
                playerSlots[index].characterIndex = currentIndex;
                if (isHost && connections.length > 0) {
                    broadcastToClients({
                        type: 'player_slots_update',
                        playerSlots: playerSlots
                    });
                }
            }
        });

        rightArrow.addEventListener('click', () => {
            if (!canControlSlot(index)) return;
            
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            slot.dataset.characterIndex = currentIndex;
            updateCharacterSlot(slot, characters[currentIndex], 'right');
            
            // Update player slot data and broadcast if host
            if (isHost || index === 0) {
                playerSlots[index].characterIndex = currentIndex;
                if (isHost && connections.length > 0) {
                    broadcastToClients({
                        type: 'player_slots_update',
                        playerSlots: playerSlots
                    });
                }
            }
        });

        // Gender toggle listeners
        const genderToggles = slot.querySelectorAll('.gender-toggle');
        genderToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                if (!canControlSlot(index)) return;
                
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
                    updateCharacterSlot(slot, currentCharacter, 'fade');
                }
                
                // Update player slot data and broadcast if host
                if (isHost || index === 0) {
                    playerSlots[index].gender = newGender;
                    if (isHost && connections.length > 0) {
                        broadcastToClients({
                            type: 'player_slots_update',
                            playerSlots: playerSlots
                        });
                    }
                }
            });
        });
    });
}

function canControlSlot(slotIndex) {
    // Host can control all slots, clients can only control their assigned slot
    if (isHost) return true;
    if (slotIndex === 0) return true; // Always allow player 1 (could be client or host)
    
    // For clients, check if this is their assigned slot
    const slot = playerSlots[slotIndex];
    return slot.occupied && slot.playerId === peerId;
}

// Set up the start overlay
function initializeStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');
    const scanBtn = document.getElementById('scan-to-play-btn');
    const realtimeBtn = document.getElementById('realtime-mode-btn');
    
    scanBtn.addEventListener('click', () => {
        if (peerId) {
            // Check if we want to host or scan to join
            if (scanBtn.textContent === 'Scan To Play') {
                // Switch to camera mode
                scanBtn.textContent = 'Host Game';
                startCameraScanner();
            } else {
                // Start as host
                startScanToPlayMode();
            }
        } else {
            console.log('PeerJS not ready yet');
        }
    });

    realtimeBtn.addEventListener('click', () => {
        // Disabled for now
        console.log('Realtime mode not implemented yet');
    });
}

function startScanToPlayMode() {
    gameMode = 'scan';
    isHost = true;
    
    // Hide start overlay
    document.getElementById('start-overlay').classList.add('hidden');
    
    // Show mini QR code in top right
    document.getElementById('host-qr-display').classList.add('visible');
    
    // Initialize audio
    initializeAudio();
    
    console.log('Started Scan to Play mode as host with ID:', peerId);
}

async function startCameraScanner() {
    const cameraOverlay = document.getElementById('camera-scanner');
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    const closeBtn = document.getElementById('close-camera');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' } // Use back camera if available
        });
        
        video.srcObject = stream;
        cameraOverlay.classList.remove('hidden');
        
        // Scanning loop
        const scanLoop = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code && code.data) {
                    console.log('QR Code detected:', code.data);
                    joinGame(code.data);
                    stopCameraScanner(stream);
                    return;
                }
            }
            
            requestAnimationFrame(scanLoop);
        };
        
        video.addEventListener('loadedmetadata', () => {
            scanLoop();
        });
        
        closeBtn.addEventListener('click', () => {
            stopCameraScanner(stream);
        }, { once: true });
        
    } catch (error) {
        console.error('Camera access failed:', error);
        alert('Camera access is required to scan QR codes');
    }
}

function stopCameraScanner(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-scanner').classList.add('hidden');
}

function joinGame(hostId) {
    console.log('Attempting to join game with host:', hostId);
    isHost = false;
    
    const conn = peer.connect(hostId);
    
    conn.on('open', () => {
        console.log('Connected to host:', hostId);
        connections = [conn]; // Client only has one connection (to host)
        
        // Hide start overlay
        document.getElementById('start-overlay').classList.add('hidden');
        
        // Initialize audio
        initializeAudio();
    });
    
    conn.on('data', (data) => {
        handleHostMessage(data);
    });
    
    conn.on('close', () => {
        console.log('Disconnected from host');
        // Could show reconnection UI here
    });
}

function handleHostMessage(data) {
    switch (data.type) {
        case 'slot_assignment':
            console.log('Assigned to slot:', data.slot);
            // Update UI based on current game state
            playerSlots = data.playerSlots;
            updateCharacterSlotsUI();
            break;
            
        case 'player_slots_update':
            playerSlots = data.playerSlots;
            updateCharacterSlotsUI();
            break;
    }
}