// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard'; 
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute'; 
import useSocket from './hooks/useSocket';
import InterviewRunner from './pages/InterviewRunner'; 
import SessionReview from './pages/SessionReview';
import NotFound from './pages/NotFound';
function App() {
  useSocket();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path='/' element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            {/* Dynamic route that handles both active interview and review based on session status */}
            <Route path="/interview/:sessionId" element={<InterviewRunner />} /> 
            <Route path="/review/:sessionId" element={<SessionReview />} /> 
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;