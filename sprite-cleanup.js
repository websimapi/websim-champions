// Removes stray pixels outside the body by keeping only the largest connected opaque regions
(function(){
  function neighbors4(x, y, w, h){
    const n = [];
    if (x > 0) n.push([x-1, y]);
    if (x < w-1) n.push([x+1, y]);
    if (y > 0) n.push([x, y-1]);
    if (y < h-1) n.push([x, y+1]);
    return n;
  }

  async function cleanSprite(imgEl, returnBlobUrl = true) {
    return new Promise((resolve) => {
      const run = () => {
        try {
          const w = imgEl.naturalWidth || imgEl.width;
          const h = imgEl.naturalHeight || imgEl.height;
          if (!w || !h) { resolve(returnBlobUrl ? null : undefined); return; }

          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(imgEl, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const p = imgData.data;

          const alphaThresh = 10;
          const mask = new Uint8Array(w * h);
          for (let i = 0, j = 0; i < p.length; i += 4, j++) {
            mask[j] = p[i+3] > alphaThresh ? 1 : 0;
          }

          // Connected components labeling (4-neighborhood)
          const labels = new Int32Array(w * h).fill(-1);
          const sizes = [];
          let label = 0;
          const qx = new Int32Array(w * h);
          const qy = new Int32Array(w * h);

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              if (!mask[idx] || labels[idx] !== -1) continue;

              let head = 0, tail = 0;
              qx[tail] = x; qy[tail] = y; tail++;
              labels[idx] = label;
              let size = 0;

              while (head < tail) {
                const cx = qx[head], cy = qy[head]; head++;
                size++;
                const nb = neighbors4(cx, cy, w, h);
                for (let k = 0; k < nb.length; k++) {
                  const nx = nb[k][0], ny = nb[k][1];
                  const nidx = ny * w + nx;
                  if (mask[nidx] && labels[nidx] === -1) {
                    labels[nidx] = label;
                    qx[tail] = nx; qy[tail] = ny; tail++;
                  }
                }
              }
              sizes[label] = size;
              label++;
            }
          }

          if (label === 0) {
            // no opaque pixels — return original
            resolve(returnBlobUrl ? null : undefined);
            return;
          }

          // Keep largest region and any region above a small area threshold
          let maxLabel = 0, maxSize = sizes[0];
          for (let i = 1; i < sizes.length; i++) {
            if (sizes[i] > maxSize) { maxSize = sizes[i]; maxLabel = i; }
          }
          const areaThreshold = Math.max(100, Math.floor(0.003 * w * h)); // keep meaningful parts
          const keep = new Uint8Array(sizes.length);
          keep[maxLabel] = 1;
          for (let i = 0; i < sizes.length; i++) {
            if (sizes[i] >= areaThreshold) keep[i] = 1;
          }

          // Zero alpha for pixels not in kept components
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = y * w + x;
              const lab = labels[idx];
              if (mask[idx] && (lab === -1 || !keep[lab])) {
                p[idx*4 + 3] = 0;
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          c.toBlob((blob) => {
            if (!blob) { resolve(returnBlobUrl ? null : undefined); return; }
            const url = URL.createObjectURL(blob);
            resolve(returnBlobUrl ? url : undefined);
          });
        } catch (e) {
          console.warn('[SpriteCleanup] Failed, skipping', e);
          resolve(returnBlobUrl ? null : undefined);
        }
      };
      if (imgEl.complete && imgEl.naturalWidth) run(); else imgEl.addEventListener('load', run, { once: true });
    });
  }

  window.cleanSprite = cleanSprite;
})();