
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player } from '../../types/game';

interface UserState {
  currentUser: Player | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUser: (state, action: PayloadAction<Player>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
    updateUserName: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        state.currentUser.name = action.payload;
      }
    },
    updateUserAvatar: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        state.currentUser.avatar = action.payload;
      }
    },
  },
});

export const { setLoading, setError, setUser, clearUser, updateUserName, updateUserAvatar } = userSlice.actions;
export default userSlice.reducer;
