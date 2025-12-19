import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, reset } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

const ROLES = ['MERN Stack Developer', 'Data Scientist', 'Full Stack Python', 'DevOps Engineer'];

function Profile() {
    const { user, isSuccess, isError, message, isLoading } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        preferredRole: user?.preferredRole || '',
        password: '',
    });

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset()); // Reset immediately after showing toast
        }
        if (isSuccess) {
            toast.success('Profile Updated!');
            dispatch(reset()); // Reset immediately after showing toast
        }
    }, [isSuccess, isError, message, dispatch]);
    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(updateProfile(formData));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12 pb-24"> {/* Added padding bottom for mobile reachability */}
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl p-6 sm:p-12 border border-slate-100">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Edit Profile</h1>
                    <p className="text-slate-500 text-sm mt-1">Update your professional details and preferences.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6">

                    {/* Full Name Input */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl p-3.5 sm:p-4 font-semibold text-slate-700 transition-all focus:bg-white focus:border-teal-500 focus:ring-0 outline-none text-base"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Email - Read Only for Security */}
                    <div className="space-y-1.5 opacity-60">
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Email Address (Fixed)
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full bg-slate-100 border-none rounded-xl sm:rounded-2xl p-3.5 sm:p-4 font-semibold text-slate-500 cursor-not-allowed text-base"
                        />
                    </div>

                    {/* Preferred Role Selector */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Target Role
                        </label>
                        <div className="relative">
                            <select
                                value={formData.preferredRole}
                                onChange={(e) => setFormData({ ...formData, preferredRole: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl p-3.5 sm:p-4 font-semibold text-slate-700 appearance-none focus:bg-white focus:border-teal-500 focus:ring-0 outline-none text-base"
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {/* Custom Arrow for select */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Optional: Password Field could go here */}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full font-bold py-4 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${isLoading
                                    ? 'bg-slate-200 text-slate-400 cursor-wait'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-100'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Profile;