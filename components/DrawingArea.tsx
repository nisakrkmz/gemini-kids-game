import React, { useRef, useState, useEffect } from 'react';
import { SavedCharacter, CharacterType, CharacterColor } from '../types';
import { generateColoringTemplate } from '../services/geminiService';

interface Props {
    voiceRequestedShape: string | null;
    onShapeHandled: () => void;
    onSaveToPool: (char: SavedCharacter) => void;
}

const DrawingArea: React.FC<Props> = ({ voiceRequestedShape, onShapeHandled, onSaveToPool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
  // Tools
  const [tool, setTool] = useState<'brush' | 'bucket' | 'eraser'>('bucket'); // Default to bucket for coloring book feel
  const [color, setColor] = useState('#EF4444'); 
  const [lineWidth, setLineWidth] = useState(5);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);

  // Handle Voice Commands
  useEffect(() => {
      if (voiceRequestedShape) {
          loadTemplate(voiceRequestedShape);
          onShapeHandled();
      }
  }, [voiceRequestedShape]);

  // Init Canvas Size
  useEffect(() => {
      const initCanvas = () => {
          if (containerRef.current && canvasRef.current) {
              const { width, height } = containerRef.current.getBoundingClientRect();
              // Only resize if significantly different to prevent reset on mobile browser bar toggle
              if (Math.abs(canvasRef.current.width - width) > 10) {
                  canvasRef.current.width = width;
                  canvasRef.current.height = height;
                  
                  const ctx = canvasRef.current.getContext('2d');
                  if (ctx) {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, width, height);
                  }
              }
          }
      };
      
      window.addEventListener('resize', initCanvas);
      initCanvas();
      return () => window.removeEventListener('resize', initCanvas);
  }, []);


  // --- FLOOD FILL ALGORITHM ---
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Target color (color at click position)
      const startPos = (startY * width + startX) * 4;
      const startR = data[startPos];
      const startG = data[startPos + 1];
      const startB = data[startPos + 2];
      const startA = data[startPos + 3];

      // Replacement color
      const { r: fillR, g: fillG, b: fillB } = hexToRgb(fillColor);
      const fillA = 255;

      // If clicking the same color, do nothing
      if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;
      // If clicking a black line (outline), do nothing (tolerance check)
      if (startR < 50 && startG < 50 && startB < 50) return;

      const tolerance = 50; // Tolerance for "similar" colors (e.g. compression artifacts)

      const matchStartColor = (pos: number) => {
          const r = data[pos];
          const g = data[pos + 1];
          const b = data[pos + 2];
          // Simple Manhattan distance for color match
          return Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) < tolerance;
      };

      const stack = [[startX, startY]];

      while (stack.length) {
          const pop = stack.pop();
          if(!pop) continue;
          const [x, y] = pop;
          
          let pixelPos = (y * width + x) * 4;
          
          // Go up as long as we match
          let y1 = y;
          while (y1 >= 0 && matchStartColor(pixelPos)) {
              y1--;
              pixelPos -= width * 4;
          }
          y1++;
          pixelPos += width * 4; // Back to first valid

          let spanLeft = false;
          let spanRight = false;

          // Go down filling
          while (y1 < height && matchStartColor(pixelPos)) {
              // Fill Pixel
              data[pixelPos] = fillR;
              data[pixelPos + 1] = fillG;
              data[pixelPos + 2] = fillB;
              data[pixelPos + 3] = fillA;

              // Check left
              if (x > 0) {
                  if (matchStartColor(pixelPos - 4)) {
                      if (!spanLeft) {
                          stack.push([x - 1, y1]);
                          spanLeft = true;
                      }
                  } else if (spanLeft) {
                      spanLeft = false;
                  }
              }

              // Check right
              if (x < width - 1) {
                  if (matchStartColor(pixelPos + 4)) {
                      if (!spanRight) {
                          stack.push([x + 1, y1]);
                          spanRight = true;
                      }
                  } else if (spanRight) {
                      spanRight = false;
                  }
              }

              y1++;
              pixelPos += width * 4;
          }
      }

      ctx.putImageData(imageData, 0, 0);
  };

  // --- DRAWING LOGIC ---

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      
      let clientX, clientY;
      
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: Math.floor(clientX - rect.left),
          y: Math.floor(clientY - rect.top)
      };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (tool === 'bucket') {
        floodFill(x, y, color);
    } else {
        // Brush or Eraser
        setIsDrawing(true);
        lastPos.current = { x, y };
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
            ctx.lineTo(x, y); // Dot
            ctx.stroke();
        }
    }
  };

  const [isDrawing, setIsDrawing] = useState(false);

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'bucket' || !lastPos.current) return;
    e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPos.current = { x, y };
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          setTemplateName(null);
      }
  };

  // --- TEMPLATE LOGIC (AI GENERATION) ---
  const loadTemplate = async (subject: string) => {
      setIsLoadingTemplate(true);
      setTemplateName(subject);
      
      // Map simple keys to user-friendly prompts if needed
      let prompt = subject;
      if (subject === 'cat') prompt = 'cute cat face';
      if (subject === 'dino') prompt = 'baby t-rex dinosaur';
      if (subject === 'tree') prompt = 'simple oak tree';
      if (subject === 'house') prompt = 'cartoon house';

      const base64Image = await generateColoringTemplate(prompt);
      
      if (base64Image && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              // Clear and White Background first
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Scale image to fit "contain" style
              const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
              const w = img.width * scale;
              const h = img.height * scale;
              const x = (canvas.width - w) / 2;
              const y = (canvas.height - h) / 2;
              
              ctx.drawImage(img, x, y, w, h);
              setIsLoadingTemplate(false);
          };
          img.src = base64Image;
      } else {
          setIsLoadingTemplate(false);
      }
  };

  // --- SAVE LOGIC ---
  const handleSaveToGame = () => {
    if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        let charType = CharacterType.CAT; // Default fallback
        if (templateName?.includes('dog')) charType = CharacterType.DOG;
        
        onSaveToPool({
            id: Date.now().toString(),
            imageUrl: dataUrl,
            type: charType,
            color: CharacterColor.ORANGE
        });
    }
    setShowSaveDialog(false);
    clearCanvas();
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in relative">
      
      {/* Loading Overlay */}
      {isLoadingTemplate && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 rounded-3xl backdrop-blur-sm">
              <div className="text-6xl animate-bounce">🤖</div>
              <p className="text-purple-600 font-bold text-xl mt-4">Boyama sayfası çiziliyor...</p>
          </div>
      )}

      {/* Save Modal */}
      {showSaveDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-sm">
              <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center animate-pop-in border-4 border-purple-200">
                  <div className="text-6xl">🎨</div>
                  <h3 className="text-2xl font-bold text-gray-800">Harika Oldu!</h3>
                  <div className="flex flex-col gap-3 w-full">
                      <button onClick={handleSaveToGame} className="bg-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-600">
                          Oyuna Ekle 🎮
                      </button>
                      <button onClick={() => {setShowSaveDialog(false); clearCanvas();}} className="bg-yellow-400 text-yellow-900 font-bold py-3 px-6 rounded-xl hover:bg-yellow-500">
                          Yeni Sayfa Aç ✨
                      </button>
                      <button onClick={() => setShowSaveDialog(false)} className="text-gray-400 font-bold">Kapat</button>
                  </div>
              </div>
          </div>
      )}

      {/* Canvas Area */}
      <div className="relative w-full max-w-4xl aspect-video" ref={containerRef}>
        <div className="absolute -top-6 left-0 bg-blue-500 text-white px-4 py-1 rounded-t-xl font-bold z-10 shadow-sm flex items-center gap-2">
            <span>{tool === 'bucket' ? '🪣 Tıkla ve Boya' : '🖌️ Fırça Modu'}</span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl w-full h-full overflow-hidden border-[6px] border-blue-300 relative cursor-crosshair">
            <canvas
                ref={canvasRef}
                className="w-full h-full touch-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
            />
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center justify-center bg-white p-4 rounded-3xl shadow-md w-full max-w-4xl border-2 border-gray-100">
         
         {/* Controls Row */}
         <div className="w-full flex flex-wrap gap-4 items-center justify-center">
            
            {/* Colors */}
            <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl overflow-x-auto max-w-full border border-gray-100 no-scrollbar">
                {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#78350F', '#000000', '#FFFFFF'].map(c => (
                    <button 
                        key={c}
                        onClick={() => { setColor(c); if(tool === 'eraser') setTool('brush'); }}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 transition-transform flex-shrink-0 ${color === c && tool !== 'eraser' ? 'scale-110 border-gray-800' : 'border-white shadow-sm'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            
            {/* Tools */}
            <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <button 
                    onClick={() => setTool('bucket')}
                    className={`p-3 rounded-xl transition-all ${tool === 'bucket' ? 'bg-blue-100 text-blue-600 shadow-inner scale-105 ring-2 ring-blue-300' : 'bg-white hover:bg-gray-100'}`}
                    title="Doldur (Kova)"
                >
                    <span className="text-2xl">🪣</span>
                </button>
                <button 
                    onClick={() => setTool('brush')}
                    className={`p-3 rounded-xl transition-all ${tool === 'brush' ? 'bg-purple-100 text-purple-600 shadow-inner scale-105 ring-2 ring-purple-300' : 'bg-white hover:bg-gray-100'}`}
                    title="Fırça"
                >
                    <span className="text-2xl">🖌️</span>
                </button>
                <button 
                    onClick={() => setTool('eraser')}
                    className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-red-100 text-red-600 shadow-inner scale-105 ring-2 ring-red-300' : 'bg-white hover:bg-gray-100'}`}
                    title="Silgi"
                >
                    <span className="text-2xl">🧼</span>
                </button>

                <div className="w-px h-8 bg-gray-300"></div>

                <button onClick={clearCanvas} className="bg-red-50 text-red-400 p-3 rounded-xl hover:bg-red-100 active:scale-95" title="Temizle">
                    🗑️
                </button>
            </div>

            <button 
                onClick={() => setShowSaveDialog(true)}
                className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-3 px-8 rounded-full shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-[4px] transition-all ml-auto md:ml-4"
            >
                BİTTİ ✅
            </button>
         </div>

         {/* Templates Generator Strip */}
         <div className="w-full">
             <p className="text-xs text-gray-400 font-bold ml-2 mb-1 uppercase tracking-wider">Boyama Sayfası Oluştur (Tıkla)</p>
             <div className="flex gap-3 items-center justify-start md:justify-center bg-blue-50 p-3 rounded-xl overflow-x-auto no-scrollbar">
                 <button onClick={() => loadTemplate('cat')} className="template-btn">🐱 Kedi</button>
                 <button onClick={() => loadTemplate('dog')} className="template-btn">🐶 Köpek</button>
                 <button onClick={() => loadTemplate('dino')} className="template-btn">🦖 Dinozor</button>
                 <button onClick={() => loadTemplate('robot')} className="template-btn">🤖 Robot</button>
                 <div className="w-px h-8 bg-blue-200"></div>
                 <button onClick={() => loadTemplate('house')} className="template-btn">🏠 Ev</button>
                 <button onClick={() => loadTemplate('car')} className="template-btn">🚗 Araba</button>
                 <button onClick={() => loadTemplate('rocket')} className="template-btn">🚀 Roket</button>
             </div>
         </div>
         
         <style>{`
            .template-btn {
                background: white;
                padding: 10px 16px;
                border-radius: 12px;
                font-weight: bold;
                color: #4b5563;
                box-shadow: 0 2px 0 #e5e7eb;
                transition: all 0.2s;
                white-space: nowrap;
                border: 2px solid transparent;
            }
            .template-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 0 #d1d5db;
                border-color: #93c5fd;
                color: #2563eb;
            }
            .template-btn:active {
                transform: translateY(0);
                box-shadow: none;
            }
         `}</style>

      </div>
    </div>
  );
};

export default DrawingArea;