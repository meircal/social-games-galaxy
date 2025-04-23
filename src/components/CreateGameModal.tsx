
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentRoom } from "@/store/slices/roomsSlice";
import { useToast } from "@/hooks/use-toast";
import { GameId } from "@/types/game";
import { gamesInfo } from "@/data/gameData";
import { Lock, Globe } from "lucide-react";
import socketService from "@/services/socketService";
import { useNavigate } from "react-router-dom";

interface CreateGameModalProps {
  gameId: string;
  onClose: () => void;
}

export const CreateGameModal = ({ gameId, onClose }: CreateGameModalProps) => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [roomType, setRoomType] = useState<"public" | "private">("public");
  const [isCreating, setIsCreating] = useState(false);
  const { currentUser } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const gameInfo = gamesInfo.find((game) => game.id === gameId);
  
  // Connect to socket service when component mounts
  useEffect(() => {
    if (currentUser) {
      socketService.connect(currentUser.id);
    }
  }, [currentUser]);
  
  const handleCreateRoom = async () => {
    if (!currentUser) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר תחילה",
        variant: "destructive",
      });
      return;
    }
    
    if (!roomName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם חדר",
        variant: "destructive",
      });
      return;
    }
    
    if (roomType === "private" && !password.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין סיסמה לחדר פרטי",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newRoom = {
        name: roomName.trim(),
        gameId: gameId as GameId,
        type: roomType,
        password: roomType === "private" ? password : undefined,
        host: currentUser,
        teams: [],
        players: [currentUser],
        settings: {},
        status: "waiting" as const,
      };
      
      // Create the room through socketService
      const roomId = socketService.createRoom(newRoom);
      
      if (roomId) {
        // Create a complete room object
        const currentDate = new Date().toISOString();
        const completeRoom = {
          ...newRoom,
          id: roomId,
          createdAt: currentDate
        };
        
        // Set the current room in redux to ensure it's accessible
        dispatch(setCurrentRoom(completeRoom));
        
        // Force a refresh of rooms to ensure they're updated across tabs/devices
        socketService.forceRefreshRooms();
        
        toast({
          title: "החדר נוצר בהצלחה",
          description: `החדר "${roomName}" נוצר בהצלחה`,
        });
        
        // Close the modal first
        onClose();
        
        // Short delay before navigation to ensure state updates
        setTimeout(() => {
          navigate(`/room/${roomId}`);
        }, 100);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת החדר, נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">יצירת משחק חדש</CardTitle>
          <CardDescription className="text-center">
            {gameInfo ? gameInfo.name : "משחק חדש"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">שם החדר</label>
              <Input
                dir="rtl"
                placeholder="הזן שם לחדר"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            
            <Tabs value={roomType} onValueChange={(value) => setRoomType(value as "public" | "private")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="public">
                  <Globe className="w-4 h-4 ml-2" />
                  משחק פתוח לכולם
                </TabsTrigger>
                <TabsTrigger value="private">
                  <Lock className="w-4 h-4 ml-2" />
                  משחק פרטי
                </TabsTrigger>
              </TabsList>
              <TabsContent value="private" className="mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">סיסמה לחדר</label>
                  <Input
                    dir="rtl"
                    type="password"
                    placeholder="הזן סיסמה לחדר"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    רק מי שיש לו את הסיסמה יוכל להצטרף למשחק
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="public" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  משחק פתוח לכולם - כל מי שנכנס לאתר יוכל להצטרף למשחק זה
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            ביטול
          </Button>
          <Button onClick={handleCreateRoom} disabled={isCreating}>
            {isCreating ? "יוצר משחק..." : "צור משחק"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
