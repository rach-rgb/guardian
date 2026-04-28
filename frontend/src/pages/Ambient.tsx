import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const Ambient: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking background from navigating
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setErrorMsg('마이크 접근에 실패했습니다. 권한을 확인해주세요.');
    }
  };

  const stopRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Send to backend
        const response = await fetch('http://localhost:8000/wakeup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_base64: base64data,
            mime_type: 'audio/webm'
          })
        });

        if (!response.ok) {
          throw new Error('서버 응답 오류');
        }

        const data = await response.json();
        const isStockMarketRelated = data.is_stock_market_related;
        const textStr = data.text;
        
        setRecognizedText(textStr);
        
        if (isStockMarketRelated) {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // Stay on Ambient page
          console.log("Not a stock market related query.");
          setTimeout(() => {
            setIsProcessing(false); // Reset processing state
            setRecognizedText('');
          }, 3000);
        }
      };
    } catch (err) {
      console.error('Error processing audio:', err);
      setErrorMsg('음성 분석 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const handleBackgroundClick = () => {
    if (!isRecording && !isProcessing) {
      navigate('/');
    }
  };

  return (
    <div className="ambient-container" onClick={handleBackgroundClick}>
      <div className="glitter-background"></div>
      <div className="ambient-content flex flex-col items-center justify-center h-full z-10 relative">
        {/* Text Area (Moved below the mic) */}
        <div className="text-center flex flex-col items-center">
          <h2 className="text-4xl font-light text-white/90 mb-3 fade-in tracking-widest">
            "Market is Calm"
          </h2>
          <p className="text-white/40 tracking-widest text-sm uppercase font-mono">
            {isRecording && "Listening..."}
            {isProcessing &&"Analyzing..."}
          </p>
          
          {recognizedText && (
            <div className="mt-8 p-5 bg-black/40 rounded-2xl border border-white/10 text-white/90 font-mono text-lg text-center backdrop-blur-md shadow-2xl max-w-lg mx-auto">
              "{recognizedText}"
            </div>
          )}
          {errorMsg && <p className="text-red-400 mt-6 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{errorMsg}</p>}
        </div>

        {/* Modern Mic Button Area */}
        <div className="relative flex justify-center items-center mb-12 mt-10">
          {/* Pulsing rings when recording */}
          {isRecording && (
            <>
              <div className="absolute w-36 h-36 bg-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute w-48 h-48 border border-blue-500/20 rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
              <div className="absolute w-60 h-60 border border-blue-500/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            </>
          )}
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              relative z-10 p-8 rounded-full backdrop-blur-md transition-all duration-700 ease-out
              ${isRecording 
                ? 'bg-blue-600/20 border border-blue-400/50 shadow-[0_0_60px_rgba(59,130,246,0.6)] scale-110' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed scale-95' : 'cursor-pointer hover:scale-105'}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" strokeWidth={1.5} />
            ) : isRecording ? (
              <Mic className="w-10 h-10 text-blue-400 animate-pulse" strokeWidth={1.5} />
            ) : (
              <Mic className="w-10 h-10 text-white/70" strokeWidth={1.5} />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ambient;
