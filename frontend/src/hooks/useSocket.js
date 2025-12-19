// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketUpdateSession } from '../features/sessions/sessionSlice';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// The URL for the Node.js backend (Socket.io endpoint)
const BACKEND_URL = import.meta.env.VITE_API_URL.replace('/api', ''); 

const useSocket = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && user._id) {
      // 1. Establish the connection
      // CRITICAL: Send the userId as a query parameter for the backend to join the user to a private room
      const socket = io(BACKEND_URL, {
        query: { userId: user._id },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      // 2. Set up event listeners
      socket.on('connect', () => {
        console.log('Socket.io connected:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket.io disconnected.');
      });

      // 3. Listener for real-time session updates (Latency Management)
      socket.on('sessionUpdate', (payload) => {
        console.log('Real-time Session Update:', payload.status);
        
        // Dispatch the payload to the session slice
        dispatch(socketUpdateSession(payload));

        // Auto-navigate to the interview page once questions are ready
        if (payload.status === 'QUESTIONS_READY') {
            navigate(`/interview/${payload.sessionId}`);
        }
      });

      // 4. Cleanup function
      return () => {
        socket.disconnect();
      };
    }
  }, [user, dispatch, navigate]); // Re-connect only when user changes

  return socketRef.current;
};

export default useSocket;