import React, { useRef, useState, useEffect } from 'react';

interface Props {
    voiceRequestedShape: string | null;
    onShapeHandled: () => void;
}

const DrawingArea: React.FC<Props> = ({ voiceRequestedShape, onShapeHandled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  // Handle Voice Commands
  useEffect(() => {
      if (voiceRequestedShape) {
          drawTemplate(voiceRequestedShape);
          onShapeHandled();
      }
  }, [voiceRequestedShape]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? 30 : lineWidth; // Eraser is bigger
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
        offsetY: (e as React.MouseEvent).nativeEvent.offsetY
      };
    }
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
  }

  // --- TEMPLATE LOGIC ---
  const drawTemplate = (shape: string) => {
      const canvas = canvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3; // Slightly thinner for smaller shapes
      ctx.lineJoin = 'round';

      if (shape === 'heart') {
           // Scaled down by ~50%
           ctx.moveTo(cx, cy + 50);
           ctx.bezierCurveTo(cx - 75, cy, cx - 75, cy - 75, cx, cy - 40);
           ctx.bezierCurveTo(cx + 75, cy - 75, cx + 75, cy, cx, cy + 50);
      } else if (shape === 'star' || shape === 'stars') {
          // Main star scaled down
          drawStar(ctx, cx, cy, 50, 25);
          // Small stars closer and smaller
          drawStar(ctx, cx - 80, cy - 60, 15, 7);
          drawStar(ctx, cx + 80, cy - 40, 10, 5);
      } else if (shape === 'flower') {
          // Center
          ctx.arc(cx, cy, 15, 0, Math.PI * 2);
          // Petals
          for(let i=0; i<6; i++) {
              const angle = (i * Math.PI) / 3;
              const px = cx + Math.cos(angle) * 15;
              const py = cy + Math.sin(angle) * 15;
              ctx.moveTo(px, py);
              ctx.arc(px + Math.cos(angle)*20, py + Math.sin(angle)*20, 20, 0, Math.PI * 2);
          }
      } else if (shape === 'cloud') {
          // Compact cloud
          drawCloud(ctx, cx, cy);
      } else if (shape === 'tree') {
          // Trunk smaller
          ctx.rect(cx - 15, cy + 25, 30, 75);
          ctx.stroke();
          // Leaves compact
          ctx.beginPath();
          ctx.moveTo(cx - 50, cy + 25);
          ctx.bezierCurveTo(cx - 75, cy, cx - 25, cy - 75, cx, cy - 50);
          ctx.bezierCurveTo(cx + 25, cy - 75, cx + 75, cy, cx + 50, cy + 25);
          ctx.bezierCurveTo(cx + 25, cy + 40, cx - 25, cy + 40, cx - 50, cy + 25);
      } else if (shape === 'house') {
          // Base 100px wide
          ctx.rect(cx - 50, cy, 100, 75);
          // Roof
          ctx.moveTo(cx - 60, cy);
          ctx.lineTo(cx, cy - 50);
          ctx.lineTo(cx + 60, cy);
          // Door
          ctx.rect(cx - 15, cy + 35, 30, 40);
          // Window
          ctx.rect(cx + 20, cy + 15, 20, 20);
      } else if (shape === 'sun') {
          // Smaller sun
          ctx.arc(cx, cy - 25, 30, 0, Math.PI * 2);
          // Rays
          for(let i=0; i<8; i++) {
              const angle = (i * Math.PI) / 4;
              ctx.moveTo(cx + Math.cos(angle) * 40, (cy - 25) + Math.sin(angle) * 40);
              ctx.lineTo(cx + Math.cos(angle) * 60, (cy - 25) + Math.sin(angle) * 60);
          }
      } else if (shape === 'balloon') {
          // Balloon
          ctx.ellipse(cx, cy - 25, 35, 45, 0, 0, 2 * Math.PI);
          // String
          ctx.moveTo(cx, cy + 20);
          ctx.bezierCurveTo(cx + 10, cy + 40, cx - 10, cy + 60, cx, cy + 80);
      }

      ctx.stroke();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / 5;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < 5; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
  }

  const drawCloud = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
      // Scaled down coordinates
      ctx.moveTo(cx - 50, cy);
      ctx.bezierCurveTo(cx-55, cy-30, cx-30, cy-50, cx-10, cy-35);
      ctx.bezierCurveTo(cx, cy-55, cx+35, cy-55, cx+40, cy-30);
      ctx.bezierCurveTo(cx+65, cy-25, cx+65, cy+10, cx+45, cy+20);
      ctx.lineTo(cx-45, cy+20);
      ctx.bezierCurveTo(cx-65, cy+15, cx-65, cy-10, cx-50, cy);
  }

  // Set canvas size
  useEffect(() => {
      if(canvasRef.current) {
          canvasRef.current.width = canvasRef.current.offsetWidth;
          canvasRef.current.height = canvasRef.current.offsetHeight;
      }
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
      <div className="bg-white p-2 rounded-3xl shadow-xl w-full max-w-4xl aspect-video relative overflow-hidden border-4 border-yellow-300">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {voiceRequestedShape && <div className="absolute top-2 right-2 bg-green-400 text-white px-3 py-1 rounded-full text-sm animate-bounce">Çiziliyor: {voiceRequestedShape}</div>}
      </div>

      <div className="flex flex-col gap-4 items-center justify-center bg-white p-4 rounded-3xl shadow-md w-full max-w-4xl">
         
         <div className="w-full flex flex-wrap gap-4 items-center justify-center">
            {/* Colors */}
            <div className="flex gap-2 bg-gray-100 p-2 rounded-xl">
                {['#000000', '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#EC4899', '#A855F7'].map(c => (
                    <button 
                        key={c}
                        onClick={() => { setColor(c); setIsEraser(false); }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-transform ${color === c && !isEraser ? 'scale-125 border-gray-800' : 'border-white'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            
            {/* Tools */}
            <div className="flex gap-2 items-center bg-gray-100 p-2 rounded-xl">
                {/* Brush Sizes */}
                {[3, 8, 15].map(size => (
                    <button
                        key={size}
                        onClick={() => { setLineWidth(size); setIsEraser(false); }}
                        className={`bg-white rounded-full flex items-center justify-center w-8 h-8 md:w-10 md:h-10 border-2 ${lineWidth === size && !isEraser ? 'border-purple-500 bg-purple-100' : 'border-transparent'}`}
                    >
                        <div className="bg-gray-800 rounded-full" style={{ width: size, height: size }}></div>
                    </button>
                ))}
                
                <div className="w-px h-8 bg-gray-300 mx-1"></div>

                {/* Eraser */}
                <button 
                    onClick={() => setIsEraser(true)}
                    className={`flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 transition-colors ${isEraser ? 'bg-red-100 border-red-400 text-red-600' : 'bg-white border-transparent text-gray-500'}`}
                >
                    <span className="text-xl">🧼</span>
                </button>
            </div>

            <div className="ml-auto">
                <button onClick={clearCanvas} className="bg-red-500 text-white font-bold p-3 rounded-xl hover:bg-red-600 shadow-md">
                    TEMİZLE 🗑️
                </button>
            </div>
         </div>

         {/* Templates */}
         <div className="w-full flex gap-2 items-center justify-center bg-blue-50 p-3 rounded-xl overflow-x-auto">
             <span className="text-sm font-bold text-blue-500 whitespace-nowrap hidden md:block">Şablonlar:</span>
             <button onClick={() => drawTemplate('tree')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Ağaç">🌳</button>
             <button onClick={() => drawTemplate('house')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Ev">🏠</button>
             <button onClick={() => drawTemplate('sun')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Güneş">☀️</button>
             <button onClick={() => drawTemplate('balloon')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Balon">🎈</button>
             <button onClick={() => drawTemplate('flower')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Çiçek">🌸</button>
             <button onClick={() => drawTemplate('star')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Yıldız">⭐</button>
             <button onClick={() => drawTemplate('cloud')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Bulut">☁️</button>
             <button onClick={() => drawTemplate('heart')} className="p-2 hover:bg-white rounded-lg text-2xl transition-transform hover:scale-110" title="Kalp">❤️</button>
         </div>

      </div>
    </div>
  );
};

export default DrawingArea;