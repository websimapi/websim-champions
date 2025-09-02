// Mobile and orientation handling
function handleMobileLayout() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    function adjustLayout() {
        const body = document.body;
        if (window.screen.height > window.screen.width) { // Check physical orientation
            // Portrait mode: force landscape view via CSS
            body.classList.add('force-landscape');
            const newWidth = window.screen.height;
            const newHeight = window.screen.width;
            body.style.width = `${newWidth}px`;
            body.style.height = `${newHeight}px`;
        } else {
            // Landscape mode: normal view
            body.classList.remove('force-landscape');
            body.style.width = '';
            body.style.height = '';
        }
    }

    // Adjust on load and when orientation changes
    window.addEventListener('orientationchange', () => setTimeout(adjustLayout, 100));
    adjustLayout();
}

async function lockScreen() {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        }
        
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch(err => {
                 console.warn("Could not lock orientation, but continuing.", err);
            });
        }
    } catch (err) {
        console.warn("Could not enter fullscreen or lock orientation:", err);
    }
}