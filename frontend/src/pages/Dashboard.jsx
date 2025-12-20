import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSession, getSessions, reset, deleteSession } from '../features/sessions/sessionSlice';
import { toast } from 'react-toastify';

const ROLES = ['MERN Stack Developer', 'Data Scientist', 'Full Stack Python', 'DevOps Engineer'];
const LEVELS = ['Junior', 'Mid-Level', 'Senior'];
const TYPES = [{ label: 'Oral Only', value: 'oral-only' }, { label: 'Coding Mix', value: 'coding-mix' }];
const COUNTS = [5, 10, 15];

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { sessions, isLoading, message } = useSelector((state) => state.sessions);

    const [formData, setFormData] = useState({
        role: user.preferredRole || ROLES[0],
        level: LEVELS[0],
        interviewType: TYPES[1].value,
        count: COUNTS[1],
    });

    useEffect(() => {
        dispatch(getSessions());
        return () => dispatch(reset());
    }, [dispatch]);

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(createSession(formData));
    };

    const viewSession = (session) => {
        if (session.status === 'completed') {
            navigate(`/review/${session._id}`);
        } else {
            navigate(`/interview/${session._id}`);
        }
    };

    const handleDelete = (e, sessionId) => {
        e.stopPropagation(); // Stop the click from opening the session
        if (window.confirm('Are you sure you want to delete this interview history?')) {
            dispatch(deleteSession(sessionId));
            toast.error('Session deleted');
        }
    };

    const isProcessing = isLoading || (message && message.includes('Generating'));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in duration-700">
            
            {/* --- Hero Header --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Welcome, <span className="text-teal-600">{user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">Ready for your technical prep?</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-teal-100 flex sm:block items-center gap-2">
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Total Sessions</p>
                        <p className="text-xl sm:text-2xl font-black text-teal-700 leading-none">{sessions.length}</p>
                    </div>
                </div>
            </div>

            {/* --- Session Creation --- */}
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 sm:px-8 sm:py-6">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <span className="bg-teal-500 w-1.5 h-5 rounded-full mr-3"></span>
                        New Interview
                    </h2>
                </div>
                <form onSubmit={onSubmit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                        <select name="role" value={formData.role} onChange={onChange}
                            className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500">
                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:contents">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                            <select name="level" value={formData.level} onChange={onChange}
                                className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500">
                                {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Length</label>
                            <select name="count" value={formData.count} onChange={onChange}
                                className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500">
                                {COUNTS.map(count => <option key={count} value={count}>{count} Qs</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select name="interviewType" value={formData.interviewType} onChange={onChange}
                            className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500">
                            {TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                    </div>

                    <button type="submit" disabled={isProcessing}
                        className={`w-full h-[48px] sm:h-[52px] mt-2 sm:mt-0 rounded-xl sm:rounded-2xl font-bold text-white tracking-wide transition-all active:scale-95 ${
                            isProcessing ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100'
                        }`}>
                        {isProcessing ? 'Generating...' : 'Start Session'}
                    </button>
                </form>
            </div>

            {/* --- Interview History List --- */}
            <div className="space-y-6 pb-20 sm:pb-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center px-2">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 text-sm sm:text-lg">📊</span>
                    Interview History
                </h2>

                {sessions.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2rem] py-16 sm:py-20 text-center">
                        <p className="text-slate-400 font-bold text-base sm:text-lg">No sessions yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
    <div key={session._id} 
            onClick={() => viewSession(session)}
            className="group bg-white border border-slate-100 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
    >
        
        {/* LEFT SIDE: Icon & Info */}
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto flex-grow">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm ${
                session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
                {session.role.includes('Python') ? '🐍' : session.role.includes('Data') ? '📉' : '💻'}
            </div>
            <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate group-hover:text-teal-600">{session.role}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">{session.level}</span>
                </div>
            </div>
        </div>

        {/* MIDDLE: Score & Status (On Mobile: Full Width Row) */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
            <div className="text-left md:text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Score</p>
                <p className={`text-xl sm:text-2xl font-black ${
                    session.status === 'completed' 
                    ? (session.overallScore > 75 ? 'text-emerald-500' : 'text-orange-500') 
                    : 'text-slate-300'
                }`}>
                    {session.status === 'completed' ? `${session.overallScore}%` : '--'}
                </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                    session.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {session.status}
                </span>
                <span className="text-teal-600 font-bold text-xs flex items-center">
                    {session.status === 'completed' ? 'Results' : 'Resume'}
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                </span>
            </div>
        </div>

        {/* RIGHT SIDE: Delete Button (Vertical Separator) */}
        <div className="hidden md:block w-px h-10 bg-slate-100 mx-2"></div>
        
        <button 
            onClick={(e) => handleDelete(e, session._id)}
            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="Delete Session"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>

    </div>
))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;