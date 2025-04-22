
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentRoom, rooms } = useAppSelector((state) => state.rooms);
  const { currentUser } = useAppSelector((state) => state.user);
  
  // Find the room from the store using the roomId from URL params
  const room = currentRoom?.id === roomId 
    ? currentRoom 
    : rooms.find(r => r.id === roomId);
    
  useEffect(() => {
    // If no room is found, show error and redirect to home
    if (!room) {
      toast({
        title: "שגיאה",
        description: "החדר המבוקש לא נמצא",
        variant: "destructive",
      });
      navigate("/");
    }
    
    // If user is not logged in, redirect to home
    if (!currentUser) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר תחילה",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [room, currentUser, navigate, toast]);
  
  if (!room || !currentUser) return null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">חדר: {room.name}</CardTitle>
          <CardDescription>
            סוג משחק: {room.gameId} | 
            סוג חדר: {room.type === 'public' ? 'ציבורי' : 'פרטי'} | 
            מנהל החדר: {room.host.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">משתתפים</h3>
              <div className="mt-2 space-y-1">
                {room.players.map(player => (
                  <div key={player.id} className="flex items-center">
                    <span className="font-medium">{player.name}</span>
                    {player.id === room.host.id && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        מנהל
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">סטטוס משחק</h3>
              <p className="mt-1">
                {room.status === 'waiting' ? 'ממתין למשתתפים' : 
                 room.status === 'playing' ? 'משחק בתהליך' : 'משחק הסתיים'}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => navigate("/")}>
                חזרה לדף הבית
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameRoom;
