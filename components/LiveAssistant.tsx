
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, MessageSquare, Sparkles, Loader2, Volume2, Info, Activity, Radio } from 'lucide-react';
import { searchMoviesFunctionDeclaration } from '../services/geminiService';

interface LiveAssistantProps {
  onSearchResult: (query: string) => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onSearchResult }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    try {
      sessionPromiseRef.current?.then(session => session.close());
    } catch (e) {
      console.warn("Failed to close session cleanly:", e);
    }
    sessionPromiseRef.current = null;
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + ' ' + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.outputTranscription) {
              setAiTranscription(prev => prev + ' ' + message.serverContent!.outputTranscription!.text);
            }
            
            if (message.serverContent?.turnComplete) {
              setTimeout(() => {
                setTranscription('');
                setAiTranscription('');
              }, 3000);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch (e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'searchMovies') {
                  const query = fc.args.query as string;
                  onSearchResult(query);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: `Recherche effectuée pour: ${query}. L'interface a été mise à jour.` } }
                  }));
                }
              }
            }
          },
          onerror: (e) => {
            console.error('Live Assistant Error:', e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: [searchMoviesFunctionDeclaration] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "Tu es Planet AI, l'assistant vocal sophistiqué de Planet Streaming. Ton but est d'aider l'utilisateur à trouver des films et séries sur la plateforme. Utilise l'outil searchMovies dès qu'un utilisateur mentionne une recherche ou un genre. Réponds de manière concise, futuriste et professionnelle en français. Si tu effectues une recherche, informe brièvement l'utilisateur."
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start Live Assistant:', err);
      setIsConnecting(false);
    }
  };

  const toggleAssistant = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="mod-box p-4 border-l-4 border-cyan-500 shadow-[0_0_40px_rgba(0,161,250,0.1)] mb-8 overflow-hidden relative group">
      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(250%); }
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full transition-all duration-700 ${isActive ? 'bg-cyan-500 shadow-[0_0_25px_cyan]' : 'bg-slate-900 border border-white/5'}`}>
            {isActive ? (
              <Radio size={18} className="text-black animate-pulse" />
            ) : (
              <Sparkles size={18} className="text-cyan-500/50" />
            )}
          </div>
          <div>
            <h3 className="text-sm futuristic-font text-white tracking-wide">PLANET AI CONCIERGE</h3>
            <p className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.2em] opacity-80">
              {isActive ? 'SYSTÈME CONNECTÉ' : isConnecting ? 'SYNCHRONISATION...' : 'DISPONIBLE'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleAssistant}
          disabled={isConnecting}
          className={`p-3.5 rounded-full transition-all active:scale-90 relative ${
            isActive 
              ? 'bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white' 
              : 'bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-[0_5px_15px_rgba(0,161,250,0.3)]'
          }`}
        >
          {isConnecting ? <Loader2 size={22} className="animate-spin" /> : isActive ? <MicOff size={22} /> : <Mic size={22} />}
          {isActive && <div className="absolute -inset-1 rounded-full border-2 border-red-500/50 animate-ping pointer-events-none"></div>}
        </button>
      </div>

      <div className="bg-black/80 rounded-xl p-4 min-h-[80px] border border-white/5 relative overflow-hidden flex flex-col justify-center">
        {isActive ? (
          <div className="space-y-3 relative z-10">
            <div className="flex items-start gap-3">
              <Activity size={14} className="text-cyan-500 mt-0.5 animate-pulse" />
              <p className="text-[12px] text-slate-200 italic font-medium leading-relaxed">
                {transcription || "Système à l'écoute..."}
              </p>
            </div>
            {aiTranscription && (
              <div className="flex items-start gap-3 border-t border-white/10 pt-3">
                <Volume2 size={14} className="text-cyan-400 mt-0.5" />
                <p className="text-[12px] text-cyan-100 font-bold leading-relaxed">
                  {aiTranscription}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-40 py-4 relative z-10">
            <MessageSquare size={24} className="text-slate-500 mb-2" />
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">ACTIVER L'ASSISTANCE VOCALE</p>
          </div>
        )}
        
        {/* Cinematic Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(0,255,255,0.05),rgba(0,255,255,0.02),rgba(0,0,255,0.05))] bg-[length:100%_3px,4px_100%]"></div>
        {isActive && (
          <div className="absolute inset-x-0 h-[2px] bg-cyan-400/30 shadow-[0_0_15px_cyan] animate-[scan_2s_ease-in-out_infinite]"></div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/5 border border-white/5">
            <Info size={10} className="text-slate-500" />
          </div>
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">
            PROCESSEUR GEMINI 2.5 FLASH NATIVE
          </p>
        </div>
        {isActive && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAssistant;
