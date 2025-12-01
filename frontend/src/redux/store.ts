import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import roomReducer from './slices/roomSlice';
import scheduleReducer from './slices/scheduleSlice';
import roomSchedulingReducer from './slices/roomSchedulingSlice';
import profileReducer from './slices/profileSlice';
import scheduleExceptionReducer from './slices/scheduleExceptionSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    room: roomReducer,
    schedule: scheduleReducer,
    roomScheduling: roomSchedulingReducer,
    profile: profileReducer,
    scheduleException: scheduleExceptionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };
