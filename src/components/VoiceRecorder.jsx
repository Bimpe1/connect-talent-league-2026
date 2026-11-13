import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check } from 'lucide-react';
import { MAX_EVIDENCE_BYTES, baseMime } from '../lib/media';

const MAX_SECONDS = 60;

export default function VoiceRecorder({ onVoiceRecorded, onVoiceRemoved, onTranscriptGenerated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  // refs so the recorder's onstop callback sees current values (state would be stale there)
  const secondsRef = useRef(0);
  const transcriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscriptGenerated);
  useEffect(() => { onTranscriptRef.current = onTranscriptGenerated; }, [onTranscriptGenerated]);

  // Optional live transcript where the browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-GB';
      recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + ' ';
        transcriptRef.current = text.trim();
        setTranscript(transcriptRef.current);
        onTranscriptRef.current?.(transcriptRef.current);
      };
      recognitionRef.current = recognition;
    } catch { /* speech recognition is optional */ }
    return undefined;
  }, []);

  // Stop everything if the component goes away mid-recording
  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { recognitionRef.current?.stop(); } catch { /* not running */ }
  }, []);

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    try { recognitionRef.current?.stop(); } catch { /* not running */ }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];
    secondsRef.current = 0;
    transcriptRef.current = '';
    setTranscript('');
    setAudioUrl(null);
    setRecordSeconds(0);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported on this device or browser. Please type your answer instead.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('We could not access your microphone. Allow microphone access in your browser, or type your answer instead.');
      return;
    }
    streamRef.current = stream;

    // best supported type (Android/desktop: webm, iPhone: mp4)
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: baseMime(recorder.mimeType || mimeType) || 'audio/mp4' });
      if (blob.size === 0) { setError('Nothing was recorded. Please try again.'); return; }
      if (blob.size > MAX_EVIDENCE_BYTES) { setError('That recording is too large. Please record a shorter note.'); return; }
      const url = URL.createObjectURL(blob); // local preview only; the file is uploaded on submit
      setAudioUrl(url);
      onVoiceRecorded?.({ url, blob, mime: blob.type, duration: secondsRef.current, transcript: transcriptRef.current });
    };

    recorder.start(250);
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setRecordSeconds(secondsRef.current);
      if (secondsRef.current >= MAX_SECONDS) stopRecording();
    }, 1000);
    try { recognitionRef.current?.start(); } catch { /* already started */ }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript('');
    setRecordSeconds(0);
    setError('');
    onVoiceRemoved?.();
  };

  const formatTime = (secs) =>
    `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition space-y-3">
      {!audioUrl ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3.5">
            {!isRecording ? (
              <button type="button" onClick={startRecording}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95">
                <Mic size={16} /><span>Start Recording</span>
              </button>
            ) : (
              <button type="button" onClick={stopRecording}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition active:scale-95">
                <Square size={15} className="text-rose-400 fill-rose-400" />
                <span>Stop Recording ({formatTime(recordSeconds)})</span>
              </button>
            )}
            {isRecording && <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />}
          </div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">
            {isRecording ? `Listening… (stops automatically at ${MAX_SECONDS}s)` : 'Click record to speak your answer'}
          </span>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-emerald-800 flex items-center gap-2">
              <Check size={16} className="text-emerald-600" /> Voice Note Ready ({formatTime(recordSeconds)})
            </span>
            <button type="button" onClick={resetRecording}
              className="text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 text-xs sm:text-sm">
              <Trash2 size={14} /><span>Delete &amp; Re-record</span>
            </button>
          </div>
          <audio src={audioUrl} controls className="w-full h-9" />
        </div>
      )}

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs sm:text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      {transcript && (
        <div className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Voice Transcript:</span>
          <p className="italic font-medium">{transcript}</p>
        </div>
      )}
    </div>
  );
}
