import { useState, useRef, useEffect } from 'react';

const FONT_OPTIONS = [
  { name: 'Arial', family: 'Arial, sans-serif', style: 'Sans-serif' },
  { name: 'Times New Roman', family: 'Times New Roman, serif', style: 'Serif' },
  { name: 'Georgia', family: 'Georgia, serif', style: 'Serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif', style: 'Sans-serif' },
  { name: 'Courier New', family: 'Courier New, monospace', style: 'Monospace' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive', style: 'Cursive' },
  { name: 'Impact', family: 'Impact, sans-serif', style: 'Display' },
  { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif', style: 'Sans-serif' },
  { name: 'Palatino', family: 'Palatino Linotype, serif', style: 'Serif' },
  { name: 'Lucida Console', family: 'Lucida Console, monospace', style: 'Monospace' },
  { name: 'Brush Script', family: 'Brush Script MT, cursive', style: 'Script' },
  { name: 'Copperplate', family: 'Copperplate, fantasy', style: 'Display' },
];

const FONT_WEIGHTS = [
  { name: 'Light', value: '300' },
  { name: 'Normal', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi-Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
];

const TEXT_EFFECTS = [
  { name: 'None', value: 'none' },
  { name: 'Wave', value: 'wave' },
  { name: 'Arc Up', value: 'arc-up' },
  { name: 'Arc Down', value: 'arc-down' },
  { name: 'Circle', value: 'circle' },
  { name: 'Spiral', value: 'spiral' },
  { name: 'Twist', value: 'twist' },
  { name: 'Slant Up', value: 'slant-up' },
  { name: 'Slant Down', value: 'slant-down' },
  { name: 'Bounce', value: 'bounce' },
  { name: 'Stairs Up', value: 'stairs-up' },
  { name: 'Stairs Down', value: 'stairs-down' },
];

export default function SvgGenerator({ isOpen, onClose, showToast }) {
  const [mode, setMode] = useState('text'); // 'text' or 'image'
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0]);
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState('normal'); // 'normal' or 'italic'
  const [textColor, setTextColor] = useState('#000000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textEffect, setTextEffect] = useState('none');
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [threshold, setThreshold] = useState(128);
  const [invertColors, setInvertColors] = useState(false);
  const [transparentBg, setTransparentBg] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');
  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  // Generate SVG preview for text
  useEffect(() => {
    if (mode === 'text' && text && previewRef.current) {
      const svg = generateTextSvg();
      previewRef.current.innerHTML = svg;
    }
  }, [text, fontSize, fontFamily, fontWeight, fontStyle, textColor, strokeColor, strokeWidth, letterSpacing, textEffect, effectIntensity, mode, transparentBg, bgColor]);

  const generateTextSvg = () => {
    if (!text) return '';
    
    const chars = text.split('');
    const avgCharWidth = fontSize * 0.6 + letterSpacing;
    const intensity = effectIntensity / 50; // Normalize to 0-2 range
    
    // Calculate dimensions based on effect
    let width, height, svgContent;
    
    if (textEffect === 'none') {
      // Simple text
      width = Math.max(200, text.length * avgCharWidth + 40);
      height = fontSize * 1.5 + 40;
      
      svgContent = `<text x="20" y="${fontSize + 10}" class="text-main">${escapeHtml(text)}</text>`;
    } else if (textEffect === 'wave') {
      // Wave effect - each character moves up/down in wave pattern
      width = Math.max(200, text.length * avgCharWidth + 40);
      height = fontSize * 2.5 + 40;
      const waveHeight = fontSize * 0.5 * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize + 20 + Math.sin(i * 0.5) * waveHeight;
        return `<text x="${x}" y="${y}" class="text-main">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'arc-up') {
      // Arc up effect
      width = Math.max(300, text.length * avgCharWidth + 60);
      height = fontSize * 3 + 40;
      const arcHeight = fontSize * intensity;
      const centerX = width / 2;
      
      svgContent = chars.map((char, i) => {
        const progress = (i / (chars.length - 1 || 1)) - 0.5; // -0.5 to 0.5
        const x = 30 + i * avgCharWidth;
        const y = fontSize + 30 + (progress * progress * 4) * arcHeight;
        const rotation = progress * 20 * intensity;
        return `<text x="${x}" y="${y}" class="text-main" transform="rotate(${rotation}, ${x}, ${y})">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'arc-down') {
      // Arc down effect
      width = Math.max(300, text.length * avgCharWidth + 60);
      height = fontSize * 3 + 40;
      const arcHeight = fontSize * intensity;
      
      svgContent = chars.map((char, i) => {
        const progress = (i / (chars.length - 1 || 1)) - 0.5;
        const x = 30 + i * avgCharWidth;
        const y = fontSize * 2 + 10 - (progress * progress * 4) * arcHeight;
        const rotation = -progress * 20 * intensity;
        return `<text x="${x}" y="${y}" class="text-main" transform="rotate(${rotation}, ${x}, ${y})">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'circle') {
      // Circular text
      const radius = Math.max(80, text.length * 8) * intensity;
      width = radius * 2.5 + 40;
      height = radius * 2.5 + 40;
      const centerX = width / 2;
      const centerY = height / 2;
      const startAngle = -90;
      const anglePerChar = 360 / Math.max(chars.length, 12);
      
      svgContent = chars.map((char, i) => {
        const angle = startAngle + i * anglePerChar;
        const rad = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        return `<text x="${x}" y="${y}" class="text-main" transform="rotate(${angle + 90}, ${x}, ${y})">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'spiral') {
      // Spiral text
      const baseRadius = 40 * intensity;
      const spiralGrowth = 5 * intensity;
      width = 300 + text.length * 10;
      height = 300 + text.length * 10;
      const centerX = width / 2;
      const centerY = height / 2;
      
      svgContent = chars.map((char, i) => {
        const angle = i * 30;
        const rad = (angle * Math.PI) / 180;
        const radius = baseRadius + i * spiralGrowth;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        return `<text x="${x}" y="${y}" class="text-main" transform="rotate(${angle + 90}, ${x}, ${y})">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'twist') {
      // Twist/rotate each character progressively
      width = Math.max(200, text.length * avgCharWidth + 40);
      height = fontSize * 2 + 40;
      const maxRotation = 30 * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize + 20;
        const rotation = ((i / (chars.length - 1 || 1)) - 0.5) * maxRotation * 2;
        const scale = 1 + Math.sin((i / chars.length) * Math.PI) * 0.3 * intensity;
        return `<text x="${x}" y="${y}" class="text-main" transform="rotate(${rotation}, ${x}, ${y}) scale(${scale})">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'slant-up') {
      // Slanting upward
      width = Math.max(200, text.length * avgCharWidth + 80);
      height = fontSize * 3 + 40;
      const slantAmount = fontSize * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize * 2 + 20 - (i / chars.length) * slantAmount;
        return `<text x="${x}" y="${y}" class="text-main">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'slant-down') {
      // Slanting downward
      width = Math.max(200, text.length * avgCharWidth + 80);
      height = fontSize * 3 + 40;
      const slantAmount = fontSize * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize + 20 + (i / chars.length) * slantAmount;
        return `<text x="${x}" y="${y}" class="text-main">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'bounce') {
      // Bouncing effect - alternating up/down with scale
      width = Math.max(200, text.length * avgCharWidth + 40);
      height = fontSize * 2.5 + 40;
      const bounceHeight = fontSize * 0.4 * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const bounce = i % 2 === 0 ? -bounceHeight : bounceHeight;
        const y = fontSize + 30 + bounce;
        const scale = i % 2 === 0 ? 1 + 0.15 * intensity : 1 - 0.1 * intensity;
        return `<text x="${x}" y="${y}" class="text-main" transform="scale(${scale})" style="transform-origin: ${x}px ${y}px">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'stairs-up') {
      // Stair step up effect
      width = Math.max(200, text.length * avgCharWidth + 80);
      height = fontSize * 3 + 40;
      const stepHeight = (fontSize * 0.3) * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize * 2 + 20 - i * stepHeight;
        return `<text x="${x}" y="${y}" class="text-main">${escapeHtml(char)}</text>`;
      }).join('');
    } else if (textEffect === 'stairs-down') {
      // Stair step down effect
      width = Math.max(200, text.length * avgCharWidth + 80);
      height = fontSize * 3 + 40;
      const stepHeight = (fontSize * 0.3) * intensity;
      
      svgContent = chars.map((char, i) => {
        const x = 20 + i * avgCharWidth;
        const y = fontSize + 20 + i * stepHeight;
        return `<text x="${x}" y="${y}" class="text-main">${escapeHtml(char)}</text>`;
      }).join('');
    } else {
      // Default fallback
      width = Math.max(200, text.length * avgCharWidth + 40);
      height = fontSize * 1.5 + 40;
      svgContent = `<text x="20" y="${fontSize + 10}" class="text-main">${escapeHtml(text)}</text>`;
    }
    
    // Add background rectangle if not transparent
    const bgRect = transparentBg ? '' : `<rect width="${width}" height="${height}" fill="${bgColor}" />`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .text-main {
      font-family: ${fontFamily.family};
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      fill: ${textColor};
      ${strokeWidth > 0 ? `stroke: ${strokeColor}; stroke-width: ${strokeWidth}px;` : ''}
    }
  </style>
  ${bgRect}
  ${svgContent}
</svg>`;
    
    return svg;
  };

  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToSvg = () => {
    if (!imagePreview) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Set canvas size to image size (max 500px)
        const maxSize = 500;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Convert to black and white based on threshold
        let paths = [];
        
        // Simple edge detection and path generation
        for (let y = 0; y < height; y++) {
          let inPath = false;
          let pathStart = 0;
          
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            
            let isBlack = brightness < threshold;
            if (invertColors) isBlack = !isBlack;
            
            if (isBlack && !inPath) {
              inPath = true;
              pathStart = x;
            } else if (!isBlack && inPath) {
              inPath = false;
              paths.push({ x: pathStart, y, w: x - pathStart, h: 1 });
            }
          }
          
          if (inPath) {
            paths.push({ x: pathStart, y, w: width - pathStart, h: 1 });
          }
        }
        
        // Generate SVG
        let pathData = paths.map(p => `M${p.x},${p.y}h${p.w}v${p.h}h-${p.w}z`).join('');
        
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pathData}" fill="black" />
</svg>`;
        
        resolve(svg);
      };
      img.src = imagePreview;
    });
  };

  const downloadSvg = async () => {
    let svgContent;
    
    if (mode === 'text') {
      if (!text.trim()) {
        showToast?.('Please enter some text');
        return;
      }
      svgContent = generateTextSvg();
    } else {
      if (!imagePreview) {
        showToast?.('Please upload an image');
        return;
      }
      svgContent = await convertImageToSvg();
    }
    
    // Create download link
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'text' ? `${text.substring(0, 20).replace(/\s/g, '_')}.svg` : 'converted_image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast?.('SVG downloaded successfully!');
  };

  const copySvgCode = async () => {
    let svgContent;
    
    if (mode === 'text') {
      if (!text.trim()) {
        showToast?.('Please enter some text');
        return;
      }
      svgContent = generateTextSvg();
    } else {
      if (!imagePreview) {
        showToast?.('Please upload an image');
        return;
      }
      svgContent = await convertImageToSvg();
    }
    
    try {
      await navigator.clipboard.writeText(svgContent);
      showToast?.('SVG code copied to clipboard!');
    } catch (err) {
      showToast?.('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            SVG Generator
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setMode('text');
              // Clear image mode data
              setUploadedImage(null);
              setImagePreview(null);
              setThreshold(128);
              setInvertColors(false);
            }}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              mode === 'text'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Text to SVG
            </span>
          </button>
          <button
            onClick={() => {
              setMode('image');
              // Clear text mode data
              setText('');
              setFontSize(48);
              setFontFamily(FONT_OPTIONS[0]);
              setFontWeight('400');
              setFontStyle('normal');
              setTextColor('#000000');
              setStrokeColor('#000000');
              setStrokeWidth(0);
              setLetterSpacing(0);
              setTextEffect('none');
              setEffectIntensity(50);
              setTransparentBg(true);
              setBgColor('#ffffff');
              if (previewRef.current) {
                previewRef.current.innerHTML = '';
              }
            }}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              mode === 'image'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image to SVG
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {mode === 'text' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Text Controls */}
              <div className="space-y-4">
                {/* Text Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your text..."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Font Family</label>
                  <select
                    value={fontFamily.name}
                    onChange={(e) => setFontFamily(FONT_OPTIONS.find(f => f.name === e.target.value))}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>
                        {font.name} ({font.style})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Weight Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="200"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Font Weight</label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value)}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      {FONT_WEIGHTS.map(w => (
                        <option key={w.value} value={w.value}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Style & Letter Spacing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Style</label>
                    <select
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Letter Spacing: {letterSpacing}px
                    </label>
                    <input
                      type="range"
                      min="-10"
                      max="50"
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>

                {/* Text Effect (Twister) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Text Effect</label>
                    <select
                      value={textEffect}
                      onChange={(e) => setTextEffect(e.target.value)}
                      className="w-full p-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      {TEXT_EFFECTS.map(effect => (
                        <option key={effect.value} value={effect.value}>
                          {effect.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Effect Intensity: {effectIntensity}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={effectIntensity}
                      onChange={(e) => setEffectIntensity(Number(e.target.value))}
                      className="w-full accent-purple-600"
                      disabled={textEffect === 'none'}
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fill Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-2 border-slate-200"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 p-2 border-2 border-slate-200 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Stroke Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-2 border-slate-200"
                      />
                      <input
                        type="text"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="flex-1 p-2 border-2 border-slate-200 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Stroke Width: {strokeWidth}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Preview</label>
                <div 
                  ref={previewRef}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[200px] flex items-center justify-center overflow-auto"
                  style={transparentBg ? {
                    backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#f8f8f8'
                  } : {
                    backgroundColor: bgColor
                  }}
                >
                  {!text && (
                    <p className="text-slate-400 bg-white/80 px-3 py-1 rounded">Enter text to see preview</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Image Mode */
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Upload & Controls */}
              <div className="space-y-4">
                {/* Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Image</label>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                    <svg className="w-12 h-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-slate-500">Click to upload image</span>
                    <span className="text-sm text-slate-400">PNG, JPG, GIF</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Threshold Control */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Threshold: {threshold} (Black/White cutoff)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Lower = more black, Higher = more white
                  </p>
                </div>

                {/* Invert Colors */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invertColors}
                    onChange={(e) => setInvertColors(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 rounded"
                  />
                  <span className="font-medium text-slate-700">Invert Colors</span>
                </label>
              </div>

              {/* Image Preview */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Original Image</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[200px] bg-slate-50 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-w-full max-h-64 object-contain" />
                  ) : (
                    <p className="text-slate-400">No image uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Background Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Transparent Background</span>
            </label>
            {!transparentBg && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">BG Color:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-300"
                />
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
          <button
            onClick={copySvgCode}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy SVG Code
          </button>
          <button
            onClick={downloadSvg}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download SVG
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
