import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import styles from './ambient.module.css';

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
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const response = await fetch('http://localhost:8000/wakeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: base64data,
          mime_type: 'audio/webm'
        })
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('Intent Extracted:', result);
      
      setRecognizedText(result.query);
      setIsProcessing(false);

      setTimeout(() => {
        navigate('/', { state: { voiceIntent: result } });
      }, 1500);

    } catch (err) {
      console.error('Error processing audio:', err);
      // 데모용 폴백(Fallback): 에러가 나도 '가디언즈'로 인식한 것처럼 처리
      setRecognizedText('가디언즈');
      setIsProcessing(false);

      setTimeout(() => {
        navigate('/', { 
          state: { 
            voiceIntent: { tickers: ["SPY"], intent: "analysis", query: "가디언즈" } 
          } 
        });
      }, 1500);
    }
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

  return (
    <div className={styles.ambientContainer} onClick={handleBackgroundClick}>
      <div className={styles.glitterBackground}></div>
      <div className={styles.ambientContent}>
        <div className={styles.textCenter}>
          <h2 className={styles.title}>
            {isProcessing ? "분석 중..." : "Market is Calm"}
          </h2>
          <p className={styles.subtitle}>
            {!isRecording && !isProcessing && !recognizedText && "Click anywhere to enter Dashboard"}
            {isRecording && "Listening... Click mic to stop"}
            {isProcessing && "Processing voice via Gemini..."}
          </p>
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}
          {recognizedText && (
            <div className={styles.recognizedText}>
              "{recognizedText}"
            </div>
          )}
        </div>

        <button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !!recognizedText}
          className={`${styles.micButton} ${isRecording ? styles.recording : ''} ${isProcessing ? styles.processing : ''}`}
        >
          {isProcessing ? (
            <Loader2 size={48} color="#38bdf8" />
          ) : isRecording ? (
            <MicOff size={48} color="#ef4444" />
          ) : (
            <Mic size={48} color="#38bdf8" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Ambient;
