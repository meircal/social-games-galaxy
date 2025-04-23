
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGameById } from "@/data/gameData";
import { Users, Play, Lock, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import socketService from "@/services/socketService";
import { addPlayerToRoom, setRooms } from "@/store/slices/roomsSlice";

const ActiveRooms = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { rooms } = useAppSelector((state) => state.rooms);
  const { currentUser } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);
  
  const activeRooms = rooms.filter(room => room.status !== 'finished');
  const selectedRoom = selectedRoomId ? rooms.find(room => room.id === selectedRoomId) : null;

  // Create a function to refresh the rooms list
  const refreshRoomsList = useCallback(() => {
    if (!currentUser) return;
    
    setIsRefreshing(true);
    
    // Connect to socket if not already connected
    socketService.connect(currentUser.id);
    
    // Force refresh rooms from localStorage and other tabs
    const success = socketService.forceRefreshRooms();
    
    // Get the latest rooms list
    const latestRooms = socketService.getRooms();
    
    // Update Redux store with the latest rooms
    if (latestRooms.length > 0) {
      console.log("Updating rooms in ActiveRooms component:", latestRooms);
      dispatch(setRooms(latestRooms));
    }
    
    // Reset the refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    
  }, [currentUser, dispatch]);

  // Set up broadcast channel for real-time updates
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    
    try {
      channel = new BroadcastChannel('social_games_sync');
      channel.onmessage = (event) => {
        console.log('ActiveRooms received broadcast:', event.data);
        if (event.data.action === 'ROOMS_UPDATED' || event.data.action === 'ROOM_CREATED' || event.data.action === 'FORCE_REFRESH') {
          refreshRoomsList();
        }
      };
      setBroadcastChannel(channel);
    } catch (e) {
      console.error('BroadcastChannel not supported in ActiveRooms', e);
    }
    
    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [refreshRoomsList]);
  
  // Set up polling and storage event listeners
  useEffect(() => {
    if (currentUser) {
      socketService.connect(currentUser.id);
      
      // Initial refresh
      refreshRoomsList();
      
      // Set up polling interval
      const interval = setInterval(() => {
        if (isOpen) {
          refreshRoomsList();
        }
      }, 3000);
      
      // Listen for storage events as a fallback for cross-tab communication
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'social_games_rooms' && isOpen) {
          console.log('Storage change detected in ActiveRooms');
          refreshRoomsList();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [currentUser, isOpen, refreshRoomsList]);

  // Refresh when dialog opens
  useEffect(() => {
    if (isOpen && currentUser) {
      // Initial load
      refreshRoomsList();
      
      // Also refresh after a short delay to catch any late updates
      const timeoutId = setTimeout(refreshRoomsList, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, currentUser, refreshRoomsList]);

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      toast({
        title: "שגיאה",
        description: "החדר לא נמצא",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר תחילה",
        variant: "destructive",
      });
      return;
    }
    
    if (room.type === 'private') {
      setSelectedRoomId(roomId);
    } else {
      joinRoom(roomId);
    }
  };

  const joinRoom = (roomId: string, providedPassword?: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !currentUser) {
      toast({
        title: "שגיאה",
        description: "החדר לא נמצא",
        variant: "destructive",
      });
      return;
    }
    
    const joinSuccess = socketService.joinRoom(roomId, currentUser, providedPassword);
    
    if (!joinSuccess && room.type === 'private') {
      toast({
        title: "שגיאה",
        description: "סיסמה שגויה",
        variant: "destructive",
      });
      return;
    }
    
    if (!joinSuccess) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להצטרף לחדר",
        variant: "destructive",
      });
      return;
    }
    
    dispatch(addPlayerToRoom({ roomId, player: currentUser }));
    
    toast({
      title: "הצטרפת לחדר",
      description: `הצטרפת לחדר ${room.name}`,
    });
    
    setSelectedRoomId(null);
    setPassword("");
    onClose();
    navigate(`/room/${roomId}`);
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoomId) {
      joinRoom(selectedRoomId, password);
    }
  };

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center">חדרים פעילים</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="mb-4">עליך להתחבר כדי לראות חדרים פעילים</p>
            <Button onClick={onClose}>סגור</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">חדרים פעילים</DialogTitle>
          <DialogDescription className="text-center">
            בחר חדר כדי להצטרף למשחק
          </DialogDescription>
        </DialogHeader>
        
        {selectedRoomId ? (
          <form onSubmit={handleSubmitPassword} className="space-y-4 py-4">
            <div className="text-center">
              <p className="mb-2">חדר זה מוגן בסיסמה</p>
              <Input
                type="password"
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mx-auto max-w-[250px]"
              />
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRoomId(null)}>
                חזור
              </Button>
              <Button type="submit">
                הצטרף לחדר
              </Button>
            </div>
          </form>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              {isRefreshing && (
                <div className="flex justify-center py-2">
                  <RefreshCcw className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              
              {activeRooms.length > 0 ? (
                <div className="space-y-3">
                  {activeRooms.map(room => {
                    const gameInfo = getGameById(room.gameId);
                    const isPlayerInRoom = room.players.some(p => p.id === currentUser?.id);
                    
                    return (
                      <Card key={room.id} className="hover:bg-accent/10 transition-colors">
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                            <Badge variant={room.status === 'waiting' ? 'outline' : 'default'}>
                              {room.status === 'waiting' ? 'ממתין' : 'משחק פעיל'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="flex justify-between items-center text-sm">
                            <div>
                              <p>משחק: {gameInfo?.name || room.gameId}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>{room.players.length} שחקנים</span>
                                {room.type === 'private' && <Lock className="h-3.5 w-3.5 mr-2" />}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleJoinRoom(room.id)}
                              disabled={room.status === 'playing' && !isPlayerInRoom}
                            >
                              <Play className="h-3.5 w-3.5 mr-1" />
                              {isPlayerInRoom ? 'חזור לחדר' : 'הצטרף'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>אין חדרים פעילים כרגע</p>
                  <p className="text-sm mt-1">צור חדר חדש כדי להתחיל לשחק</p>
                </div>
              )}
            </ScrollArea>
            <div className="pt-4 flex justify-between">
              <Button 
                variant="secondary" 
                onClick={refreshRoomsList}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                רענן רשימה
              </Button>
              <Button variant="outline" onClick={onClose}>סגור</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActiveRooms;
