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
    // Ping the backend to wake up both Node.js and Python AI services on Render
    const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/`).catch(err => console.log('Wake-up ping failed:', err));
    }
  }, []);
  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <main className='container mx-auto p-4'>
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
      <ToastContainer position='top-right' autoClose={3000}/>

    </div>
  )
}

export default App
