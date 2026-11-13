import React, { useState, useRef, useEffect } from 'react';
import { Camera, PenTool, Upload, Trash2, Check, RefreshCw } from 'lucide-react';

export default function MediaUploader({ onMediaAttached, onMediaRemoved }) {
  const [mode, setMode] = useState('upload'); // 'upload' or 'draw'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaInfo, setMediaInfo] = useState(null);

  // Drawing Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#1e3a8a');
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setPreviewUrl(dataUrl);
      setMediaInfo({ name: file.name, type: 'photo' });
      if (onMediaAttached) {
        onMediaAttached({ type: 'photo', dataUrl, name: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [mode]);

  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const attachDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setMediaInfo({ name: 'Hand-drawn Poster.png', type: 'drawing' });
    if (onMediaAttached) {
      onMediaAttached({ type: 'drawing', dataUrl, name: 'Hand-drawn poster' });
    }
  };

  const removeMedia = () => {
    setPreviewUrl(null);
    setMediaInfo(null);
    if (onMediaRemoved) onMediaRemoved();
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition space-y-3.5">
      {previewUrl ? (
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-300">
          <div className="flex items-center gap-3.5">
            <img src={previewUrl} alt="Evidence" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
            <div>
              <span className="text-sm font-bold text-slate-900 block">{mediaInfo?.name}</span>
              <span className="text-xs text-emerald-700 font-semibold">Visual attached to challenge</span>
            </div>
          </div>
          <button
            type="button"
            onClick={removeMedia}
            className="text-xs sm:text-sm text-rose-600 hover:text-rose-800 font-semibold px-3 py-1.5 border border-rose-200 rounded-lg transition"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-700 font-bold uppercase tracking-wider text-xs">Attach Visual:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`px-3 py-1.5 rounded-lg font-bold border text-xs sm:text-sm ${
                  mode === 'upload' ? 'bg-white text-blue-700 border-slate-300 shadow-sm' : 'text-slate-600 border-transparent'
                }`}
              >
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setMode('draw')}
                className={`px-3 py-1.5 rounded-lg font-bold border text-xs sm:text-sm ${
                  mode === 'draw' ? 'bg-white text-blue-700 border-slate-300 shadow-sm' : 'text-slate-600 border-transparent'
                }`}
              >
                Draw on Canvas
              </button>
            </div>
          </div>

          {mode === 'upload' ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-7 bg-white flex flex-col items-center justify-center cursor-pointer transition">
              <Upload size={24} className="text-slate-400 mb-1.5" />
              <span className="text-sm font-bold text-slate-800">Click to choose a photo or drawing</span>
              <span className="text-xs text-slate-400 mt-0.5">PNG, JPG, or WEBP</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Color:</span>
                  {['#1e3a8a', '#2563eb', '#059669', '#d97706', '#dc2626', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrushColor(c)}
                      className={`w-5 h-5 rounded-full border ${brushColor === c ? 'ring-2 ring-blue-500' : 'border-slate-300'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  Clear Canvas
                </button>
              </div>

              {/* Canvas with visible crisp border */}
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden flex justify-center bg-white cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={190}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={() => setIsDrawing(false)}
                  className="w-full touch-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={!hasDrawn}
                  onClick={attachDrawing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold transition"
                >
                  Attach Drawing
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
