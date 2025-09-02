// Mobile and orientation handling
function forceLandscape() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Add class for mobile-specific styling
        document.body.classList.add('mobile');
        
        // Try to lock orientation to landscape if supported
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {
                console.log('Orientation lock not supported or failed.');
            });
        }
        
        // Show orientation message if in portrait
        function checkOrientation() {
            // Use innerWidth/innerHeight for layout viewport, which is more reliable
            const isPortrait = window.innerHeight > window.innerWidth;
            const message = document.getElementById('orientation-message');
            const mainContent = document.querySelector('.character-selection');

            if (message && mainContent) {
                if (isPortrait) {
                    message.style.display = 'flex';
                    mainContent.style.display = 'none';
                } else {
                    message.style.display = 'none';
                    mainContent.style.display = 'flex';
                }
            }
        }
        
        // Check orientation on load and on any change
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            // A small delay can help get the correct dimensions after orientation change
            setTimeout(checkOrientation, 100);
        });
    }
}