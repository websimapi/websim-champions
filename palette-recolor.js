// Palette-based recolor: 8 grayscale bands -> slot color + per-character accents + skin + hair
(function(){
  const SLOT_HUES = { blue: 240, green: 120, yellow: 60, red: 0 };
  const DEFAULT_PALETTES = {
    Warrior: { skinH: 28, skinS: 0.45, skinL: 0.72, unique1: '#9aa3ad', unique2: '#6b3f1f' },
    Archer:  { skinH: 30, skinS: 0.55, skinL: 0.60, unique1: '#8b5a2b', unique2: '#2e8b57' },
    Wizard:  { skinH: 25, skinS: 0.25, skinL: 0.82, unique1: '#c9a227', unique2: '#1f2a44' },
    Valkyrie:{ skinH: 22, skinS: 0.35, skinL: 0.85, unique1: '#b7c2cc', unique2: '#7a1322' },
    Unknown: { skinH: 25, skinS: 0.35, skinL: 0.80, unique1: '#888888', unique2: '#555555' }
  };

  function hexToRgb(hex){ const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:128,g:128,b:128}; }
  function hslToRgb(h,s,l){ const c=(1-Math.abs(2*l-1))*s, hp=h/60, x=c*(1-Math.abs((hp%2)-1)); let r1=0,g1=0,b1=0;
    if(hp>=0&&hp<1){r1=c;g1=x;} else if(hp<2){r1=x;g1=c;} else if(hp<3){g1=c;b1=x;} else if(hp<4){g1=x;b1=c;} else if(hp<5){r1=x;b1=c;} else {r1=c;b1=x;}
    const m=l-c/2; return {r:Math.round((r1+m)*255), g:Math.round((g1+m)*255), b:Math.round((b1+m)*255)}; }
  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  // Map luma to nearest of the 8 exact grayscale levels used by assets
  const LEVELS = [0, 32, 64, 96, 128, 160, 192, 255];
  function bandForLuma(y){
    let idx=0, min=1e9;
    for(let i=0;i<LEVELS.length;i++){ const d=Math.abs(y-LEVELS[i]); if(d<min){min=d; idx=i;} }
    return idx;
  }

  function slotShadeColor(hue, band, px, py, w, h){
    const shadeIdx = band - 1; // 0..3
    const baseSat = [0.65, 0.70, 0.75, 0.80][shadeIdx];
    const baseLight = [0.28, 0.42, 0.60, 0.78][shadeIdx];
    // subtle vertical gradient: slightly brighter towards upper areas
    const grad = (py / h);
    const lightGradAdj = (0.5 - grad) * 0.06; // -0.03..+0.03
    // micro-dither to break flat bands (hash without RNG)
    const n = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
    const frac = n - Math.floor(n);
    const noiseL = (frac - 0.5) * 0.05; // +/- 0.025
    const noiseS = (frac - 0.5) * 0.03; // +/- 0.015
    const s = clamp01(baseSat + noiseS);
    const l = clamp01(baseLight + lightGradAdj + noiseL);
    return hslToRgb(hue, s, l);
  }

  function skinColor(palette, luma){ // keep some shading from original luma
    const s = palette.skinS, h = palette.skinH;
    const baseL = palette.skinL;
    const shade = (luma - 200) / 55 * 0.10; // -0.10..+0.10
    return hslToRgb(h, s, clamp01(baseL + shade));
  }

  function paletteFor(character){
    const name = character?.name || 'Unknown';
    return DEFAULT_PALETTES[name] || DEFAULT_PALETTES.Unknown;
  }

  function getLuma(r,g,b){ return Math.round(0.2126*r + 0.7152*g + 0.0722*b); }

  async function paletteRecolor(img, character, slotColorName, returnBlob=true){
    return new Promise(resolve=>{
      const run=()=>{
        try{
          const c=document.createElement('canvas'), x=c.getContext('2d',{willReadFrequently:true});
          c.width=img.naturalWidth; c.height=img.naturalHeight;
          x.drawImage(img,0,0);
          const d=x.getImageData(0,0,c.width,c.height), p=d.data;
          const hue=SLOT_HUES[slotColorName] ?? 240;
          const pal=paletteFor(character);
          const u1=hexToRgb(pal.unique1), u2=hexToRgb(pal.unique2);
          for(let i=0;i<p.length;i+=4){
            const a=p[i+3]; if(a<5) continue;
            const r=p[i], g=p[i+1], b=p[i+2];
            const y=getLuma(r,g,b);
            const band=bandForLuma(y);
            let R=r,G=g,B=b;
            const pixelIndex = i / 4;
            const px = pixelIndex % c.width;
            const py = Math.floor(pixelIndex / c.width);
            if (band===0){ R=0; G=0; B=0; } // hair
            else if (band>=1 && band<=4){ const col=slotShadeColor(hue, band, px, py, c.width, c.height); R=col.r; G=col.g; B=col.b; }
            else if (band===5){ R=u1.r; G=u1.g; B=u1.b; }
            else if (band===6){ R=u2.r; G=u2.g; B=u2.b; }
            else { const col=skinColor(pal, y); R=col.r; G=col.g; B=col.b; }
            p[i]=R; p[i+1]=G; p[i+2]=B;
          }
          x.putImageData(d,0,0);
          c.toBlob(blob=>{
            if(!blob){ resolve(returnBlob?null:undefined); return; }
            const url=URL.createObjectURL(blob);
            if(returnBlob){ resolve(url); }
            else { if(img.dataset.blobUrl) URL.revokeObjectURL(img.dataset.blobUrl); img.dataset.blobUrl=url; img.src=url; resolve(); }
          });
        }catch(e){ console.warn('[PaletteRecolor] Failed, leaving original image', e); resolve(returnBlob?null:undefined); }
      };
      if(img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, {once:true});
    });
  }

  window.paletteRecolor = paletteRecolor;
})();