
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { v4 as uuidv4 } from "@/utils/uuid";

interface UserAuthProps {
  onComplete: () => void;
}

export const UserAuth = ({ onComplete }: UserAuthProps) => {
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    // Create a new user with a random id
    dispatch(setUser({
      id: uuidv4(),
      name: name.trim()
    }));
    
    // Call the onComplete callback to hide the auth modal
    onComplete();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md animate-bounce-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ברוכים הבאים לגלקסיית המשחקים</CardTitle>
          <CardDescription className="text-center">הזן את שמך כדי להתחיל לשחק</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Input
              dir="rtl"
              placeholder="השם שלך"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg h-12"
              autoFocus
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!name.trim()}
            >
              התחל לשחק
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
