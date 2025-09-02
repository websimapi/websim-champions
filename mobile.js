// Mobile and orientation handling
function forceLandscape() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Add class for mobile-specific styling
        document.body.classList.add('mobile');
        
        // Hide orientation message permanently, we will force the layout
        const message = document.getElementById('orientation-message');
        if (message) message.style.display = 'none';

        function checkOrientation() {
            // Screen API for more reliable orientation detection
            const isPortrait = screen.orientation ? screen.orientation.type.includes('portrait') : window.innerHeight > window.innerWidth;

            if (isPortrait) {
                document.body.classList.add('force-landscape');
            } else {
                document.body.classList.remove('force-landscape');
            }
        }
        
        // Check orientation on load and on any change
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        
        // Use screen.orientation if available, otherwise fallback to orientationchange
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                setTimeout(checkOrientation, 100);
            });
        } else {
            window.addEventListener('orientationchange', () => {
                setTimeout(checkOrientation, 100);
            });
        }
    }
}