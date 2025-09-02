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
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isPortrait) {
                document.body.classList.add('force-landscape');
            } else {
                document.body.classList.remove('force-landscape');
            }
        }
        
        // Check orientation on load and on any change
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        // orientationchange is sometimes more reliable
        window.addEventListener('orientationchange', () => {
            // A small delay can help get the correct dimensions after orientation change
            setTimeout(checkOrientation, 100);
        });
    }
}