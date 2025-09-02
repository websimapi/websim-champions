// Mobile and touch handling
function forceLandscape() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Add class for mobile-specific styling
        document.body.classList.add('mobile');
        
        // Add mobile-specific touch optimizations
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Lock orientation to landscape if supported
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                console.log('Orientation lock not supported');
            });
        }
        
        // Show orientation message if in portrait
        function checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                showOrientationMessage();
            } else {
                hideOrientationMessage();
            }
        }
        
        function showOrientationMessage() {
            let message = document.getElementById('orientation-message');
            if (!message) {
                message = document.createElement('div');
                message.id = 'orientation-message';
                message.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        color: white;
                        text-align: center;
                        font-family: 'Cinzel', serif;
                    ">
                        <div>
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📱</div>
                            <div style="font-size: 1.5rem; font-weight: 600;">Please rotate your device</div>
                            <div style="font-size: 1rem; margin-top: 0.5rem; opacity: 0.8;">This game is best played in landscape mode</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(message);
            }
        }
        
        function hideOrientationMessage() {
            const message = document.getElementById('orientation-message');
            if (message) {
                message.remove();
            }
        }
        
        // Check orientation on load and resize
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });
    }
}