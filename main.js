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
let peer = null;
let peerId = null;
let connections = [];
let isHost = false;
let gameMode = null; // 'scan' or 'realtime'
let playerSlots = [
    { occupied: true, color: 'blue', characterIndex: 0, playerId: 'host', gender: 'male' }, // Player 1 (host)
    { occupied: false, color: 'green', characterIndex: 1, playerId: null, gender: 'male' }, // Player 2
    { occupied: false, color: 'yellow', characterIndex: 2, playerId: null, gender: 'male' }, // Player 3
    { occupied: false, color: 'red', characterIndex: 3, playerId: null, gender: 'male' }  // Player 4
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    forceLandscape();
    initializeRelicCursor();
    
    // Preload all character images before doing anything else
    await preloadAllCharacterImages();

    // Hide preloader
    const preloader = document.getElementById('preloader');
    preloader.classList.add('hidden');

    // Initialize networking
    initializePeerJS();

    // Now initialize the rest of the app
    initializeCharacterSelection();
    initializeStartOverlay();
});

function initializePeerJS() {
    peer = new Peer();
    
    peer.on('open', (id) => {
        peerId = id;
        console.log('PeerJS initialized with ID:', id);
        generateHostQRCode(id);
    });

    peer.on('connection', (conn) => {
        console.log('Incoming connection:', conn.peer);
        handleIncomingConnection(conn);
    });

    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
    });
}

function generateHostQRCode(peerId) {
    const qr = new QRious({
        element: document.getElementById('host-qr-code'),
        value: peerId,
        size: 200,
        foreground: '#ffffff',
        background: 'transparent'
    });

    // Also create mini QR code for in-game display
    const miniQr = new QRious({
        element: document.getElementById('mini-qr-code'),
        value: peerId,
        size: 80,
        foreground: '#ffffff',
        background: 'transparent'
    });
}

function handleIncomingConnection(conn) {
    connections.push(conn);
    
    conn.on('open', () => {
        console.log('Connection established with:', conn.peer);
        
        // Assign player to available slot
        const availableSlot = playerSlots.find(slot => !slot.occupied);
        if (availableSlot) {
            availableSlot.occupied = true;
            availableSlot.playerId = conn.peer;
            
            // Send slot assignment to new player
            conn.send({
                type: 'slot_assignment',
                slot: playerSlots.indexOf(availableSlot),
                playerSlots: playerSlots
            });
            
            // Broadcast updated player slots to all clients
            broadcastToClients({
                type: 'player_slots_update',
                playerSlots: playerSlots
            });
            
            updateCharacterSlotsUI();
        }
    });

    conn.on('data', (data) => {
        handleClientMessage(conn, data);
    });

    conn.on('close', () => {
        console.log('Connection closed:', conn.peer);
        removePlayer(conn.peer);
    });
}

function handleClientMessage(conn, data) {
    switch (data.type) {
        case 'character_change':
            // Handle character selection changes from clients
            const slot = playerSlots[data.slotIndex];
            if (slot && slot.playerId === conn.peer) {
                slot.characterIndex = data.characterIndex;
                slot.gender = data.gender || 'male';
                
                // Broadcast to all clients
                broadcastToClients({
                    type: 'player_slots_update',
                    playerSlots: playerSlots
                });
                
                updateCharacterSlotsUI();
            }
            break;
    }
}

function broadcastToClients(message) {
    connections.forEach(conn => {
        if (conn.open) {
            conn.send(message);
        }
    });
}

function removePlayer(playerId) {
    const slot = playerSlots.find(slot => slot.playerId === playerId);
    if (slot) {
        slot.occupied = false;
        slot.playerId = null;
        
        broadcastToClients({
            type: 'player_slots_update',
            playerSlots: playerSlots
        });
        
        updateCharacterSlotsUI();
    }
    
    connections = connections.filter(conn => conn.peer !== playerId);
}

function updateCharacterSlotsUI() {
    const slots = document.querySelectorAll('.character-slot');
    slots.forEach((slot, index) => {
        const playerSlot = playerSlots[index];
        
        if (playerSlot.occupied) {
            slot.classList.remove('empty');
            // Update character display based on playerSlot data
            slot.dataset.characterIndex = playerSlot.characterIndex;
            if (characters[playerSlot.characterIndex].genders) {
                slot.dataset.archerGender = playerSlot.gender;
            }
            updateCharacterSlot(slot, characters[playerSlot.characterIndex], 'fade');
        } else {
            slot.classList.add('empty');
        }
    });
}