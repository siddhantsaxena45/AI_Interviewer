// frontend/src/pages/InterviewRunner.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById } from '../features/sessions/sessionSlice';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/sessions/`;
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
});

// Supported Languages for Monaco
const SUPPORTED_LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'R Language', value: 'r' }
];

function InterviewRunner() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { activeSession, message } = useSelector(state => state.sessions);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [drafts, setDrafts] = useState({});
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [submittingStates, setSubmittingStates] = useState({});

    // Default language state
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const currentQuestion = activeSession?.questions[currentQuestionIndex];
    const isThisQuestionSubmitting = submittingStates[currentQuestionIndex] || (currentQuestion?.isSubmitted && !currentQuestion?.isEvaluated);
    const isThisQuestionSubmitted = currentQuestion?.isSubmitted;
    const isThisQuestionEvaluated = currentQuestion?.isEvaluated;

    useEffect(() => {
        dispatch(getSessionById(sessionId));
    }, [dispatch, sessionId]);

    // Auto-detect language based on role on initial load
    useEffect(() => {
        if (activeSession?.role) {
            const role = activeSession.role.toLowerCase();
            if (role.includes('python') || role.includes('data scientist')) setSelectedLanguage('python');
            else if (role.includes('r language')) setSelectedLanguage('r');
            else if (role.includes('cpp') || role.includes('c++')) setSelectedLanguage('cpp');
            else if (role.includes('java')) setSelectedLanguage('java');
        }
    }, [activeSession]);

    useEffect(() => {
        if (message) {
            setStatusMessage(message);
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes("ready") || lowerMsg.includes("complete") || lowerMsg.includes("failed")) {
                setSubmittingStates({});
            }
        }
    }, [message]);

