import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ─── STL generation helpers ───────────────────────────────────────────────────

function blurPixels(src, resX, resY, passes = 1) {
  let current = src;
  for (let pass = 0; pass < passes; pass++) {
    const next = new Float32Array(resX * resY);
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        let sum = 0;
        let count = 0;
        for (let ky = -1; ky <= 1; ky++) {
          const yy = Math.max(0, Math.min(resY - 1, y + ky));
          for (let kx = -1; kx <= 1; kx++) {
            const xx = Math.max(0, Math.min(resX - 1, x + kx));
            sum += current[yy * resX + xx];
            count += 1;
          }
        }
        next[y * resX + x] = sum / count;
      }
    }
    current = next;
  }
  return current;
}

function claheFilter(src, resX, resY, strength = 0.65) {
  // Tile-free local contrast enhancement (avoids CLAHE block artifacts).
  const localMean = blurPixels(src, resX, resY, 3);
  const result = new Float32Array(resX * resY);
  for (let i = 0; i < resX * resY; i++) {
    const detail = src[i] - localMean[i];
    const v = src[i] + detail * strength;
    result[i] = Math.max(0, Math.min(1, v));
  }
  return result;
}

function bilateralFilter(src, resX, resY, radius = 1, sigmaSpatial = 1, sigmaIntensity = 0.1) {
  // Edge-preserving smoothing using bilateral filtering.
  const result = new Float32Array(src);
  
  for (let y = 0; y < resY; y++) {
    for (let x = 0; x < resX; x++) {
      let sum = 0;
      let wSum = 0;
      const centerVal = src[y * resX + x];
      
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = Math.max(0, Math.min(resY - 1, y + dy));
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = Math.max(0, Math.min(resX - 1, x + dx));
          const v = src[yy * resX + xx];
          
          const dSq = dx * dx + dy * dy;
          const wS = Math.exp(-dSq / (2 * sigmaSpatial * sigmaSpatial));
          const dI = (v - centerVal);
          const wI = Math.exp(-(dI * dI) / (2 * sigmaIntensity * sigmaIntensity));
          const w = wS * wI;
          
          sum += v * w;
          wSum += w;
        }
      }
      
      result[y * resX + x] = wSum > 0 ? sum / wSum : centerVal;
    }
  }
  
  return result;
}

