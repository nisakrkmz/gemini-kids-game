import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { tools } from '../services/geminiService';
import { SYSTEM_INSTRUCTION } from '../constants';

interface Props {
  onAction: (action: any) => void;
  gameState: any;
  audioContext: AudioContext;
}

const VoiceController: React.FC<Props> = ({ onAction, audioContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // New state for visual feedback
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    startSession();
    return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    if(!process.env.API_KEY) {
        setError("API Key Eksik");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Input Context (Mic) - Output Context is passed via props (audioContext)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputContext = new AudioContextClass({ sampleRate: 16000 }); 

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseModalities: [Modality.AUDIO],
                tools: [{ functionDeclarations: tools }],
            },
            callbacks: {
                onopen: () => {
                    setIsActive(true);
                    console.log("Live API Connected");
                    
                    // Setup Input Stream
                    const source = inputContext.createMediaStreamSource(stream);
                    const processor = inputContext.createScriptProcessor(4096, 1, 1);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(processor);
                    processor.connect(inputContext.destination);
                    
                    inputSourceRef.current = source;
                    processorRef.current = processor;

                    // FORCE GREETING with a slight delay to ensure socket is ready
                    setTimeout(() => {
                        sessionPromise.then(session => {
                            console.log("Triggering Greeting...");
                            session.sendRealtimeInput({ 
                                content: { parts: [{ text: "SESSION_START" }] } 
                            });
                        });
                    }, 500);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Handle Audio Output
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        try {
                            const buffer = await decodeAudioData(
                                base64ToUint8Array(audioData),
                                audioContext
                            );
                            playAudio(buffer);
                        } catch (e) { console.error("Decode Error", e); }
                    }

                    // Handle Function Calls
                    const toolCall = msg.toolCall;
                    if (toolCall) {
                        for (const fc of toolCall.functionCalls) {
                            console.log("Function Call:", fc.name, fc.args);
                            onAction({ type: fc.name, payload: fc.args });
                            
                            sessionPromise.then(session => {
                                session.sendToolResponse({
                                    functionResponses: {
                                        name: fc.name,
                                        id: fc.id,
                                        response: { result: 'OK' }
                                    }
                                });
                            });
                        }
                    }
                },
                onclose: () => {
                    setIsActive(false);
                    console.log("Session Closed");
                },
                onerror: (e) => {
                    console.error("Session Error", e);
                    setError("Bağlantı Hatası");
                }
            }
        });

        sessionPromiseRef.current = sessionPromise;

    } catch (err) {
        console.error("Mic Access Denied", err);
        setError("Mikrofon izni gerekli");
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
      // Create source from the passed audioContext
      const ctx = audioContext;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      // Visual feedback logic
      setIsSpeaking(true);
      source.onended = () => {
          // Only turn off if no other audio is scheduled closely (simplified)
          if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
             setIsSpeaking(false);
          }
      };
  };

  const stopSession = () => {
     if (inputSourceRef.current) inputSourceRef.current.disconnect();
     if (processorRef.current) processorRef.current.disconnect();
     // Do not close audioContext as it belongs to App
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-white border-2 border-green-400' : 'bg-gray-100'}`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-green-500' : 'bg-red-500'}`}>
             {isSpeaking && <div className="w-full h-full bg-green-300 rounded-full animate-ping"></div>}
        </div>
        <span className="font-bold text-sm text-gray-600">
            {error ? error : (isActive ? (isSpeaking ? 'Konuşuyor...' : 'Dinliyor...') : 'Bağlanıyor...')}
        </span>
    </div>
  );
};

export default VoiceController;