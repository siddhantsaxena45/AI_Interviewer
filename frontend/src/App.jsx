import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useSocket from './hooks/useSocket';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import InterviewRunner from './pages/InterviewRunner';
import SessionReview from './pages/SessionReview';
import NotFound from './pages/NotFound';

const App = () => {
  useSocket();

  useEffect(() => {
    // Ping the backend to wake up Node.js service on Render
    const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/`).catch(err => console.log('Backend wake-up ping failed:', err));
    }

    // Ping the Python AI service directly to wake it up in parallel
    const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'https://ai-interviewer-nx1f.onrender.com/';
    fetch(AI_SERVICE_URL).catch(err => console.log('AI Service wake-up ping failed:', err));
  }, []);
  return (
    <div className='min-h-screen bg-slate-50 flex flex-col'>
      <Header />
      <main className='flex-grow flex flex-col'>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/' element={<PrivateRoute />}>
            <Route path='/' element={<Dashboard />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/interview/:sessionId' element={<InterviewRunner />} />
            <Route path="/review/:sessionId" element={<SessionReview />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>

      </main>
      <ToastContainer position='top-right' autoClose={3000} />

    </div>
  )
}

export default App