function flattenBackground(src, resX, resY, strength = 0.5) {
  // Subject-aware background reduction:
  // preserve high-detail center regions and flatten low-detail/background regions.
  const variance = new Float32Array(resX * resY);
  const edge = new Float32Array(resX * resY);
  const windowSize = Math.max(3, Math.floor(resX / 20));
  const radius = Math.floor(windowSize / 2);

  for (let y = 0; y < resY; y++) {
    for (let x = 0; x < resX; x++) {
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const yy = Math.max(0, Math.min(resY - 1, y + ky));
        for (let kx = -radius; kx <= radius; kx++) {
          const xx = Math.max(0, Math.min(resX - 1, x + kx));
          const v = src[yy * resX + xx];
          sum += v;
          sumSq += v * v;
          count += 1;
        }
      }
      const mean = sum / count;
      const meanSq = sumSq / count;
      variance[y * resX + x] = Math.sqrt(Math.abs(meanSq - mean * mean));

      // Simple Sobel-like gradient magnitude.
      const xL = Math.max(0, x - 1);
      const xR = Math.min(resX - 1, x + 1);
      const yU = Math.max(0, y - 1);
      const yD = Math.min(resY - 1, y + 1);
      const gx = src[y * resX + xR] - src[y * resX + xL];
      const gy = src[yD * resX + x] - src[yU * resX + x];
      edge[y * resX + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Thresholds separating likely background and likely subject detail.
  const varSorted = Array.from(variance).sort((a, b) => a - b);
  const varThreshold = varSorted[Math.floor(varSorted.length * 0.35)];
  const edgeSorted = Array.from(edge).sort((a, b) => a - b);
  const edgeThreshold = edgeSorted[Math.floor(edgeSorted.length * 0.7)] || 1e-6;

  // Suppress low-detail areas, but keep central subject features.
  const result = new Float32Array(src);
  const cx = (resX - 1) * 0.5;
  const cy = (resY - 1) * 0.52;
  const maxDist = Math.sqrt(cx * cx + cy * cy) || 1;
  for (let i = 0; i < resX * resY; i++) {
    const x = i % resX;
    const y = Math.floor(i / resX);
    const v = variance[i];
    const e = edge[i] / Math.max(edgeThreshold, 1e-6);
    const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxDist;
    const centerWeight = 1 - Math.min(1, dist * 1.15);
    const subjectScore = Math.max(0, Math.min(1, e * 0.7 + centerWeight * 0.5));
    const flatness = 1 - Math.min(1, v / Math.max(varThreshold, 1e-6));
    const suppression = strength * flatness * (1 - subjectScore);
    result[i] = Math.max(0, src[i] - suppression * 0.33);
  }

  return result;
}

function sampleImagePixels(hiddenCanvas, imgEl, resX, resY, options = {}) {
  const {
    lowCut = 0.02,
    highCut = 0.98,
    smoothingPasses = 1,
    detailBoost = 0.35,
    bgFlatten = 0.0,
    professionalMode = false,
  } = options;

  const ctx = hiddenCanvas.getContext('2d');
  hiddenCanvas.width = resX;
  hiddenCanvas.height = resY;
  ctx.drawImage(imgEl, 0, 0, resX, resY);
  const raw = ctx.getImageData(0, 0, resX, resY).data;
  const pixels = new Float32Array(resX * resY);

  for (let i = 0; i < resX * resY; i++) {
    const l = (0.299 * raw[i * 4] + 0.587 * raw[i * 4 + 1] + 0.114 * raw[i * 4 + 2]) / 255;
    pixels[i] = l;
  }

  // Percentile normalization avoids over-amplifying outliers/noise.
  const sorted = Array.from(pixels).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * lowCut)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * highCut)] ?? 1;
  const range = Math.max(hi - lo, 1e-6);
  for (let i = 0; i < resX * resY; i++) {
    const n = (pixels[i] - lo) / range;
    pixels[i] = Math.max(0, Math.min(1, n));
  }

  // Unsharp mask recovers texture/facial detail before optional smoothing.
  let processed = pixels;
  
  // Professional mode: apply CLAHE for local contrast enhancement
  if (professionalMode) {
    processed = claheFilter(processed, resX, resY, 0.8);
  }
  
  if (detailBoost > 0) {
    const base = blurPixels(processed, resX, resY, 1);
    const boosted = new Float32Array(resX * resY);
    for (let i = 0; i < resX * resY; i++) {
      let v = processed[i] + detailBoost * (processed[i] - base[i]);
      v = Math.max(0, Math.min(1, v));
      boosted[i] = v;
    }
    processed = boosted;
  }

  if (bgFlatten > 0) {
    processed = flattenBackground(processed, resX, resY, bgFlatten);
  }

  // Professional mode: bilateral filtering preserves edges while smoothing flat areas
  if (professionalMode && smoothingPasses > 0) {
    processed = bilateralFilter(processed, resX, resY, 1, 1.3, 0.07);
  } else if (smoothingPasses > 0) {
    processed = blurPixels(processed, resX, resY, smoothingPasses);
  }

  return processed;
}

function sampleColorPixels(hiddenCanvas, imgEl, resX, resY) {
  const ctx = hiddenCanvas.getContext('2d');
  hiddenCanvas.width = resX;
  hiddenCanvas.height = resY;
  ctx.drawImage(imgEl, 0, 0, resX, resY);
  return ctx.getImageData(0, 0, resX, resY).data;
}

