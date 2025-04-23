
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
import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  update,
  get,
  child,
  remove
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUVqnuzQPrSgzAQ-8jVCt8rdI1RCouZ-c",
  authDomain: "social-games-6d482.firebaseapp.com",
  projectId: "social-games-6d482",
  storageBucket: "social-games-6d482.appspot.com",
  messagingSenderId: "639061155934",
  appId: "1:639061155934:web:ae433e28aa5de723335f9b",
  databaseURL: "https://social-games-6d482-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
  
  // Firebase handlers
  private roomsRef = ref(database, 'rooms');
  private unsubscribeFirebase: (() => void) | null = null;
  
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
      this.syncRoomsFromFirebase();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.cleanup();
    });

    this.setupEventListeners();
    this.setupFirebaseListeners();
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
    
    // Unsubscribe from Firebase
    if (this.unsubscribeFirebase) {
      this.unsubscribeFirebase();
      this.unsubscribeFirebase = null;
    }
  }
  
  // Set up Firebase listeners
  private setupFirebaseListeners() {
    console.log("Setting up Firebase listeners");
    
    // Listen for rooms changes
    const roomsListener = onValue(this.roomsRef, (snapshot) => {
      console.log("Firebase rooms updated");
      
      if (snapshot.exists()) {
        const rooms: Room[] = [];
        
        snapshot.forEach((roomSnapshot) => {
          const roomData = roomSnapshot.val();
          if (roomData) {
            // Ensure the room has an id
            const room: Room = {
              ...roomData,
              id: roomData.id || roomSnapshot.key
            };
            rooms.push(room);
          }
        });
        
        console.log("Rooms from Firebase:", rooms);
        
        // Update local state and Redux
        this.mockRooms = rooms;
        this.saveRoomsToStorage();
        store.dispatch(setRooms([...rooms]));
        
        // Broadcast to other tabs that rooms were updated
        this.broadcast('ROOMS_UPDATED');
      }
    }, (error) => {
      console.error("Firebase rooms listener error:", error);
    });
    
    // Store unsubscribe function
    this.unsubscribeFirebase = () => {
      console.log("Unsubscribing from Firebase");
      roomsListener();
    };
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
        this.syncRoomsFromFirebase();
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
    } catch (e) {
      console.error('Error saving rooms to localStorage', e);
    }
  }
  
  // Save room to Firebase
  private saveRoomToFirebase(room: Room) {
    console.log("Saving room to Firebase:", room);
    
    // Define updates to apply
    const updates: any = {};
    updates[`/rooms/${room.id}`] = room;
    
    // Apply the updates
    return update(ref(database), updates)
      .then(() => {
        console.log("Room saved to Firebase successfully");
      })
      .catch((error) => {
        console.error("Error saving room to Firebase:", error);
      });
  }
  
  // Delete room from Firebase
  private deleteRoomFromFirebase(roomId: string) {
    return remove(ref(database, `rooms/${roomId}`))
      .then(() => {
        console.log("Room deleted from Firebase successfully");
      })
      .catch((error) => {
        console.error("Error deleting room from Firebase:", error);
      });
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

  // Sync rooms from Firebase
  private syncRoomsFromFirebase() {
    console.log("Syncing rooms from Firebase");
    
    get(this.roomsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const rooms: Room[] = [];
          
          snapshot.forEach((roomSnapshot) => {
            const roomData = roomSnapshot.val();
            if (roomData) {
              // Ensure the room has an id
              const room: Room = {
                ...roomData,
                id: roomData.id || roomSnapshot.key
              };
              rooms.push(room);
            }
          });
          
          console.log("Rooms from Firebase:", rooms);
          
          // Update local state and Redux
          this.mockRooms = rooms;
          this.saveRoomsToStorage();
          store.dispatch(setRooms([...rooms]));
          
          // Broadcast to other tabs that rooms were updated
          this.broadcast('ROOMS_UPDATED');
        } else {
          console.log("No rooms found in Firebase");
        }
      })
      .catch((error) => {
        console.error("Error syncing rooms from Firebase:", error);
      });
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
    // Update rooms array
    const index = this.mockRooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      this.mockRooms[index] = room;
    } else {
      this.mockRooms.push(room);
    }
    
    // Save to localStorage
    this.saveRoomsToStorage();
    
    // Save to Firebase
    this.saveRoomToFirebase(room);
    
    // Update Redux store
    store.dispatch(addRoom(room));
    
    // Broadcast to other tabs if needed
    if (shouldBroadcast) {
      this.broadcast('ROOM_CREATED', room);
    }
  }
  
  private mergeRooms(rooms: Room[]) {
    // Create a map for quick lookup
    const existingRoomsMap = new Map(this.mockRooms.map(room => [room.id, room]));
    
    // Update existing rooms and add new ones
    for (const room of rooms) {
      existingRoomsMap.set(room.id, room);
      
      // Also save each room to Firebase
      this.saveRoomToFirebase(room);
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
    this.syncRoomsFromFirebase();
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
    // First get the latest data from Firebase
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          console.log('Room not found', roomId);
          return false;
        }
        
        const room = snapshot.val() as Room;
        
        if (room.type === 'private' && room.password !== password) {
          console.log('Wrong password');
          return false;
        }
        
        if (!room.players.some(p => p.id === player.id)) {
          room.players.push(player);
          this.addOrUpdateRoom(room);
        }
        
        return true;
      })
      .catch((error) => {
        console.error("Error joining room:", error);
        return false;
      });
  }

  leaveRoom(roomId: string, playerId: string) {
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        
        const room = snapshot.val() as Room;
        room.players = room.players.filter(p => p.id !== playerId);
        
        this.addOrUpdateRoom(room);
      })
      .catch((error) => {
        console.error("Error leaving room:", error);
      });
  }

  startGame(roomId: string) {
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        
        const room = snapshot.val() as Room;
        room.status = 'playing';
        
        this.addOrUpdateRoom(room);
      })
      .catch((error) => {
        console.error("Error starting game:", error);
      });
  }

  createTeam(roomId: string, team: Omit<Team, 'id'>) {
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        
        const room = snapshot.val() as Room;
        const newTeam: Team = {
          ...team,
          id: Math.random().toString(36).substr(2, 9)
        };
        
        room.teams.push(newTeam);
        this.addOrUpdateRoom(room);
        
        return newTeam.id;
      })
      .catch((error) => {
        console.error("Error creating team:", error);
      });
  }

  joinTeam(roomId: string, teamId: string, playerId: string) {
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        
        const room = snapshot.val() as Room;
        const team = room.teams.find(t => t.id === teamId);
        if (!team) return;
        
        const player = room.players.find(p => p.id === playerId);
        if (!player) return;
        
        if (!team.players.some(p => p.id === playerId)) {
          team.players.push(player);
          this.addOrUpdateRoom(room);
        }
      })
      .catch((error) => {
        console.error("Error joining team:", error);
      });
  }

  leaveTeam(roomId: string, teamId: string, playerId: string) {
    return get(ref(database, `rooms/${roomId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        
        const room = snapshot.val() as Room;
        const team = room.teams.find(t => t.id === teamId);
        if (!team) return;
        
        team.players = team.players.filter(p => p.id !== playerId);
        this.addOrUpdateRoom(room);
      })
      .catch((error) => {
        console.error("Error leaving team:", error);
      });
  }

  forceRefreshRooms() {
    this.broadcast('FORCE_REFRESH');
    this.syncRoomsFromFirebase();
    return true;
  }

  syncRoomsNow() {
    return this.syncRoomsFromFirebase();
  }

  debugRooms() {
    return [...this.mockRooms];
  }
}

const socketService = new SocketService();
export default socketService;
