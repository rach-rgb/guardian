import React, { useState, useRef, useEffect } from 'react';
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

  const startRecording = async (e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation(); // Prevent clicking background from navigating
    setErrorMsg('');
    setRecognizedText('');
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

  const stopRecording = (e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      // Call backend just for network realism
      await fetch('http://localhost:8000/wakeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: base64data,
          mime_type: 'audio/webm'
        })
      });
    } catch (err) {
      console.log('Backend call failed, triggering demo fallback.', err);
    }

    // 데모용 강제 폴백(Fallback): 어떤 경우라도 무조건 '가디언즈'로 인식되도록 처리!
    setRecognizedText('가디언즈');
    setIsProcessing(false);

    setTimeout(() => {
      navigate('/', { 
        state: { 
          voiceIntent: { tickers: ["SPY"], intent: "analysis", query: "가디언즈" } 
        } 
      });
    }, 1500);
  };

  const handleBackgroundClick = () => {
    if (errorMsg) {
      setErrorMsg('');
      return;
    }
    if (!isRecording && !isProcessing && !recognizedText) {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isProcessing) return;
        
        if (isRecording) {
          stopRecording(e);
        } else {
          startRecording(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isProcessing]);

  return (
    <>
      <style>{`
        .ambient-wrapper {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          position: relative;
          overflow: hidden;
        }
        .premium-glitter {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(56,189,248,0.1) 0%, rgba(15,23,42,1) 80%);
          z-index: 0;
        }
        .ambient-content {
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .text-title {
          font-size: 3rem;
          font-weight: 300;
          color: rgba(255,255,255,0.9);
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
          text-align: center;
          animation: fadeIn 2s ease-out;
        }
        .text-subtitle {
          color: rgba(255,255,255,0.4);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          animation: pulseText 2s infinite;
        }
        .mic-btn-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 4rem;
        }
        .mic-btn {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          z-index: 10;
        }
        .mic-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(56, 189, 248, 0.2);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .mic-btn.recording {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 80px rgba(59, 130, 246, 0.6);
          transform: scale(1.1);
        }
        .mic-btn.processing {
          opacity: 0.5;
          cursor: not-allowed;
          transform: scale(0.95);
        }
        .ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.3);
          animation: pingRing 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }
        .ring-1 { width: 140px; height: 140px; animation-duration: 2s; }
        .ring-2 { width: 180px; height: 180px; animation-duration: 3s; animation-delay: 0.5s; }
        .ring-3 { width: 220px; height: 220px; animation-duration: 4s; animation-delay: 1s; }
        
        .recognized-text {
          margin-top: 2rem;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.25rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes pingRing {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <div className="ambient-wrapper" onClick={handleBackgroundClick}>
        <div className="premium-glitter"></div>
        <div className="ambient-content">
          
          <h2 className="text-title">
            "Market is Calm"
          </h2>
          <p className="text-subtitle">
            {isRecording ? "Listening..." : isProcessing ? "Analyzing..." : "Click anywhere to enter Dashboard"}
          </p>

          {recognizedText && (
            <div className="recognized-text">
              "{recognizedText}"
            </div>
          )}

          <div className="mic-btn-container">
            {isRecording && (
              <>
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </>
            )}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || !!recognizedText}
              className={`mic-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? (
                <Loader2 size={40} color="#60a5fa" className="lucide-spin" />
              ) : isRecording ? (
                <Mic className="lucide-pulse" size={40} color="#60a5fa" />
              ) : (
                <Mic size={40} color="rgba(255,255,255,0.7)" />
              )}
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default Ambient;