function buildMesh(
  pixels,
  resX,
  resY,
  widthMm,
  heightMm,
  minThickMm,
  maxDepthMm,
  invert,
  frameStyle = 'none',
  frameWidthMm = 0,
  frameDepthMm = 0,
  outerBorderMm = 0,
) {
  const triangles = [];
  const W = widthMm + outerBorderMm * 2;
  const H = heightMm + outerBorderMm * 2;
  const xStep = W / resX;
  const yStep = H / resY;

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const thicknessFromBrightness = (brightness) => {
    const t = invert ? brightness : (1 - brightness);
    const tg = Math.pow(clamp01(t), 0.72);
    return minThickMm + tg * (maxDepthMm - minThickMm);
  };

  // Shared (resX+1)x(resY+1) height grid guarantees matching boundary vertices.
  const gridW = resX + 1;
  const heights = new Float32Array((resX + 1) * (resY + 1));
  for (let gy = 0; gy <= resY; gy++) {
    for (let gx = 0; gx <= resX; gx++) {
      const x = gx * xStep;
      const y = gy * yStep;
      const inImage = (
        x >= outerBorderMm
        && x <= (outerBorderMm + widthMm)
        && y >= outerBorderMm
        && y <= (outerBorderMm + heightMm)
      );

      let depth = minThickMm;
      if (inImage) {
        // Map to source image region and flip X for slicer orientation consistency.
        const u = (x - outerBorderMm) / Math.max(widthMm, 1e-6);
        const v = (y - outerBorderMm) / Math.max(heightMm, 1e-6);
        const pxRaw = Math.min(resX - 1, Math.max(0, Math.round(u * (resX - 1))));
        const px = (resX - 1) - pxRaw;
        const py = Math.min(resY - 1, Math.max(0, Math.round(v * (resY - 1))));
        const brightness = pixels[py * resX + px];
        depth = thicknessFromBrightness(brightness);
      }

      if (frameStyle !== 'none' && frameWidthMm > 0 && frameDepthMm > 0) {
        const edgeDist = Math.min(
          x,
          W - x,
          y,
          H - y,
        );
        if (edgeDist < frameWidthMm) {
          const t = Math.max(0, 1 - edgeDist / frameWidthMm);
          const raise = frameStyle === 'bevel' ? frameDepthMm * t : frameDepthMm;
          depth = Math.min(maxDepthMm + frameDepthMm, depth + raise);
        }
      }

      heights[gy * gridW + gx] = depth;
    }
  }

  const zAt = (gx, gy) => heights[gy * gridW + gx];
  const addQuad = (a, b, c, d) => {
    triangles.push([a, b, c]);
    triangles.push([a, c, d]);
  };

  // Front (+Z)
  for (let row = 0; row < resY; row++) {
    for (let col = 0; col < resX; col++) {
      const x0 = col * xStep;
      const x1 = (col + 1) * xStep;
      const y0 = row * yStep;
      const y1 = (row + 1) * yStep;
      addQuad(
        [x0, y0, zAt(col, row)],
        [x1, y0, zAt(col + 1, row)],
        [x1, y1, zAt(col + 1, row + 1)],
        [x0, y1, zAt(col, row + 1)],
      );
    }
  }

  // Back (-Z)
  for (let row = 0; row < resY; row++) {
    for (let col = 0; col < resX; col++) {
      const x0 = col * xStep;
      const x1 = (col + 1) * xStep;
      const y0 = row * yStep;
      const y1 = (row + 1) * yStep;
      addQuad([x0, y0, 0], [x0, y1, 0], [x1, y1, 0], [x1, y0, 0]);
    }
  }

  // Top (y=0, outward -Y)
  for (let col = 0; col < resX; col++) {
    const x0 = col * xStep;
    const x1 = (col + 1) * xStep;
    addQuad([x0, 0, 0], [x1, 0, 0], [x1, 0, zAt(col + 1, 0)], [x0, 0, zAt(col, 0)]);
  }

  // Bottom (y=H, outward +Y)
  for (let col = 0; col < resX; col++) {
    const x0 = col * xStep;
    const x1 = (col + 1) * xStep;
    addQuad([x0, H, 0], [x0, H, zAt(col, resY)], [x1, H, zAt(col + 1, resY)], [x1, H, 0]);
  }

  // Left (x=0, outward -X)
  for (let row = 0; row < resY; row++) {
    const y0 = row * yStep;
    const y1 = (row + 1) * yStep;
    addQuad([0, y0, 0], [0, y0, zAt(0, row)], [0, y1, zAt(0, row + 1)], [0, y1, 0]);
  }

  // Right (x=W, outward +X)
  for (let row = 0; row < resY; row++) {
    const y0 = row * yStep;
    const y1 = (row + 1) * yStep;
    addQuad([W, y0, 0], [W, y1, 0], [W, y1, zAt(resX, row + 1)], [W, y0, zAt(resX, row)]);
  }

  return triangles;
}

function normalFromTriangle(v0, v1, v2) {
  const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
  const nx = e1[1] * e2[2] - e1[2] * e2[1];
  const ny = e1[2] * e2[0] - e1[0] * e2[2];
  const nz = e1[0] * e2[1] - e1[1] * e2[0];
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return [nx / len, ny / len, nz / len];
}

