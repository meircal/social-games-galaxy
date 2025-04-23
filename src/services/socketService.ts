
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

// Create a shared mockRooms array that persists between page refreshes
// This simulates a server-side database
let sharedMockRooms: Room[] = [];

// Try to load existing rooms from localStorage
try {
  const savedRooms = localStorage.getItem('mockRooms');
  if (savedRooms) {
    sharedMockRooms = JSON.parse(savedRooms);
  }
} catch (e) {
  console.error('Error loading mock rooms from localStorage', e);
}

// Generate a unique client ID for this browser session
const clientId = Math.random().toString(36).substr(2, 9);

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  // Use the shared rooms array
  private mockRooms = sharedMockRooms;
  // Track all connected services
  private static connectedServices: SocketService[] = [];
  // Broadcast channel for cross-tab/cross-device communication
  private broadcastChannel: BroadcastChannel | null = null;

  connect(userId: string) {
    if (this.isConnected) return;
    
    // Add this instance to the list of connected services
    SocketService.connectedServices.push(this);
    
    // Create a broadcast channel for real-time cross-tab communication
    try {
      this.broadcastChannel = new BroadcastChannel('socket_events');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch (e) {
      console.error('BroadcastChannel not supported', e);
    }
    
    // Mock socket with event emitters
    this.socket = io(SOCKET_URL, {
      query: { userId },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected for user', userId);
      this.isConnected = true;
      
      // Request all rooms when connecting
      this.getRooms();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      
      // Remove this instance from connected services
      const index = SocketService.connectedServices.indexOf(this);
      if (index !== -1) {
        SocketService.connectedServices.splice(index, 1);
      }
      
      // Close the broadcast channel
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      // Remove this instance from connected services
      const index = SocketService.connectedServices.indexOf(this);
      if (index !== -1) {
        SocketService.connectedServices.splice(index, 1);
      }
      
      // Close the broadcast channel
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
    }
  }

  // Handle broadcast messages from other tabs/windows
  private handleBroadcastMessage(data: { event: string; payload: any; sourceId: string }) {
    // Ignore messages sent by this client
    if (data.sourceId === clientId) return;
    
    console.log('Received broadcast message:', data);
    
    // Process the event as if it came from the socket
    if (this.socket) {
      this.socket.emit(data.event, data.payload);
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
      console.log('Room created event received', room);
      store.dispatch(addRoom(room));
    });
    
    this.socket.on('room:updated', (room: Room) => {
      // This will handle any room updates
      this.updateRoom(room);
    });
    
    this.socket.on('rooms:list', (rooms: Room[]) => {
      console.log('Rooms list received', rooms);
      store.dispatch(setRooms(rooms));
    });
  }
  
  // Improved mock broadcast to all connected services
  private mockBroadcast(event: string, data: any) {
    console.log('Broadcasting event', event, data);
    
    // Update the shared mock rooms array
    if (event === 'room:created' || event === 'room:updated') {
      this.saveRoomsToStorage();
    }
    
    // Broadcast via BroadcastChannel for cross-tab/cross-device communication
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          event,
          payload: data,
          sourceId: clientId
        });
      } catch (e) {
        console.error('Error broadcasting message', e);
      }
    }
    
    // Broadcast to all connected services in this tab
    SocketService.connectedServices.forEach(service => {
      if (service.socket) {
        setTimeout(() => {
          service.socket?.emit(event, data);
        }, 100);
      }
    });
  }
  
  // Save rooms to localStorage to persist between page refreshes
  private saveRoomsToStorage() {
    try {
      localStorage.setItem('mockRooms', JSON.stringify(this.mockRooms));
    } catch (e) {
      console.error('Error saving mock rooms to localStorage', e);
    }
  }
  
  private updateRoom(room: Room) {
    // No need to convert Date to string, our type now accepts both
    const processedRoom = {
      ...room,
      createdAt: room.createdAt // Keep as is, our type now accepts both string and Date
    };
    
    const index = this.mockRooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      this.mockRooms[index] = processedRoom;
    } else {
      this.mockRooms.push(processedRoom);
    }
    
    // Save to localStorage
    this.saveRoomsToStorage();
    
    // Update Redux store
    store.dispatch(setRooms([...this.mockRooms]));
  }
  
  // Room operations
  getRooms() {
    if (!this.socket) return;
    
    console.log('Getting rooms list', this.mockRooms);
    this.mockBroadcast('rooms:list', this.mockRooms);
  }

  createRoom(room: Omit<Room, 'id' | 'createdAt'>) {
    if (!this.socket) return;
    
    const roomId = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString(); // Store as ISO string for serialization
    
    const newRoom: Room = {
      ...room,
      id: roomId,
      createdAt // Now our type accepts string
    };
    
    console.log('Creating new room', newRoom);
    
    // Add to our mock database
    this.mockRooms.push(newRoom);
    
    // Save to localStorage
    this.saveRoomsToStorage();
    
    // Broadcast to all clients (including ourselves)
    this.mockBroadcast('room:created', newRoom);
    
    // Return the room ID so the creator can join it
    return roomId;
  }

  joinRoom(roomId: string, player: Player, password?: string) {
    if (!this.socket) return;
    
    // Find the room in our mock database
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) {
      console.log('Room not found', roomId);
      return false;
    }
    
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

  // Helper method to debug room state
  debugRooms() {
    console.log('Current mock rooms:', this.mockRooms);
    return [...this.mockRooms];
  }
  
  // Force refresh of rooms from localStorage
  forceRefreshRooms() {
    try {
      const savedRooms = localStorage.getItem('mockRooms');
      if (savedRooms) {
        this.mockRooms = JSON.parse(savedRooms);
        this.mockBroadcast('rooms:list', this.mockRooms);
      }
    } catch (e) {
      console.error('Error loading mock rooms from localStorage', e);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
