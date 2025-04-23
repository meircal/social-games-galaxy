
import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  addPlayerToRoom, 
  removePlayerFromRoom, 
  updateRoomStatus, 
  updateTeamScore,
  addRoom,
  setRooms
} from '../store/slices/roomsSlice';
import { Player, Room, Team } from '../types/game';

// We'll be mocking the socket for now since we don't have an actual backend
// In a real implementation, this would connect to your backend server
const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private mockRooms: Room[] = [];

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
      
      // Request all rooms when connecting
      this.getRooms();
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
    
    // New room events for real-time synchronization
    this.socket.on('room:created', (room: Room) => {
      store.dispatch(addRoom(room));
    });
    
    this.socket.on('room:updated', (room: Room) => {
      // This will handle any room updates
      this.updateRoom(room);
    });
    
    this.socket.on('rooms:list', (rooms: Room[]) => {
      store.dispatch(setRooms(rooms));
    });
  }
  
  // Mock methods to simulate real-time room management
  private mockBroadcast(event: string, data: any) {
    if (!this.socket) return;
    
    // In a real app, the server would broadcast to all clients
    // Here we're simulating that broadcast by emitting back to ourselves
    setTimeout(() => {
      if (this.socket) {
        this.socket.emit(event, data);
      }
    }, 100);
  }
  
  private updateRoom(room: Room) {
    const index = this.mockRooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      this.mockRooms[index] = room;
    } else {
      this.mockRooms.push(room);
    }
    
    // Update Redux store
    store.dispatch(setRooms([...this.mockRooms]));
  }
  
  // Room operations
  getRooms() {
    if (!this.socket) return;
    
    // In a real app, this would request rooms from the server
    // Here we're just sending our mock rooms back
    this.mockBroadcast('rooms:list', this.mockRooms);
  }

  createRoom(room: Omit<Room, 'id' | 'createdAt'>) {
    if (!this.socket) return;
    
    const newRoom: Room = {
      ...room,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
    
    // Add to our mock database
    this.mockRooms.push(newRoom);
    
    // Broadcast to all clients (including ourselves)
    this.mockBroadcast('room:created', newRoom);
    
    // Return the room ID so the creator can join it
    return newRoom.id;
  }

  joinRoom(roomId: string, player: Player, password?: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Check password if it's a private room
    if (room.type === 'private' && room.password !== password) {
      console.log('Wrong password');
      return false;
    }
    
    // Add player to room if not already in
    if (!room.players.some(p => p.id === player.id)) {
      room.players.push(player);
      
      // Update the room in our mock database
      this.updateRoom(room);
      
      // Broadcast player joined event
      this.mockBroadcast('player:joined', { roomId, player });
      
      // Broadcast room update
      this.mockBroadcast('room:updated', room);
    }
    
    return true;
  }

  leaveRoom(roomId: string, playerId: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    
    // Update the room in our mock database
    this.updateRoom(room);
    
    // Broadcast player left event
    this.mockBroadcast('player:left', { roomId, playerId });
    
    // Broadcast room update
    this.mockBroadcast('room:updated', room);
  }

  startGame(roomId: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Update room status
    room.status = 'playing';
    
    // Update the room in our mock database
    this.updateRoom(room);
    
    // Broadcast room status change
    this.mockBroadcast('room:status', { roomId, status: 'playing' });
    
    // Broadcast room update
    this.mockBroadcast('room:updated', room);
    
    // Broadcast game start event
    this.mockBroadcast('game:start', { roomId });
  }

  // Team operations
  createTeam(roomId: string, team: Omit<Team, 'id'>) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Create a new team
    const newTeam: Team = {
      ...team,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    // Add team to room
    room.teams.push(newTeam);
    
    // Update the room in our mock database
    this.updateRoom(room);
    
    // Broadcast room update
    this.mockBroadcast('room:updated', room);
    
    return newTeam.id;
  }

  joinTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Find the team
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Find the player
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Add player to team if not already in
    if (!team.players.some(p => p.id === playerId)) {
      team.players.push(player);
      
      // Update the room in our mock database
      this.updateRoom(room);
      
      // Broadcast room update
      this.mockBroadcast('room:updated', room);
    }
  }

  leaveTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Find the team
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    // Remove player from team
    team.players = team.players.filter(p => p.id !== playerId);
    
    // Update the room in our mock database
    this.updateRoom(room);
    
    // Broadcast room update
    this.mockBroadcast('room:updated', room);
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
