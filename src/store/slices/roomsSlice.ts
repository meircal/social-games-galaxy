
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, Player, Team } from '../../types/game';

interface RoomsState {
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
    },
    addRoom: (state, action: PayloadAction<Room>) => {
      // Check if room already exists to avoid duplicates
      const existingRoomIndex = state.rooms.findIndex(room => room.id === action.payload.id);
      if (existingRoomIndex >= 0) {
        // Update existing room
        state.rooms[existingRoomIndex] = action.payload;
      } else {
        // Add new room
        state.rooms.push(action.payload);
      }
    },
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      
      // Also ensure the room is in the rooms array
      const roomExists = state.rooms.some(room => room.id === action.payload.id);
      if (!roomExists) {
        state.rooms.push(action.payload);
      }
    },
    leaveRoom: (state) => {
      state.currentRoom = null;
    },
    updateRoomStatus: (state, action: PayloadAction<{ roomId: string; status: Room['status'] }>) => {
      const { roomId, status } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.status = status;
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.status = status;
      }
    },
    addPlayerToRoom: (state, action: PayloadAction<{ roomId: string; player: Player }>) => {
      const { roomId, player } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.players.push(player);
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.players.push(player);
      }
    },
    removePlayerFromRoom: (state, action: PayloadAction<{ roomId: string; playerId: string }>) => {
      const { roomId, playerId } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== playerId);
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.players = state.currentRoom.players.filter(p => p.id !== playerId);
      }
    },
    addTeamToRoom: (state, action: PayloadAction<{ roomId: string; team: Team }>) => {
      const { roomId, team } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.teams.push(team);
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.teams.push(team);
      }
    },
    updateTeamScore: (state, action: PayloadAction<{ roomId: string; teamId: string; score: number }>) => {
      const { roomId, teamId, score } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        const team = room.teams.find(t => t.id === teamId);
        if (team) {
          team.score = score;
        }
      }
      if (state.currentRoom?.id === roomId) {
        const team = state.currentRoom.teams.find(t => t.id === teamId);
        if (team) {
          team.score = score;
        }
      }
    },
    updateRoomSettings: (state, action: PayloadAction<{ roomId: string; settings: any }>) => {
      const { roomId, settings } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.settings = { ...room.settings, ...settings };
      }
      if (state.currentRoom?.id === roomId) {
        state.currentRoom.settings = { ...state.currentRoom.settings, ...settings };
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setRooms,
  addRoom,
  setCurrentRoom,
  leaveRoom,
  updateRoomStatus,
  addPlayerToRoom,
  removePlayerFromRoom,
  addTeamToRoom,
  updateTeamScore,
  updateRoomSettings,
} = roomsSlice.actions;

export default roomsSlice.reducer;
