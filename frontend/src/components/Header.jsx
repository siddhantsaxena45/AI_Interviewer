// frontend/src/components/Header.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  // Helper to identify active link
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo Section */}
<Link to="/" className="flex items-center space-x-2 group">
  <div className="bg-teal-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  </div>
  
  {/* FIX: branding text hidden on mobile/tablet, visible from medium (768px) screens up */}
  <span className="text-xl font-black tracking-tighter uppercase text-white group-hover:text-teal-400 transition-colors hidden md:block">
    AI <span className="text-teal-500">Interviewer</span>
  </span>
</Link>
        

        <nav>
          {user ? (
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* Dashboard Link - Now visible on mobile */}
              <Link 
                to="/" 
                className={`text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-all duration-200 border-b-2 ${
                  isActive('/') ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              
              {/* User Name Badge - Now visible on mobile */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 bg-slate-800/50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-700">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-tight">
                  {user.name.split(' ')[0]}
                </span>
              </div>

              <button 
                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest py-2 sm:py-2.5 px-3 sm:px-5 rounded-xl transition duration-300 shadow-lg shadow-rose-900/20 active:scale-95"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link 
                to="/login" 
                className={`text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors px-2 sm:px-3 py-2 border-b-2 ${
                  isActive('/login') 
                    ? 'text-teal-400 border-teal-500' 
                    : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                Login
              </Link>

              <Link 
                to="/register" 
                 className={`text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors px-2 sm:px-3 py-2 border-b-2 ${
                  isActive('/register') 
                    ? 'text-teal-400 border-teal-500' 
                    : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;