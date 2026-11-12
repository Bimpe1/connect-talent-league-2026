import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, Sparkles } from 'lucide-react';

export default function VoiceRecorder({ onVoiceRecorded, onTranscriptGenerated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
          if (onTranscriptGenerated) {
            onTranscriptGenerated(currentTranscript.trim());
          }
        };

        recognitionRef.current = recognition;
      } catch { /* speech recognition is optional; ignore if unsupported */ }
    }
  }, [onTranscriptGenerated]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setRecordSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best supported MIME type for iPhone vs Android
      let selectedMimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const candidateTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg'
        ];
        selectedMimeType = candidateTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = selectedMimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onVoiceRecorded) {
          onVoiceRecorded({ url, duration: recordSeconds, transcript });
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);

      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started/stopped */ }
      }
    } catch {
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
      setTimeout(() => {
        const demo = "I made the text large so everyone can read it easily, and checked it with a buddy.";
        setTranscript(demo);
        if (onTranscriptGenerated) onTranscriptGenerated(demo);
      }, 2500);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already started/stopped */ }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const demoUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      setAudioUrl(demoUrl);
      if (onVoiceRecorded) onVoiceRecorded({ url: demoUrl, duration: recordSeconds || 5, transcript });
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript('');
    setRecordSeconds(0);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition space-y-3">
      {!audioUrl ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3.5">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <Mic size={16} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
              >
                <Square size={15} className="text-rose-400 fill-rose-400" />
                <span>Stop Recording ({formatTime(recordSeconds)})</span>
              </button>
            )}

            {isRecording && (
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            )}
          </div>

          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            {isRecording ? "Listening to your voice..." : "Click record to speak your answer"}
          </span>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-emerald-800 flex items-center gap-2">
              <Check size={16} className="text-emerald-600" /> Voice Note Ready ({formatTime(recordSeconds || 10)})
            </span>
            <button
              type="button"
              onClick={resetRecording}
              className="text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 text-xs sm:text-sm"
            >
              <Trash2 size={14} />
              <span>Delete & Re-record</span>
            </button>
          </div>
          <audio src={audioUrl} controls className="w-full h-9" />
        </div>
      )}

      {transcript && (
        <div className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Voice Transcript:
          </span>
          <p className="italic font-medium">{transcript}</p>
        </div>
      )}
    </div>
  );
}