function writeBinarySTL(triangles) {
  const buf = new ArrayBuffer(80 + 4 + triangles.length * 50);
  const view = new DataView(buf);
  const header = 'Lithophane by NirmanaHub';
  for (let i = 0; i < 80; i++) view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  view.setUint32(80, triangles.length, true);
  let off = 84;
  for (const [v0, v1, v2] of triangles) {
    const [nx, ny, nz] = normalFromTriangle(v0, v1, v2);
    view.setFloat32(off, nx, true); off += 4;
    view.setFloat32(off, ny, true); off += 4;
    view.setFloat32(off, nz, true); off += 4;
    for (const [x, y, z] of [v0, v1, v2]) {
      view.setFloat32(off, x, true); off += 4;
      view.setFloat32(off, y, true); off += 4;
      view.setFloat32(off, z, true); off += 4;
    }
    view.setUint16(off, 0, true); off += 2;
  }
  return buf;
}

// ─── Settings constants ───────────────────────────────────────────────────────

const RESOLUTION_OPTIONS = [
  { label: 'Draft', px: 100, desc: '100px — Fast' },
  { label: 'Standard', px: 200, desc: '200px — Good' },
  { label: 'High', px: 300, desc: '300px — Better' },
  { label: 'Ultra', px: 400, desc: '400px — Best' },
];

const FRAME_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'flat', label: 'Flat Frame' },
  { value: 'bevel', label: 'Beveled Frame' },
];

