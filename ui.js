// UI interaction management

function createGlowingSkullOverlay(slotColorName) {
    const skullOverlay = document.createElement('div');
    skullOverlay.className = 'skull-overlay';
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const skullImg = new Image();
    skullImg.src = '/skull.png';

    skullImg.onload = () => {
        const color = slotColors[slotColorName];
        if (typeof color === 'undefined') {
            // Fallback for safety, draw skull without glow
            ctx.drawImage(skullImg, 0, 0, canvas.width, canvas.height);
            return;
        }

        const brightColor = `hsl(${color}, 100%, 80%)`;
        const midColor = `hsl(${color}, 100%, 50%)`;

        // Define socket positions (normalized)
        const sockets = [
            { x: 0.35, y: 0.45, r: 0.12 }, // Left Eye
            { x: 0.65, y: 0.45, r: 0.12 }, // Right Eye
            { x: 0.5, y: 0.6, r: 0.08 }    // Nose
        ];

        ctx.globalCompositeOperation = 'source-over';
        
        // Draw glows
        sockets.forEach(socket => {
            const gx = socket.x * canvas.width;
            const gy = socket.y * canvas.height;
            const gr = socket.r * canvas.width;

            const gradient = ctx.createRadialGradient(gx, gy, gr * 0.1, gx, gy, gr);
            gradient.addColorStop(0, brightColor);
            gradient.addColorStop(0.5, midColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(gx, gy, gr, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw skull image on top
        ctx.drawImage(skullImg, 0, 0, canvas.width, canvas.height);
    };
    
    skullOverlay.appendChild(canvas);
    return skullOverlay;
}

function initializeCharacterSelection() {
    const characterSlots = document.querySelectorAll('.character-slot');

    characterSlots.forEach((slot, index) => {
        // Initial setup
        const slotData = playerSlots[index];
        if (!slotData.occupied) {
            slot.classList.add('empty');
            // ensure skull overlay exists for empty slots on load
            if (!slot.querySelector('.skull-overlay')) {
                const wrap = slot.querySelector('.character-image-wrapper');
                const skull = createGlowingSkullOverlay(slot.dataset.color);
                wrap.appendChild(skull);
            }
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
            
            if (isHost) {
                updateCharacterSlot(slot, characters[currentIndex], 'left');
                playerSlots[index].characterIndex = currentIndex;
                broadcastToClients({ type: 'character_change', slotIndex: index, characterIndex: currentIndex, direction: 'left' });
            } else {
                slot.querySelectorAll('.arrow, .gender-toggle').forEach(el => el.disabled = true);
                sendToHost({ type: 'character_change', slotIndex: index, characterIndex: currentIndex, direction: 'left' });
            }
        });

        rightArrow.addEventListener('click', () => {
            if (!canControlSlot(index)) return;
            
            let currentIndex = parseInt(slot.dataset.characterIndex, 10);
            currentIndex = (currentIndex + 1) % characters.length;
            
            if (isHost) {
                updateCharacterSlot(slot, characters[currentIndex], 'right');
                playerSlots[index].characterIndex = currentIndex;
                broadcastToClients({ type: 'character_change', slotIndex: index, characterIndex: currentIndex, direction: 'right' });
            } else {
                slot.querySelectorAll('.arrow, .gender-toggle').forEach(el => el.disabled = true);
                sendToHost({ type: 'character_change', slotIndex: index, characterIndex: currentIndex, direction: 'right' });
            }
        });

        // Gender toggle listeners
        const genderToggles = slot.querySelectorAll('.gender-toggle');
        genderToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                if (!canControlSlot(index)) return;
                
                const newGender = toggle.dataset.gender;
                if (slot.dataset.archerGender === newGender) return; // No change

                if (isHost) {
                    slot.dataset.archerGender = newGender;
                    genderToggles.forEach(t => t.classList.toggle('active', t.dataset.gender === newGender));
                    updateCharacterSlot(slot, characters[parseInt(slot.dataset.characterIndex, 10)], 'fade');
                    playerSlots[index].gender = newGender;
                    broadcastToClients({ type: 'gender_change', slotIndex: index, gender: newGender });
                } else {
                    slot.querySelectorAll('.arrow, .gender-toggle').forEach(el => el.disabled = true);
                    sendToHost({ type: 'gender_change', slotIndex: index, gender: newGender });
                }
            });
        });

        // Desktop: click empty slot to switch into it
        slot.addEventListener('click', () => {
            const finePointer = window.matchMedia('(pointer: fine)').matches;
            if (!finePointer) return;
            if (playerSlots[index]?.occupied) return;
            requestSlotSwitch(index);
        });
    });
    setupMobileSlotPicker();
}

function setupMobileSlotPicker() {
    const picker = document.getElementById('mobile-slot-picker');
    if (!picker) return;
    const isMobile = document.body.classList.contains('mobile');
    picker.classList.toggle('hidden', !isMobile);
    picker.querySelectorAll('.slot-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.slot, 10);
            if (playerSlots[idx]?.occupied) return;
            requestSlotSwitch(idx);
        });
    });
    updateMobileSlotPicker();
}

function updateMobileSlotPicker() {
    const picker = document.getElementById('mobile-slot-picker');
    if (!picker) return;
    picker.querySelectorAll('.slot-pill').forEach(btn => {
        const idx = parseInt(btn.dataset.slot, 10);
        btn.classList.toggle('occupied', !!playerSlots[idx]?.occupied);
    });
}

function canControlSlot(slotIndex) {
    // Host can control any slot; clients only their assigned slot.
    const slotData = playerSlots[slotIndex];
    if (isHost) return true;
    return slotData.occupied && slotData.playerId === peerId;
}

function requestSlotSwitch(targetIndex) {
    if (isHost) {
        hostSwitchToSlot(targetIndex);
    } else {
        sendToHost({ type: 'slot_switch', targetIndex });
    }
}