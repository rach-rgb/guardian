import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const Ambient: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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

        const result = await response.json();
        console.log('Intent Extracted:', result);
        
        // Navigate to dashboard and optionally pass the intent data
        navigate('/', { state: { voiceIntent: result } });
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
      <div className="ambient-content flex flex-col items-center justify-center h-full space-y-8 z-10 relative">
        <div className="text-center">
          <h2 className="text-5xl font-light text-white mb-4 fade-in tracking-wider">
            {isProcessing ? "분석 중..." : "Market is Calm"}
          </h2>
          <p className="text-blue-200/60 pulse tracking-widest text-sm uppercase">
            {!isRecording && !isProcessing && "Click anywhere to enter Dashboard"}
            {isRecording && "Listening... Click mic to stop"}
          </p>
          {errorMsg && <p className="text-red-400 mt-4 text-sm bg-black/50 p-2 rounded">{errorMsg}</p>}
        </div>

        <button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`
            p-6 rounded-full transition-all duration-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]
            ${isRecording ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-white/5 hover:bg-white/10 border border-white/10'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-12 h-12 text-red-400" />
          ) : (
            <Mic className="w-12 h-12 text-blue-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Ambient;
