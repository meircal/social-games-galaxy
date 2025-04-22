
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGameById } from "@/data/gameData";
import { Users, Play, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ActiveRooms = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { rooms } = useAppSelector((state) => state.rooms);
  const { currentUser } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  
  const activeRooms = rooms.filter(room => room.status !== 'finished');
  const selectedRoom = selectedRoomId ? rooms.find(room => room.id === selectedRoomId) : null;

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
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
      // Join public room directly
      joinRoom(roomId);
    }
  };
  
  const joinRoom = (roomId: string, providedPassword?: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !currentUser) return;
    
    if (room.type === 'private' && room.password !== providedPassword) {
      toast({
        title: "שגיאה",
        description: "סיסמה שגויה",
        variant: "destructive",
      });
      return;
    }
    
    // Check if player is already in the room
    if (!room.players.some(p => p.id === currentUser.id)) {
      // In a real app, this would be done through a server action
      // Here we're just simulating joining
      toast({
        title: "הצטרפת לחדר",
        description: `הצטרפת לחדר ${room.name}`,
      });
    }
    
    // Reset state and navigate to room
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
              {activeRooms.length > 0 ? (
                <div className="space-y-3">
                  {activeRooms.map(room => {
                    const gameInfo = getGameById(room.gameId);
                    const isHost = currentUser?.id === room.host.id;
                    
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
                            >
                              <Play className="h-3.5 w-3.5 mr-1" />
                              {isHost ? 'חזור לחדר' : 'הצטרף'}
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
            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={onClose}>סגור</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActiveRooms;
