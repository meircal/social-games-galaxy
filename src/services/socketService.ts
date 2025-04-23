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

const SOCKET_URL = 'http://localhost:3000';

let sharedMockRooms: Room[] = [];

const clientId = Math.random().toString(36).substr(2, 9);

try {
  const savedRooms = localStorage.getItem('mockRooms');
  if (savedRooms) {
    sharedMockRooms = JSON.parse(savedRooms);
    console.log('Loaded rooms from localStorage:', sharedMockRooms);
  }
} catch (e) {
  console.error('Error loading mock rooms from localStorage', e);
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private mockRooms = sharedMockRooms;
  private static connectedServices: SocketService[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  connect(userId: string) {
    if (this.isConnected) return;
    
    SocketService.connectedServices.push(this);
    
    try {
      this.broadcastChannel = new BroadcastChannel('socket_events');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch (e) {
      console.error('BroadcastChannel not supported', e);
    }
    
    this.storageListener = (event) => {
      if (event.key === 'mockRooms' && event.newValue) {
        try {
          const updatedRooms = JSON.parse(event.newValue);
          console.log('Detected localStorage change:', updatedRooms);
          this.mockRooms = updatedRooms;
          store.dispatch(setRooms(updatedRooms));
        } catch (e) {
          console.error('Error parsing rooms from localStorage', e);
        }
      }
    };
    
    window.addEventListener('storage', this.storageListener);
    
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
      
      const index = SocketService.connectedServices.indexOf(this);
      if (index !== -1) {
        SocketService.connectedServices.splice(index, 1);
      }
      
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
      
      if (this.storageListener) {
        window.removeEventListener('storage', this.storageListener);
        this.storageListener = null;
      }
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      const index = SocketService.connectedServices.indexOf(this);
      if (index !== -1) {
        SocketService.connectedServices.splice(index, 1);
      }
      
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
      }
      
      if (this.storageListener) {
        window.removeEventListener('storage', this.storageListener);
        this.storageListener = null;
      }
    }
  }

  private handleBroadcastMessage(data: { event: string; payload: any; sourceId: string }) {
    if (data.sourceId === clientId) return;
    
    console.log('Received broadcast message:', data);
    
    if (this.socket) {
      this.socket.emit(data.event, data.payload);
    }
  }

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
      console.log('Room created event received', room);
      store.dispatch(addRoom(room));
    });
    
    this.socket.on('room:updated', (room: Room) => {
      this.updateRoom(room);
    });
    
    this.socket.on('rooms:list', (rooms: Room[]) => {
      console.log('Rooms list received', rooms);
      store.dispatch(setRooms(rooms));
    });
  }
  
  private mockBroadcast(event: string, data: any) {
    console.log('Broadcasting event', event, data);
    
    if (event === 'room:created' || event === 'room:updated') {
      this.saveRoomsToStorage();
    }
    
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
    
    SocketService.connectedServices.forEach(service => {
      if (service.socket) {
        setTimeout(() => {
          service.socket?.emit(event, data);
        }, 100);
      }
    });
  }
  
  private saveRoomsToStorage() {
    try {
      const roomsJson = JSON.stringify(this.mockRooms);
      localStorage.setItem('mockRooms', roomsJson);
      console.log('Saved rooms to localStorage:', this.mockRooms);
      
      const storageEvent = new StorageEvent('storage', {
        key: 'mockRooms',
        newValue: roomsJson,
        oldValue: null,
        storageArea: localStorage
      });
      
      window.dispatchEvent(storageEvent);
    } catch (e) {
      console.error('Error saving mock rooms to localStorage', e);
    }
  }
  
  private updateRoom(room: Room) {
    const processedRoom = {
      ...room,
      createdAt: room.createdAt
    };
    
    const index = this.mockRooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      this.mockRooms[index] = processedRoom;
    } else {
      this.mockRooms.push(processedRoom);
    }
    
    this.saveRoomsToStorage();
    
    store.dispatch(setRooms([...this.mockRooms]));
  }
  
  getRooms() {
    if (!this.socket) return;
    
    console.log('Getting rooms list', this.mockRooms);
    this.mockBroadcast('rooms:list', this.mockRooms);
  }

  createRoom(room: Omit<Room, 'id' | 'createdAt'>) {
    if (!this.socket) return;
    
    const roomId = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    
    const newRoom: Room = {
      ...room,
      id: roomId,
      createdAt
    };
    
    console.log('Creating new room', newRoom);
    
    this.mockRooms.push(newRoom);
    
    this.saveRoomsToStorage();
    
    this.mockBroadcast('room:created', newRoom);
    
    return roomId;
  }

  joinRoom(roomId: string, player: Player, password?: string) {
    if (!this.socket) return;
    
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
      
      this.updateRoom(room);
      
      this.mockBroadcast('player:joined', { roomId, player });
      
      this.mockBroadcast('room:updated', room);
    }
    
    return true;
  }

  leaveRoom(roomId: string, playerId: string) {
    if (!this.socket) return;
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.players = room.players.filter(p => p.id !== playerId);
    
    this.updateRoom(room);
    
    this.mockBroadcast('player:left', { roomId, playerId });
    
    this.mockBroadcast('room:updated', room);
  }

  startGame(roomId: string) {
    if (!this.socket) return;
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.status = 'playing';
    
    this.updateRoom(room);
    
    this.mockBroadcast('room:status', { roomId, status: 'playing' });
    
    this.mockBroadcast('room:updated', room);
    
    this.mockBroadcast('game:start', { roomId });
  }

  createTeam(roomId: string, team: Omit<Team, 'id'>) {
    if (!this.socket) return;
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const newTeam: Team = {
      ...team,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    room.teams.push(newTeam);
    
    this.updateRoom(room);
    
    this.mockBroadcast('room:updated', room);
    
    return newTeam.id;
  }

  joinTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    if (!team.players.some(p => p.id === playerId)) {
      team.players.push(player);
      
      this.updateRoom(room);
      
      this.mockBroadcast('room:updated', room);
    }
  }

  leaveTeam(roomId: string, teamId: string, playerId: string) {
    if (!this.socket) return;
    
    const room = this.mockRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const team = room.teams.find(t => t.id === teamId);
    if (!team) return;
    
    team.players = team.players.filter(p => p.id !== playerId);
    
    this.updateRoom(room);
    
    this.mockBroadcast('room:updated', room);
  }

  forceRefreshRooms() {
    try {
      const savedRooms = localStorage.getItem('mockRooms');
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        console.log('Force refreshing rooms from localStorage:', parsedRooms);
        this.mockRooms = parsedRooms;
        
        this.mockBroadcast('rooms:list', this.mockRooms);
        
        store.dispatch(setRooms([...this.mockRooms]));
      } else {
        console.log('No rooms found in localStorage during force refresh');
      }
    } catch (e) {
      console.error('Error loading mock rooms from localStorage', e);
    }
  }

  syncRoomsNow() {
    try {
      const savedRooms = localStorage.getItem('mockRooms');
      if (savedRooms) {
        this.mockRooms = JSON.parse(savedRooms);
        store.dispatch(setRooms([...this.mockRooms]));
        console.log('Manual sync complete:', this.mockRooms);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error during manual sync', e);
      return false;
    }
  }

  debugRooms() {
    console.log('Current mock rooms:', this.mockRooms);
    return [...this.mockRooms];
  }
}

const socketService = new SocketService();
export default socketService;