const handleEndInterview = async () => {
    // 1. Frontend Pre-check: Check local state for active submissions
    const isProcessingLocally = Object.values(submittingStates).some(state => state === true);

    if (isProcessingLocally) {
        alert("AI is currently evaluating an answer. Please wait a moment before finishing.");
        return;
    }

    if (!window.confirm("Are you sure? Unanswered questions will be marked 0%.")) return;

    try {
        setStatusMessage('Finalizing...');
        setSubmittingStates(prev => ({ ...prev, global: true }));
        
        await api.post(`/${sessionId}/end`);
        navigate(`/review/${sessionId}`);
    } catch (error) {
        // 2. Error Handling: Show the backend's "Cannot end" message to the user
        const errorMessage = error.response?.data?.message || "Failed to end interview.";
        alert(errorMessage); 
        
        // Reset the loading state so the button is clickable again
        setSubmittingStates(prev => {
            const newState = { ...prev };
            delete newState.global;
            return newState;
        });
        setStatusMessage('Ready');
    }
};
    const currentDraft = drafts[currentQuestionIndex] || {
        code: currentQuestion?.userSubmittedCode || '',
        audio: null
    };

    const updateDraftCode = (newCode) => {
        setDrafts(prev => ({
            ...prev,
            [currentQuestionIndex]: { ...prev[currentQuestionIndex], code: newCode }
        }));
    };

    const setDraftAudio = (blob) => {
        setDrafts(prev => ({
            ...prev,
            [currentQuestionIndex]: { ...prev[currentQuestionIndex], audio: blob }
        }));
    };

    const handleRedo = () => {
        if (isRecording) stopRecording();
        setDraftAudio(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
    };

    const handleNavigation = (newIndex) => {
        if (newIndex >= 0 && newIndex < activeSession.questions.length) {
            if (isRecording) stopRecording();
            setCurrentQuestionIndex(newIndex);
            setRecordingTime(0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setDraftAudio(blob);
                if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            };
            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (error) { alert("Mic access denied."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isRecording) stopRecording();
        const subIndex = currentQuestionIndex;
        setSubmittingStates(prev => ({ ...prev, [subIndex]: true }));
        const formData = new FormData();
        formData.append('questionIndex', subIndex.toString());
        if (currentDraft.audio) formData.append('audioFile', currentDraft.audio, `q${subIndex}.webm`);
        formData.append('code', currentDraft.code);

        try {
            await api.post(`/${sessionId}/submit-answer`, formData);
            setDrafts(prev => ({ ...prev, [subIndex]: { ...prev[subIndex], audio: null } }));
        } catch (error) {
            setSubmittingStates(prev => ({ ...prev, [subIndex]: false }));
        }
    };

    if (!activeSession) return <div className="text-center py-20 font-black text-slate-400 animate-pulse uppercase tracking-[0.2em]">Synchronizing...</div>;

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 mb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{activeSession.role}</h1>
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mt-1">
                        {activeSession.questions.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleNavigation(idx)}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${idx === currentQuestionIndex ? 'ring-2 sm:ring-4 ring-blue-100 bg-blue-600 scale-125' :
                                        q.isEvaluated ? 'bg-emerald-500' :
                                            q.isSubmitted ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
               
                <button
                    type="button"
                    onClick={handleEndInterview}
                    disabled={Object.values(submittingStates).some(s => s === true)}
                    className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all ${Object.values(submittingStates).some(s => s === true)
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-rose-600'
                        }`}
                >
                    {submittingStates.global ? 'Finalizing...' : 'Finish Interview'}
                </button>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl border-b-4 sm:border-b-8 border-blue-600">
                <div className="flex justify-between mb-2">
                    <span className="text-blue-400 font-black text-[9px] uppercase tracking-widest">Question {currentQuestionIndex + 1}</span>
                    <span className="text-slate-500 text-[9px] font-bold uppercase truncate max-w-[150px]">{message || 'Ready'}</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-medium leading-relaxed">{currentQuestion?.questionText}</h2>
            </div>

            <div className="flex justify-between gap-3">
                <button type="button" disabled={currentQuestionIndex === 0} onClick={() => handleNavigation(currentQuestionIndex - 1)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm disabled:opacity-50">← Prev</button>
                <button type="button" disabled={currentQuestionIndex === activeSession.questions.length - 1} onClick={() => handleNavigation(currentQuestionIndex + 1)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm disabled:opacity-50">Next →</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Audio Section */}
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Voice Answer</h3>
                    <div className="flex flex-col items-center py-6 sm:py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        {!isRecording && !currentDraft?.audio ? (
                            <button type="button" onClick={startRecording} disabled={isThisQuestionSubmitted || isThisQuestionSubmitting} className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl disabled:bg-slate-200">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                            </button>
                        ) : isRecording ? (
                            <button type="button" onClick={stopRecording} className="w-14 h-14 bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse"><div className="w-6 h-6 bg-white rounded-sm"></div></button>
                        ) : (
                            <div className="text-center">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <p className="text-emerald-700 font-bold text-[10px] uppercase">Answer Captured</p>
                                <button type="button" onClick={handleRedo} className="text-[9px] text-rose-500 font-bold underline mt-1 hover:text-rose-700">RE-RECORD</button>
                            </div>
                        )}
                        <p className="mt-4 text-[9px] font-bold text-slate-400">{isRecording ? `Recording ${recordingTime}s` : "Speak clearly"}</p>
                    </div>
                </div>

                {/* Monaco Editor Section with Multi-Lang Support */}
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Implementation</h3>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="text-[10px] font-bold border-none bg-slate-100 rounded-lg px-2 py-1 outline-none"
                        >
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden flex-grow min-h-[250px] sm:min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            language={selectedLanguage}
                            value={currentDraft.code}
                            onChange={updateDraftCode}
                            theme="vs-dark"
                            options={{ readOnly: isThisQuestionSubmitted || isThisQuestionSubmitting, minimap: { enabled: false }, fontSize: 12 }}
                        />
                    </div>
                </div>
            </div>

            {/* Global Submit Button */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isThisQuestionSubmitted || isRecording || isThisQuestionSubmitting || (!currentDraft?.audio && !currentDraft?.code?.trim())}
                className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-lg tracking-widest shadow-2xl disabled:bg-slate-100 transition-all active:scale-95 uppercase"
            >
                {isThisQuestionSubmitting ? "Submitting to AI..." : isThisQuestionEvaluated ? "Feedback Ready" : "Commit Answer"}
            </button>

            {/* Results Card */}
            {isThisQuestionEvaluated && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl sm:rounded-[2.5rem] space-y-4 animate-in slide-in-from-bottom-2 shadow-lg">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-emerald-900 text-xs uppercase tracking-widest">AI Assessment</h3>
                        <div className="flex gap-2">
                            <div className="bg-white px-3 py-1 rounded-lg border text-[10px] font-black text-emerald-600">Accuracy: {currentQuestion.technicalScore}%</div>
                            <div className="bg-white px-3 py-1 rounded-lg border text-[10px] font-black text-blue-600">Confidence: {currentQuestion.confidenceScore}%</div>
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed font-medium">"{currentQuestion.aiFeedback}"</p>
                </div>
            )}
        </div>
    );
}

export default InterviewRunner;