import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { tools } from '../services/geminiService';
import { SYSTEM_INSTRUCTION } from '../constants';

interface Props {
  onAction: (action: any) => void;
  gameState: any;
  audioContext: AudioContext;
  isMuted: boolean;
  isMicOn: boolean;
}

const VoiceController: React.FC<Props> = ({ onAction, audioContext, isMuted, isMicOn }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Sync prop to ref for use inside onaudioprocess closure
  const isMicOnRef = useRef(isMicOn);
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

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
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        // Input Context (Mic)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputContext = new AudioContextClass({ sampleRate: 16000 }); 

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseModalities: [Modality.AUDIO],
                tools: [{ functionDeclarations: tools }],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            },
            callbacks: {
                onopen: () => {
                    setIsActive(true);
                    console.log("Live API Connected");
                    
                    // Setup Audio Chain: Source -> Gain (Boost) -> Processor -> Destination
                    const source = inputContext.createMediaStreamSource(stream);
                    const gainNode = inputContext.createGain();
                    const processor = inputContext.createScriptProcessor(4096, 1, 1);
                    
                    // BOOST VOLUME for kids (2.0x)
                    gainNode.gain.value = 2.0; 

                    processor.onaudioprocess = (e) => {
                        // CRITICAL CHECK: If mic is toggled off in UI, do not send data
                        if (!isMicOnRef.current) return;

                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(gainNode);
                    gainNode.connect(processor);
                    processor.connect(inputContext.destination);
                    
                    inputSourceRef.current = source;
                    gainNodeRef.current = gainNode;
                    processorRef.current = processor;

                    // GREETING
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
                    // 1. Handle Interruption (Child spoke while AI was speaking)
                    const interrupted = msg.serverContent?.interrupted;
                    if (interrupted) {
                        console.log("Interrupted by user");
                        if (activeSourceRef.current) {
                            try { activeSourceRef.current.stop(); } catch(e){}
                            activeSourceRef.current = null;
                        }
                        setIsSpeaking(false);
                        nextStartTimeRef.current = 0;
                        return; // Stop processing this message
                    }

                    // 2. Handle Audio Output
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

                    // 3. Handle Function Calls
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
                    // Don't show error immediately to kid, try to silent reconnect or just log
                    if (!isActive) setError("Bağlantı Hatası");
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
      // MUTE CHECK
      if (isMuted) return;

      const ctx = audioContext;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      
      activeSourceRef.current = source;
      setIsSpeaking(true);

      source.onended = () => {
          if (activeSourceRef.current === source) {
             activeSourceRef.current = null;
          }
          if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
             setIsSpeaking(false);
          }
      };
  };

  const stopSession = () => {
     if (inputSourceRef.current) inputSourceRef.current.disconnect();
     if (gainNodeRef.current) gainNodeRef.current.disconnect();
     if (processorRef.current) processorRef.current.disconnect();
     if (activeSourceRef.current) {
         try { activeSourceRef.current.stop(); } catch(e){}
     }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 p-3 rounded-full shadow-lg transition-all ${isActive ? 'bg-white border-2 border-green-400' : 'bg-gray-100'}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isActive ? (isMicOn ? (isSpeaking ? 'bg-purple-500' : 'bg-green-500') : 'bg-gray-400') : 'bg-red-500'}`}>
             {isSpeaking && isMicOn && <div className="w-full h-full bg-purple-300 rounded-full animate-ping"></div>}
             {!isSpeaking && isActive && isMicOn && <div className="w-full h-full bg-green-300 rounded-full animate-pulse"></div>}
        </div>
        <span className="font-bold text-sm text-gray-600 select-none hidden md:inline">
            {error ? error : (isActive ? (isMicOn ? (isSpeaking ? 'Konuşuyor...' : 'Dinliyor...') : 'Mikrofon Kapalı') : 'Bağlanıyor...')}
        </span>
        {!isMicOn && <span className="text-red-500 text-xs font-bold">❌</span>}
        {isMuted && <span className="text-red-500 text-xs font-bold">🔇</span>}
    </div>
  );
};

export default VoiceController;