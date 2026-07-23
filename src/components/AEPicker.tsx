/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface RGB { r: number; g: number; b: number; }
interface HSV { h: number; s: number; v: number; }

// --- HELPERS FOR COLOR CONVERSIONS ---
function hexToRgb(hex: string): RGB {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

interface AEPickerProps {
  currentColor: string;
  onChangeColor: (hex: string) => void;
}

export default function AEPicker({ currentColor, onChangeColor }: AEPickerProps) {
  // Save original color when mounting to show "Current" vs "New"
  const originalColor = useRef(currentColor);

  // Parse currentColor to RGB and HSV
  const rgb = useMemo(() => hexToRgb(currentColor), [currentColor]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);

  const [copied, setCopied] = useState(false);

  // Refs for dragging
  const sFieldRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);

  // AE Presets
  const aePresets = [
    { name: 'Amber Glow', hex: '#f59e0b' },
    { name: 'Cyber Cyan', hex: '#06b6d4' },
    { name: 'Laser Pink', hex: '#ec4899' },
    { name: 'Emerald Fire', hex: '#10b981' },
    { name: 'Cosmic Royal', hex: '#6366f1' },
    { name: 'Crimson Red', hex: '#ef4444' },
    { name: 'Solar Orange', hex: '#f97316' },
    { name: 'Neon Green', hex: '#22c55e' },
  ];

  // Dragging states
  const [isDraggingSField, setIsDraggingSField] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Update saturation and brightness (v)
  const handleSFieldUpdate = (clientX: number, clientY: number) => {
    if (!sFieldRef.current) return;
    const rect = sFieldRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round(100 - (y / rect.height) * 100);
    
    const newRgb = hsvToRgb({ h: hsv.h, s, v });
    onChangeColor(rgbToHex(newRgb));
  };

  // Update hue
  const handleHueUpdate = (clientY: number) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const h = Math.round((y / rect.height) * 360);
    
    const newRgb = hsvToRgb({ h, s: hsv.s, v: hsv.v });
    onChangeColor(rgbToHex(newRgb));
  };

  // Dragging event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSField) {
        handleSFieldUpdate(e.clientX, e.clientY);
      } else if (isDraggingHue) {
        handleHueUpdate(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSField(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSField || isDraggingHue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSField, isDraggingHue, hsv]);

  // Touch support
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (isDraggingSField) {
        handleSFieldUpdate(touch.clientX, touch.clientY);
      } else if (isDraggingHue) {
        handleHueUpdate(touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingSField(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSField || isDraggingHue) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSField, isDraggingHue, hsv]);

  // Handle manual input changes
  const handleRgbChange = (key: keyof RGB, val: string) => {
    const num = Math.max(0, Math.min(255, parseInt(val) || 0));
    const updatedRgb = { ...rgb, [key]: num };
    onChangeColor(rgbToHex(updatedRgb));
  };

  const handleHsvChange = (key: keyof HSV, val: string) => {
    const limit = key === 'h' ? 360 : 100;
    const num = Math.max(0, Math.min(limit, parseInt(val) || 0));
    const updatedHsv = { ...hsv, [key]: num };
    onChangeColor(rgbToHex(hsvToRgb(updatedHsv)));
  };

  const handleHexChange = (val: string) => {
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#')) {
      cleanHex = '#' + cleanHex;
    }
    // Only apply if it's a valid 6-char hex code
    if (/^#[0-9A-F]{6}$/i.test(cleanHex)) {
      onChangeColor(cleanHex);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentColor.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pure Hue color representation
  const pureHueHex = useMemo(() => {
    return rgbToHex(hsvToRgb({ h: hsv.h, s: 100, v: 100 }));
  }, [hsv.h]);

  return (
    <div className="bg-[#0c0c0e] border border-zinc-800 p-4 font-mono select-none text-zinc-300">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-900">
        <span className="text-[10px] text-zinc-400 tracking-wider uppercase">COLOR PICKER (AFTER EFFECTS STYLE)</span>
        <span className="text-[8px] text-zinc-600">v1.2 // NUMERICAL ENGINE</span>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        
        {/* Saturation-Brightness Canvas & Hue Slider container */}
        <div className="flex gap-4 shrink-0">
          {/* S/B Canvas */}
          <div 
            ref={sFieldRef}
            onMouseDown={(e) => {
              setIsDraggingSField(true);
              handleSFieldUpdate(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 0) return;
              setIsDraggingSField(true);
              handleSFieldUpdate(e.touches[0].clientX, e.touches[0].clientY);
            }}
            className="w-48 h-48 relative cursor-crosshair overflow-hidden border border-zinc-800 shadow-inner"
            style={{ backgroundColor: pureHueHex }}
          >
            {/* White Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            {/* Black Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            {/* Circle Pointer Dragging handle */}
            <div 
              className="absolute w-3 h-3 border-2 border-black rounded-full shadow-md -translate-x-1.5 -translate-y-1.5 z-10 pointer-events-none"
              style={{ 
                left: `${hsv.s}%`, 
                top: `${100 - hsv.v}%`,
                backgroundColor: currentColor,
                borderColor: hsv.v > 50 ? '#000000' : '#ffffff'
              }}
            />
          </div>

          {/* Vertical Hue Slider */}
          <div 
            ref={hueSliderRef}
            onMouseDown={(e) => {
              setIsDraggingHue(true);
              handleHueUpdate(e.clientY);
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 0) return;
              setIsDraggingHue(true);
              handleHueUpdate(e.touches[0].clientY);
            }}
            className="w-5 h-48 relative cursor-ns-resize border border-zinc-800 shadow-sm overflow-visible"
            style={{
              backgroundImage: `linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)`
            }}
          >
            {/* Slider pointer bar indicators */}
            <div 
              className="absolute left-[-3px] right-[-3px] h-1.5 bg-white border border-black shadow-md pointer-events-none -translate-y-[3px]"
              style={{ top: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Controls, Comparison & Numeric Inputs */}
        <div className="flex-1 flex flex-col justify-between">
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Dual color comparison preview box (Just like AE's Color Dialogue) */}
            <div className="border border-zinc-800 p-2 bg-[#050506] flex flex-col justify-between h-20">
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none">PREVIEW (COMPARISON)</span>
              
              <div className="h-10 border border-black mt-1.5 flex overflow-hidden">
                <div 
                  className="flex-1 relative group"
                  style={{ backgroundColor: originalColor.current }}
                  title="Original color"
                >
                  <span className="absolute bottom-1 left-1.5 text-[7px] text-zinc-500 font-bold bg-black/60 px-1 py-0.5 rounded-none uppercase">Old</span>
                </div>
                <div 
                  className="flex-1 relative group"
                  style={{ backgroundColor: currentColor }}
                  title="New color"
                >
                  <span className="absolute bottom-1 left-1.5 text-[7px] text-zinc-200 font-bold bg-black/60 px-1 py-0.5 rounded-none uppercase">New</span>
                </div>
              </div>
            </div>

            {/* HEX Input controls */}
            <div className="border border-zinc-800 p-2 bg-[#050506] flex flex-col justify-between h-20">
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none">HEX CODE</span>
              <div className="flex gap-1.5 items-center mt-2">
                <input 
                  type="text"
                  value={currentColor.toUpperCase()}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-zinc-800 text-xs py-1.5 px-2 text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono text-center rounded-none"
                  maxLength={7}
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-1.5 bg-[#0d0d0f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>

          {/* AE HSB & RGB Sliders and Numerics */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-zinc-900">
            {/* HSB column */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold w-4">H:</span>
                <input 
                  type="number"
                  value={hsv.h}
                  onChange={(e) => handleHsvChange('h', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={360}
                />
                <span className="text-[9px] text-zinc-600">°</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold w-4">S:</span>
                <input 
                  type="number"
                  value={hsv.s}
                  onChange={(e) => handleHsvChange('s', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={100}
                />
                <span className="text-[9px] text-zinc-600">%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold w-4">B:</span>
                <input 
                  type="number"
                  value={hsv.v}
                  onChange={(e) => handleHsvChange('v', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={100}
                />
                <span className="text-[9px] text-zinc-600">%</span>
              </div>
            </div>

            {/* RGB column */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-500/80 font-bold w-4">R:</span>
                <input 
                  type="number"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={255}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-500/80 font-bold w-4">G:</span>
                <input 
                  type="number"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={255}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-500/80 font-bold w-4">B:</span>
                <input 
                  type="number"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className="w-12 bg-black border border-zinc-900 py-0.5 px-1 text-[10px] text-zinc-300 text-right focus:outline-none focus:border-zinc-700 rounded-none"
                  min={0}
                  max={255}
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Quick Swatches / AE presets */}
      <div className="mt-4 pt-3 border-t border-zinc-900">
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-2 font-bold">PRESETS (PROFESSIONAL COLOR PALETTE)</span>
        <div className="flex flex-wrap gap-1.5">
          {aePresets.map((preset) => {
            const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => onChangeColor(preset.hex)}
                className={`w-5 h-5 rounded-none border transition-transform hover:scale-110 flex items-center justify-center`}
                style={{ 
                  backgroundColor: preset.hex, 
                  borderColor: isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'
                }}
                title={preset.name}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black invert shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
