// Color shader and recoloring system
const slotColors = {
    blue: 240,
    green: 120,
    yellow: 60,
    red: 0
};
const grayscaleCache = {};
const cleanupCache = {};

// Apply CSS filter to shift image color
function applyColorShader(slot) {
    const image = slot.querySelector('.character-image');
    const slotColorName = slot.dataset.color;
    const character = characters[parseInt(slot.dataset.characterIndex, 10)];
    processAndCacheImage(image, character, slotColorName).then(blobUrl => {
        if (blobUrl) { if (image.dataset.blobUrl) URL.revokeObjectURL(image.dataset.blobUrl); image.src = blobUrl; image.dataset.blobUrl = blobUrl; }
    });
}

function applyColorShaderToImage(image, slotColorName) {
    if (!image) return Promise.resolve();
    return new Promise(resolve => {
        const process = async () => {
            const slot = image.closest('.character-slot');
            const idx = slot ? parseInt(slot.dataset.characterIndex, 10) : 0;
            const character = characters[idx] || { name: 'Unknown' };
            const blobUrl = await processAndCacheImage(image, character, slotColorName);
            if (blobUrl) { if (image.dataset.blobUrl) URL.revokeObjectURL(image.dataset.blobUrl); image.src = blobUrl; image.dataset.blobUrl = blobUrl; }
            resolve();
        };
        if (image.complete && image.naturalWidth) process(); else image.addEventListener('load', process, { once: true });
    });
}

function processAndCacheImage(img, characterData, slotColorName) {
    return (async () => {
        const src = img.src;
        const cleaned = cleanupCache[src] || (cleanupCache[src] = await cleanSprite(img, true));
        const gkey = cleaned || src;
        const g = grayscaleCache[gkey] || (grayscaleCache[gkey] = await grayscaleQuantize(await loadImage(gkey), true));
        const gimg = await loadImage(g);
        return paletteRecolor(gimg, characterData, slotColorName, true);
    })();
}