
```
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

let html5QrcodeScanner;

export function generateQRCode(elementId, text) {
    const container = document.getElementById(elementId);
    if (!container) {
        console.error(`QR Code container with id ${elementId} not found.`);
        return;
    }
    const canvas = document.createElement('canvas');
    container.innerHTML = ''; // Clear previous QR code
    container.appendChild(canvas);

    QRCode.toCanvas(canvas, text, { width: container.clientWidth }, function (error) {
        if (error) console.error(error);
        console.log(`QR Code generated for: ${text}`);
    });
}

export function startScanner(elementId, onScanSuccess) {
    if (html5QrcodeScanner && html5QrcodeScanner.getState() === 2) { // 2 is SCANNING state
        console.log("Scanner is already running.");
        return;
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        elementId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

export function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner.", error);
        });
        html5QrcodeScanner = null;
    }
}