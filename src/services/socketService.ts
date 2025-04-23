
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

// Generate a unique client ID for this browser instance
const CLIENT_ID = Math.random().toString(36).substr(2, 9);
const STORAGE_KEY = 'social_games_rooms';
const SOCKET_URL = 'http://localhost:3000';

// Attempt to load rooms from localStorage at module initialization
let initialRooms: Room[] = [];
try {
  const savedRooms = localStorage.getItem(STORAGE_KEY);
  if (savedRooms) {
    initialRooms = JSON.parse(savedRooms);
    console.log('Loaded rooms from localStorage:', initialRooms);
  }
} catch (e) {
  console.error('Error loading rooms from localStorage', e);
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private mockRooms: Room[] = initialRooms;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  
  // Connection management
  connect(userId: string) {
    if (this.isConnected) return;
    
    console.log('Connecting socket service for user:', userId);
    
    // Set up broadcast channel for cross-tab communication
    try {
      this.broadcastChannel = new BroadcastChannel('social_games_sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch (e) {
      console.error('BroadcastChannel not supported, falling back to localStorage only', e);
    }
    
    // Establish socket connection
    this.socket = io(SOCKET_URL, {
      query: { userId },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected for user', userId);
      this.isConnected = true;
      this.getRooms();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.cleanup();
    });

    this.setupEventListeners();
    
    // Start regular polling for room updates
    this.startPolling();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.cleanup();
    }
  }
  
  private cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Broadcast handling for cross-tab/window communication
  private handleBroadcastMessage(data: { action: string; payload: any; sourceId: string }) {
    // Ignore messages from self
    if (data.sourceId === CLIENT_ID) return;
    
    console.log('Received broadcast message:', data);
    
    switch (data.action) {
      case 'ROOMS_UPDATED':
        this.syncRoomsFromStorage();
        break;
      case 'ROOM_CREATED':
        if (data.payload && typeof data.payload === 'object') {
          const room = data.payload as Room;
          this.addOrUpdateRoom(room, false);
        }
        break;
      case 'FORCE_REFRESH':
        this.syncRoomsFromStorage();
        break;
    }
  }

  private broadcast(action: string, payload?: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          action,
          payload,
          sourceId: CLIENT_ID
        });
      } catch (e) {
        console.error('Error broadcasting message', e);
      }
    }
  }
  
  // Room data persistence
  private saveRoomsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.mockRooms));
      // Signal that rooms have been updated
      this.broadcast('ROOMS_UPDATED');
    } catch (e) {
      console.error('Error saving rooms to localStorage', e);
    }
  }
  
  private syncRoomsFromStorage() {
    try {
      const savedRooms = localStorage.getItem(STORAGE_KEY);
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        console.log('Syncing rooms from localStorage:', parsedRooms);
        this.mockRooms = parsedRooms;
        store.dispatch(setRooms([...this.mockRooms]));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error syncing rooms from localStorage', e);
      return false;
    }
  }

  private startPolling() {
    // Clear any existing polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Poll every 3 seconds for room updates
    this.pollingInterval = setInterval(() => {
      this.syncRoomsFromStorage();
    }, 3000);
  }
  
  // Event listeners for socket events
  setupEventListeners() {
    if (!this.socket) return;

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
    
    this.socket.on('room:created', (room: Room) => {
      this.addOrUpdateRoom(room);
    });
    
    this.socket.on('rooms:list', (rooms: Room[]) => {
      console.log('Received rooms list from socket:', rooms);
      if (Array.isArray(rooms) && rooms.length > 0) {
        // Merge with local rooms to avoid losing any
        this.mergeRooms(rooms);
      }
    });
  }
  
  // Room operations
  private addOrUpdateRoom(room: Room, shouldBroadcast = true) {
    const index = this.mockRooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      this.mockRooms[index] = room;
    } else {
      this.mockRooms.push(room);
    }
    
    this.saveRoomsToStorage();
    store.dispatch(addRoom(room));
    
    if (shouldBroadcast) {
      this.broadcast('ROOM_CREATED', room);
    }
  }
  
  private mergeRooms(rooms: Room[]) {
    // Create a map for quick lookup
    const existingRoomsMap = new Map(this.mockRooms.map(room => [room.id, room]));
    
    // Update existing rooms and add new ones
    for (const room of rooms) {
      if (existingRoomsMap.has(room.id)) {
        existingRoomsMap.set(room.id, room);
      } else {
        existingRoomsMap.set(room.id, room);
      }
    }
    
    // Convert map back to array
    this.mockRooms = Array.from(existingRoomsMap.values());
    
    // Persist to storage and update store
    this.saveRoomsToStorage();
    store.dispatch(setRooms([...this.mockRooms]));
  }
  
  // Public methods
  getRooms() {
    console.log('Getting rooms list', this.mockRooms);
    this.syncRoomsFromStorage();
    store.dispatch(setRooms([...this.mockRooms]));
    return [...this.mockRooms];
  }

  createRoom(room: Omit<Room, 'id' | 'createdAt'>) {
    const roomId = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    
    const newRoom: Room = {
      ...room,
      id: roomId,
      createdAt
    };
    
    console.log('Creating new room', newRoom);
    this.addOrUpdateRoom(newRoom);
    
    return roomId;
  }

  joinRoom(roomId: string, player: Player, password?: string) {
    // First sync from storage to ensure we have the latest data
    this.syncRoomsFromStorage();
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) {
      console.log('Room not found', roomId);
      return false;
    }
    
    if (room.type === 'private' && room.password !== password) {
      console.log('Wrong password');
      return false;
    }
    
    if (!room.players.some(p => p.id === player.id)) {
      room.players.push(player);
      this.addOrUpdateRoom(room);
    }
    
    return true;
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.players = room.players.filter(p => p.id !== playerId);
    this.addOrUpdateRoom(room);
  }

  startGame(roomId: string) {
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.status = 'playing';
    this.addOrUpdateRoom(room);
  }

  createTeam(roomId: string, team: Omit<Team, 'id'>) {
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const newTeam: Team = {
      ...team,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    room.teams.push(newTeam);
    this.addOrUpdateRoom(room);
    
    return newTeam.id;
  }

  joinTeam(roomId: string, teamId: string, playerId: string) {
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    if (!team.players.some(p => p.id === playerId)) {
      team.players.push(player);
      this.addOrUpdateRoom(room);
    }
  }

  leaveTeam(roomId: string, teamId: string, playerId: string) {
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    team.players = team.players.filter(p => p.id !== playerId);
    this.addOrUpdateRoom(room);
  }

  forceRefreshRooms() {
    this.broadcast('FORCE_REFRESH');
    return this.syncRoomsFromStorage();
  }

  syncRoomsNow() {
    return this.syncRoomsFromStorage();
  }

  debugRooms() {
    return [...this.mockRooms];
  }
}

const socketService = new SocketService();
export default socketService;
