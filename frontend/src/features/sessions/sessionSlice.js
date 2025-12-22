// frontend/src/features/sessions/sessionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get API URL and user token
const API_URL = `${import.meta.env.VITE_API_URL}/sessions/`;

// Axios instance to include JWT in all requests
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach the token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 1. Clear local storage
      localStorage.removeItem('user');
      // 2. Force redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const initialState = {
  sessions: [], // List of all sessions for the dashboard table
  activeSession: null, // The session currently being viewed/taken
  isLoading: false,
  isError: false,
  message: '',
};

// --- Async Thunks ---

// 1. Get All Sessions for Dashboard
export const getSessions = createAsyncThunk(
  'sessions/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Create New Session (Triggers AI Generation)
export const createSession = createAsyncThunk(
  'sessions/create',
  async (sessionData, thunkAPI) => {
    try {
      // The backend returns a 202 accepted response immediately
      const response = await api.post('/', sessionData);
      return response.data; // Returns the sessionId and status: 'processing'
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Get Single Session by ID
export const getSessionById = createAsyncThunk(
  'sessions/getOne',
  async (sessionId, thunkAPI) => {
    try {
      const response = await api.get(`/${sessionId}`);
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const deleteSession = createAsyncThunk(
  'sessions/delete',
  async (id, thunkAPI) => {
    try {
      // Use 'api' instead of 'axios'
      await api.delete(`/${id}`);
      return id; 
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'sessions/submitAnswer',
  async ({ sessionId, formData }, thunkAPI) => {
    try {
      const response = await api.post(`/${sessionId}/submit-answer`, formData);
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);
// 6. End Session
export const endSession = createAsyncThunk(
  'sessions/endSession',
  async (sessionId, thunkAPI) => {
    try {
      const response = await api.post(`/${sessionId}/end`);
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);
// --- Session Slice ---
export const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    reset: (state) => initialState,

    socketUpdateSession: (state, action) => {
      const { sessionId, status, message, session } = action.payload;

      // 1. Always update the global message so it shows in the UI status bar
      state.message = message;

      // 2. Handle partial updates (status changes only)
      if (!session && state.activeSession && state.activeSession._id === sessionId) {
        // Find if the message contains a question index (e.g., "Q1 evaluated")
        const qMatch = message.match(/Q(\d+)/);
        if (qMatch) {
          const qIdx = parseInt(qMatch[1]) - 1;
          // Update the submitted status if we are currently transcribing/evaluating
          if (status.includes('AI_')) {
            state.activeSession.questions[qIdx].isSubmitted = true;
          }
        }
      }

      // 3. Handle full session object updates
      if (session) {
        // Update the active session detail if it matches the current session ID
        if (state.activeSession && state.activeSession._id === sessionId) {
          state.activeSession = session;
        }

        // Find and replace the session in the main history list
        const index = state.sessions.findIndex(s => s._id === sessionId);
        if (index !== -1) {
          state.sessions[index] = session;
        } else if (status === 'QUESTIONS_READY' || status === 'SESSION_COMPLETED') {
          state.sessions.unshift(session);
        }
      }
    },
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Sessions
      .addCase(getSessions.pending, (state) => { state.isLoading = true; })
      .addCase(getSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(getSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.sessions = [];
      })
      // Create Session
      .addCase(createSession.pending, (state) => { state.isLoading = true; state.activeSession = null; })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        // The full session data comes later via Socket.io
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Session By ID
      .addCase(getSessionById.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Filter out the deleted session from the array
        state.sessions = state.sessions.filter(
          (session) => session._id !== action.payload
        );
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, socketUpdateSession, setActiveSession } = sessionSlice.actions;
export default sessionSlice.reducer;