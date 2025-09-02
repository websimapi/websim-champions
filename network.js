import { Peer } from 'peerjs';

let peer;
let myPeerId = null;

function generatePeerId() {
    // Generate a shorter, more readable ID
    return 'achamps-' + Math.random().toString(36).substr(2, 6);
}

function initializePeer(peerId) {
    console.log('Initializing peer with ID:', peerId);
    peer = new Peer(peerId, {
        // Add PeerJS server options here if needed, e.g., for a self-hosted server
    });

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('My peer ID is: ' + id);
        showQrCode(id);
    });

    peer.on('connection', (conn) => {
        console.log('Connected to:', conn.peer);
        // Handle incoming connection
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        // Handle errors, e.g., ID is taken
        if (err.type === 'unavailable-id') {
            console.log(`ID ${peerId} is unavailable. Retrying with a new ID...`);
            initializePeer(generatePeerId()); // Retry with a new ID
        }
    });
}

function showQrCode(peerId) {
    console.log('Showing QR code for peer ID:', peerId);
    const qrContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qr-code');

    if (!qrContainer || !qrCodeDiv) {
        console.error('QR code containers not found');
        return;
    }

    // Clear previous QR code if any
    qrCodeDiv.innerHTML = ''; 

    try {
        new QRCode(qrCodeDiv, {
            text: peerId,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        qrContainer.classList.remove('hidden');
        console.log('QR code displayed successfully');
    } catch (error) {
        console.error('Error creating QR code:', error);
    }
}

document.addEventListener('start-hosting', () => {
    console.log("Starting session as host...");
    const peerId = generatePeerId();
    console.log("Generated peer ID:", peerId);
    initializePeer(peerId);
});

document.addEventListener('start-joining', (event) => {
    const hostPeerId = event.detail.peerId;
    console.log(`Attempting to join host: ${hostPeerId}`);

    // We don't need a specific ID to connect, PeerJS will assign one.
    if (!peer) {
        peer = new Peer();
        peer.on('open', (id) => {
            myPeerId = id;
            console.log('My peer ID is: ' + id);

            // Now that we have an ID, connect to the host
            const conn = peer.connect(hostPeerId);
            conn.on('open', () => {
                console.log(`Connection to ${hostPeerId} established.`);
                // Send a 'hello' message or player data
                conn.send('Hello from new player!');
            });
        });
        peer.on('error', (err) => console.error('PeerJS error:', err));
    } else {
        // Peer object already exists, just connect
        const conn = peer.connect(hostPeerId);
        conn.on('open', () => {
            console.log(`Connection to ${hostPeerId} established.`);
            conn.send('Hello from new player!');
        });
    }
});