const FRAME_PREVIEW_COLORS = [
  { value: 'slate', label: 'Slate', border: 'rgba(226,232,240,0.85)', fill: 'rgba(148,163,184,0.22)' },
  { value: 'black', label: 'Black', border: 'rgba(203,213,225,0.72)', fill: 'rgba(15,23,42,0.35)' },
  { value: 'gold', label: 'Gold', border: 'rgba(252,211,77,0.9)', fill: 'rgba(217,119,6,0.24)' },
  { value: 'white', label: 'White', border: 'rgba(255,255,255,0.95)', fill: 'rgba(248,250,252,0.25)' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LithophanePage({ showToast }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const [imageEl, setImageEl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [widthMm, setWidthMm] = useState(100);
  const [minThick, setMinThick] = useState(0.8);
  const [maxDepth, setMaxDepth] = useState(3.0);
  const [resolution, setResolution] = useState(200);
  const [detailBoost, setDetailBoost] = useState(0.62);
  const [bgFlatten, setBgFlatten] = useState(0.55);
  const [professionalMode, setProfessionalMode] = useState(true);
  const [lightOn, setLightOn] = useState(true);
  const [colorPreview, setColorPreview] = useState(false);
  const [frameStyle, setFrameStyle] = useState('none');
  const [frameWidthMm, setFrameWidthMm] = useState(4);
  const [frameDepthMm, setFrameDepthMm] = useState(1);
  const [outerBorderMm, setOuterBorderMm] = useState(2);
  const [framePreviewColor, setFramePreviewColor] = useState('slate');
  const [invert, setInvert] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Auto-calculate height from image aspect ratio
  const heightMm = imageEl
    ? Math.round((widthMm * imageEl.naturalHeight) / imageEl.naturalWidth * 10) / 10
    : widthMm;
  const totalWidthMm = Math.round((widthMm + outerBorderMm * 2) * 10) / 10;
  const totalHeightMm = Math.round((heightMm + outerBorderMm * 2) * 10) / 10;

  // Draw lithophane preview on visible canvas (grayscale backlit simulation)
  useEffect(() => {
    if (!imageEl || !canvasRef.current || !hiddenCanvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxW = canvas.parentElement?.clientWidth || 500;
    const aspect = imageEl.naturalHeight / imageEl.naturalWidth;
    canvas.width = Math.min(maxW, 800);
    canvas.height = Math.floor(canvas.width * aspect);

    // Preview uses chosen resolution so Draft/Standard/High/Ultra are visibly different.
    const previewResX = Math.max(32, resolution);
    const previewResY = Math.max(32, Math.round(resolution * aspect));
    const pixels = sampleImagePixels(hiddenCanvasRef.current, imageEl, previewResX, previewResY, {
      lowCut: 0.01,
      highCut: 0.995,
      smoothingPasses: 0,
      detailBoost,
      bgFlatten,
      professionalMode,
    });
    const colorData = sampleColorPixels(hiddenCanvasRef.current, imageEl, previewResX, previewResY);

    const out = ctx.createImageData(canvas.width, canvas.height);
    const scaleX = previewResX / canvas.width;
    const scaleY = previewResY / canvas.height;
    const depthSpan = Math.max(maxDepth - minThick, 0.001);

    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const sx = Math.min(previewResX - 1, Math.floor(px * scaleX));
        const sy = Math.min(previewResY - 1, Math.floor(py * scaleY));
        const brightness = pixels[sy * previewResX + sx];
        const t = invert ? brightness : (1 - brightness);
        const tGamma = Math.pow(Math.max(0, Math.min(1, t)), 0.85);
        const thickness = minThick + tGamma * depthSpan;
        // Approximate light attenuation through material; reacts to thickness sliders.
        const transmission = Math.pow(Math.exp(-0.34 * thickness), 0.9);
        const di = (py * canvas.width + px) * 4;

        if (!lightOn) {
          // Unlit mode: depth-style neutral shading.
          const v = Math.max(0, Math.min(255, Math.floor((1 - tGamma * 0.9) * 185 + 35)));
          out.data[di] = v;
          out.data[di + 1] = v;
          out.data[di + 2] = v;
        } else if (colorPreview) {
          const ci = (sy * previewResX + sx) * 4;
          const r = colorData[ci];
          const g = colorData[ci + 1];
          const b = colorData[ci + 2];
          const light = 0.18 + transmission * 0.95;
          out.data[di] = Math.max(0, Math.min(255, Math.floor(r * light)));
          out.data[di + 1] = Math.max(0, Math.min(255, Math.floor(g * light)));
          out.data[di + 2] = Math.max(0, Math.min(255, Math.floor(b * light)));
        } else {
          const v = Math.max(0, Math.min(255, Math.floor(transmission * 255)));
          out.data[di] = v;
          out.data[di + 1] = v;
          out.data[di + 2] = v;
        }
        out.data[di + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [imageEl, resolution, invert, minThick, maxDepth, detailBoost, bgFlatten, professionalMode, lightOn, colorPreview]);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      if (showToast) showToast('Please upload an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImageEl(img);
    img.src = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files[0]);
  };

  const applyMakerlabPreset = () => {
    setResolution(400);
    setMinThick(0.9);
    setMaxDepth(3.5);
    setDetailBoost(0.7);
    setBgFlatten(0.68);
    setProfessionalMode(true);
    setFrameStyle('bevel');
    setFrameWidthMm(4);
    setFrameDepthMm(1);
    setOuterBorderMm(2);
    setFramePreviewColor('slate');
    setInvert(false);
  };

  const generateSTL = useCallback(async () => {
    if (!imageEl) return;
    setIsGenerating(true);
    setProgress(10);

    try {
      const aspect = imageEl.naturalHeight / imageEl.naturalWidth;
      const resX = resolution;
      const resY = Math.max(1, Math.round(resolution * aspect));

      setProgress(25);
      const pixels = sampleImagePixels(hiddenCanvasRef.current, imageEl, resX, resY, {
        lowCut: 0.015,
        highCut: 0.99,
        smoothingPasses: resolution <= 120 ? 2 : 1,
        detailBoost: Math.max(0.2, detailBoost - 0.1),
        bgFlatten: bgFlatten * 0.7,
        professionalMode,
      });
      setProgress(45);

      const triangles = buildMesh(
        pixels,
        resX,
        resY,
        widthMm,
        heightMm,
        minThick,
        maxDepth,
        invert,
        frameStyle,
        frameWidthMm,
        frameDepthMm,
        outerBorderMm,
      );
      setProgress(80);

      const buf = writeBinarySTL(triangles);
      setProgress(95);

      const blob = new Blob([buf], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lithophane-${imageFile?.name?.replace(/\.[^.]+$/, '') || 'image'}.stl`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      if (showToast) showToast(`STL ready! ${triangles.length.toLocaleString()} triangles`);
    } catch (err) {
      if (showToast) showToast('Generation failed: ' + err.message);
    } finally {
      setTimeout(() => { setIsGenerating(false); setProgress(0); }, 900);
    }
  }, [
    imageEl,
    imageFile,
    resolution,
    widthMm,
    heightMm,
    minThick,
    maxDepth,
    detailBoost,
    bgFlatten,
    professionalMode,
    frameStyle,
    frameWidthMm,
    frameDepthMm,
    outerBorderMm,
    invert,
    showToast,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 group text-sm font-medium"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Lithophane Generator</h1>
              <p className="text-slate-500 text-sm">Convert any photo into a 3D-printable STL lithophane</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Left — Upload & Preview */}
          <div className="space-y-5">

            {/* Upload zone */}
            {!imageEl ? (
              <div
                onDragEnter={() => setIsDragging(true)}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center p-12 min-h-[320px] ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/30 bg-slate-50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-700 text-lg mb-1">Drop your photo here</h3>
                <p className="text-slate-400 text-sm mb-4">or click to browse</p>
                <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => loadFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-semibold text-slate-700">Lithophane Preview</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">— {lightOn ? 'backlit simulation' : 'light off mode'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLightOn(!lightOn)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${lightOn ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-slate-600 border-slate-300 bg-slate-100'}`}
                    >
                      Light {lightOn ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => setColorPreview(!colorPreview)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${colorPreview ? 'text-fuchsia-700 border-fuchsia-300 bg-fuchsia-50' : 'text-slate-600 border-slate-300 bg-slate-100'}`}
                    >
                      {colorPreview ? 'Colorful' : 'Grayscale'}
                    </button>
                    <button
                      onClick={() => { setImageEl(null); setImageFile(null); }}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Change image
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 relative">
                  <canvas ref={canvasRef} className="w-full rounded-xl" />
                  {frameStyle !== 'none' && (
                    (() => {
                      const color = FRAME_PREVIEW_COLORS.find((c) => c.value === framePreviewColor) || FRAME_PREVIEW_COLORS[0];
                      return (
                        <div
                          className="absolute pointer-events-none rounded-xl"
                          style={{
                            left: '18px',
                            right: '18px',
                            top: '18px',
                            bottom: '18px',
                            border: `1px solid ${color.border}`,
                            boxShadow: frameStyle === 'bevel'
                              ? `inset 0 0 0 2px ${color.border}, inset 0 0 0 999px ${color.fill}`
                              : `inset 0 0 0 999px ${color.fill}`,
                          }}
                        />
                      );
                    })()
                  )}
                </div>
                <div className="px-5 py-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="w-14 h-3 rounded-sm" style={{background: 'linear-gradient(to right, #111, #fff)'}}></div>
                    <span>Dark = thick · Light = thin</span>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 font-medium">
                    {totalWidthMm} × {totalHeightMm} mm
                  </span>
                </div>
              </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '💡',
                  title: 'How it works',
                  desc: 'Dark pixels become thick walls; light pixels stay thin. A backlight reveals the full image.',
                },
                {
                  icon: '🖨️',
                  title: 'Best print settings',
                  desc: 'Use white/natural PLA or PETG at 0.1–0.15 mm layer height for sharpest results.',
                },
                {
                  icon: '📦',
                  title: 'Want us to print it?',
                  desc: "Generate the STL then tap 'Order a Printed Copy' — we'll 3D-print and ship it to you.",
                },
              ].map((card) => (
                <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-1">{card.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Settings panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Settings
              </h2>

              <div className="space-y-5">

                {/* Width */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                    <span>Width</span>
                    <span className="text-blue-600 font-bold">{widthMm} mm</span>
                  </label>
                  <input
                    type="range" min={40} max={200} step={5} value={widthMm}
                    onChange={(e) => setWidthMm(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>40mm</span>
                    {imageEl && <span className="text-slate-500 font-medium">Height: {heightMm}mm</span>}
                    <span>200mm</span>
                  </div>
                </div>

                {/* Min thickness */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                    <span>Base Thickness</span>
                    <span className="text-blue-600 font-bold">{minThick.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range" min={0.4} max={2} step={0.1} value={minThick}
                    onChange={(e) => setMinThick(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>0.4mm (thinner)</span><span>2mm (thicker)</span>
                  </div>
                </div>

                {/* Max depth */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                    <span>Total Depth</span>
                    <span className="text-blue-600 font-bold">{maxDepth.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range" min={1.5} max={6} step={0.5} value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>1.5mm</span><span>6mm</span>
                  </div>
                </div>

                {/* Detail boost */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                    <span>Detail Boost</span>
                    <span className="text-blue-600 font-bold">{detailBoost.toFixed(2)}</span>
                  </label>
                  <input
                    type="range" min={0} max={1} step={0.05} value={detailBoost}
                    onChange={(e) => setDetailBoost(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>Smoother</span><span>Sharper</span>
                  </div>
                </div>

                {/* Background flatten */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                    <span>Background Flatten</span>
                    <span className="text-blue-600 font-bold">{bgFlatten.toFixed(2)}</span>
                  </label>
                  <input
                    type="range" min={0} max={1} step={0.05} value={bgFlatten}
                    onChange={(e) => setBgFlatten(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>Keep texture</span><span>Flatten completely</span>
                  </div>
                </div>

                {/* Frame options */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">Frame Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FRAME_STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFrameStyle(opt.value)}
                        className={`px-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                          frameStyle === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-cyan-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className={frameStyle === 'none' ? 'opacity-50' : ''}>
                    <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                      <span>Frame Width</span>
                      <span className="text-blue-600 font-bold">{frameWidthMm.toFixed(1)} mm</span>
                    </label>
                    <input
                      type="range" min={1} max={12} step={0.5} value={frameWidthMm}
                      onChange={(e) => setFrameWidthMm(Number(e.target.value))}
                      disabled={frameStyle === 'none'}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className={frameStyle === 'none' ? 'opacity-50' : ''}>
                    <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                      <span>Frame Depth</span>
                      <span className="text-blue-600 font-bold">{frameDepthMm.toFixed(1)} mm</span>
                    </label>
                    <input
                      type="range" min={0.2} max={3} step={0.1} value={frameDepthMm}
                      onChange={(e) => setFrameDepthMm(Number(e.target.value))}
                      disabled={frameStyle === 'none'}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1.5">
                      <span>Outer Border Size</span>
                      <span className="text-blue-600 font-bold">{outerBorderMm.toFixed(1)} mm</span>
                    </label>
                    <input
                      type="range" min={0} max={8} step={0.5} value={outerBorderMm}
                      onChange={(e) => setOuterBorderMm(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className={frameStyle === 'none' ? 'opacity-50' : ''}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Frame Color Preview</label>
                    <div className="grid grid-cols-4 gap-2">
                      {FRAME_PREVIEW_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setFramePreviewColor(c.value)}
                          disabled={frameStyle === 'none'}
                          className={`px-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                            framePreviewColor === c.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-cyan-300'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Professional Mode */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Professional Mode</p>
                    <p className="text-xs text-slate-400">CLAHE + bilateral filter (like Bamboo)</p>
                  </div>
                  <button
                    onClick={() => setProfessionalMode(!professionalMode)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${professionalMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${professionalMode ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={applyMakerlabPreset}
                  className="w-full py-2.5 rounded-xl font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Apply Makerlab Preset
                </button>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Light Preview</p>
                    <p className="text-xs text-slate-400">Switch ON/OFF light simulation</p>
                  </div>
                  <button
                    onClick={() => setLightOn(!lightOn)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${lightOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${lightOn ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Colorful Preview</p>
                    <p className="text-xs text-slate-400">Show color-lit preview mode</p>
                  </div>
                  <button
                    onClick={() => setColorPreview(!colorPreview)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${colorPreview ? 'bg-fuchsia-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${colorPreview ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.px}
                        onClick={() => setResolution(opt.px)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                          resolution === opt.px
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="font-normal text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invert toggle */}
                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Invert depth</p>
                    <p className="text-xs text-slate-400">Swap which areas are thick</p>
                  </div>
                  <button
                    onClick={() => setInvert(!invert)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${invert ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${invert ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Generate STL button */}
            <button
              onClick={generateSTL}
              disabled={!imageEl || isGenerating}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-blue-700 to-cyan-500 hover:shadow-xl hover:shadow-cyan-200/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating… {progress}%
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download STL
                </span>
              )}
              {isGenerating && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>

            {/* Order a print button */}
            <button
              onClick={() =>
                navigate('/custom-order', {
                  state: {
                    prefill: {
                      category: 'Lithophane',
                      description: `Lithophane print — ${widthMm}×${heightMm}mm, ${maxDepth}mm depth${imageFile ? ` (${imageFile.name})` : ''}`,
                    },
                  },
                })
              }
              className="w-full py-3 rounded-2xl font-semibold text-slate-700 border-2 border-slate-200 hover:border-cyan-400 hover:text-cyan-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order a Printed Copy
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for pixel sampling */}
      <canvas ref={hiddenCanvasRef} className="hidden" />
    </div>
  );
}
