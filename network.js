
```
import { generateQRCode } from './qr.js';
import { activatePlayerSlot } from './ui.js';

const room = new WebsimSocket();

async function initializeNetwork() {
    await room.initialize();
    console.log('Websim initialized. Client ID:', room.clientId);

    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');

    if (joinId) {
        // This is a client joining a game
        console.log('Joining game of host:', joinId);
        // In a real scenario, you might send a join request.
        // For now, we assume joining is automatic by being in the same room.
        // We'll let the host assign us a slot.
    } else {
        // This is the host
        console.log('This client is the host.');
        setupAsHost();
    }

    // Everyone subscribes to room state changes
    room.subscribeRoomState(handleRoomStateUpdate);

    // Everyone subscribes to presence to know who is connected
    room.subscribePresence(handlePresenceUpdate);

    // Hide start overlay and show character selection
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('qr-code-display').classList.remove('hidden');
    initializeAudio(); // Start audio after user interaction with start screen
}

function setupAsHost() {
    // Generate QR code for others to join
    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${room.clientId}`;
    generateQRCode('qr-code-container-main', joinUrl);
    generateQRCode('qr-code-container-ingame', joinUrl);

    // Host takes the first slot
    const initialRoomState = {
        playerSlots: {
            '1': {
                clientId: room.clientId,
                characterIndex: 0,
                archerGender: 'male',
            }
        }
    };
    room.updateRoomState(initialRoomState);
}

function handleRoomStateUpdate(roomState) {
    console.log('Room state updated:', roomState);
    if (roomState && roomState.playerSlots) {
        // Update all player slots based on the shared state
        for (const playerNum in roomState.playerSlots) {
            const slotData = roomState.playerSlots[playerNum];
            if (slotData) {
                activatePlayerSlot(playerNum, slotData.clientId === room.clientId);
            }
        }
    }
}

function handlePresenceUpdate(presence) {
    console.log("Presence updated:", presence);

    // Host-only logic: check for new players and assign them a slot
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('join')) { // Only the host should manage slots
        const currentSlots = room.roomState.playerSlots || {};
        const takenClientIds = Object.values(currentSlots).map(s => s.clientId);

        for (const clientId in presence) {
            if (clientId !== room.clientId && !takenClientIds.includes(clientId)) {
                // Found a new client that needs a slot
                assignSlotToNewPlayer(clientId, currentSlots);
                break; // Assign one player at a time
            }
        }
    }
}

function assignSlotToNewPlayer(clientId, currentSlots) {
    console.log(`Assigning slot to new player: ${clientId}`);
    // Find the first available slot (from 2 to 4)
    for (let i = 2; i <= 4; i++) {
        const playerNum = i.toString();
        if (!currentSlots[playerNum]) {
            room.updateRoomState({
                playerSlots: {
                    ...currentSlots,
                    [playerNum]: {
                        clientId: clientId,
                        characterIndex: i - 1,
                        archerGender: 'male',
                    }
                }
            });
            console.log(`Assigned player ${clientId} to slot ${playerNum}`);
            return; // Exit after assigning
        }
    }
    console.log("No available slots for new player.");
}

export { initializeNetwork, room };