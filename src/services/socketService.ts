
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  addPlayerToRoom, 
  removePlayerFromRoom, 
  updateRoomStatus, 
  updateTeamScore 
} from '../store/slices/roomsSlice';
import { Player, Room, Team } from '../types/game';

// We'll be mocking the socket for now since we don't have an actual backend
// In a real implementation, this would connect to your backend server
const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId: string) {
    if (this.isConnected) return;
    
    // Mock socket with event emitters
    // In a real app, this would connect to your server
    this.socket = io(SOCKET_URL, {
      query: { userId },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Room events
    this.socket.on('player:joined', ({ roomId, player }: { roomId: string, player: Player }) => {
      store.dispatch(addPlayerToRoom({ roomId, player }));
    });

    this.socket.on('player:left', ({ roomId, playerId }: { roomId: string, playerId: string }) => {
      store.dispatch(removePlayerFromRoom({ roomId, playerId }));
    });

    this.socket.on('room:status', ({ roomId, status }: { roomId: string, status: Room['status'] }) => {
      store.dispatch(updateRoomStatus({ roomId, status }));
    });

    this.socket.on('team:score', ({ roomId, teamId, score }: { roomId: string, teamId: string, score: number }) => {
      store.dispatch(updateTeamScore({ roomId, teamId, score }));
    });

    // Game specific events will be added based on the current game
  }

  // Room operations
  createRoom(room: Omit<Room, 'id' | 'createdAt'>) {
    if (!this.socket) return;
    this.socket.emit('room:create', room);
  }

  joinRoom(roomId: string, player: Player, password?: string) {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId, player, password });
  }

  leaveRoom(roomId: string, playerId: string) {
    if (!this.socket) return;
    this.socket.emit('room:leave', { roomId, playerId });
  }

  startGame(roomId: string) {
    if (!this.socket) return;
    this.socket.emit('game:start', { roomId });
  }

  // Team operations
  createTeam(roomId: string, team: Omit<Team, 'id'>) {
    if (!this.socket) return;
    this.socket.emit('team:create', { roomId, team });
  }

  joinTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    this.socket.emit('team:join', { roomId, teamId, playerId });
  }

  leaveTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    this.socket.emit('team:leave', { roomId, teamId, playerId });
  }

  // Game specific operations for each game type
  // These will be implemented based on the specific game mechanics
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
