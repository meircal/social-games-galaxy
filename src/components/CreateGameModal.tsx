
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { v4 as uuidv4 } from "@/utils/uuid";
import { addRoom, setCurrentRoom } from "@/store/slices/roomsSlice";
import { useToast } from "@/hooks/use-toast";
import { GameId } from "@/types/game";
import { gamesInfo } from "@/data/gameData";
import { Lock, Globe } from "lucide-react";

interface CreateGameModalProps {
  gameId: string;
  onClose: () => void;
}

export const CreateGameModal = ({ gameId, onClose }: CreateGameModalProps) => {
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [roomType, setRoomType] = useState<"public" | "private">("public");
  const { currentUser } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const gameInfo = gamesInfo.find((game) => game.id === gameId);
  
  const handleCreateRoom = () => {
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
    
    const newRoom = {
      id: uuidv4(),
      name: roomName.trim(),
      gameId: gameId as GameId,
      type: roomType,
      password: roomType === "private" ? password : undefined,
      host: currentUser,
      teams: [],
      players: [currentUser],
      settings: {},
      status: "waiting" as const,
      createdAt: new Date(),
    };
    
    dispatch(addRoom(newRoom));
    dispatch(setCurrentRoom(newRoom));
    
    toast({
      title: "החדר נוצר בהצלחה",
      description: `החדר "${roomName}" נוצר בהצלחה`,
    });
    
    onClose();
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
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleCreateRoom}>
            צור משחק
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
