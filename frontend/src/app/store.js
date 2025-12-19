// frontend/src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; 
import sessionReducer from '../features/sessions/sessionSlice'; // <-- NEW IMPORT

const store = configureStore({
  reducer: {
    auth: authReducer, 
    sessions: sessionReducer, // <-- NEW REDUCER
  },
  devTools: true,
});

export default store;