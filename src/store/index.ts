
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import roomsReducer from './slices/roomsSlice';
import gameReducer from './slices/gameSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    rooms: roomsReducer,
    game: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
