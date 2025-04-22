
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { gamesInfo } from "@/data/gameData";
import { useAppSelector } from "@/store/hooks";
import { UserAuth } from "@/components/UserAuth";

const Index = () => {
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const { currentUser } = useAppSelector(state => state.user);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-10">
      {showAuth && !currentUser && <UserAuth onComplete={() => setShowAuth(false)} />}
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-primary animate-slide-in">גלקסיית המשחקים החברתיים</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            עשרה משחקי חברה וחשיבה קבוצתיים אינטראקטיביים עם ניהול קבוצות וניקוד בזמן אמת
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {gamesInfo.map((game) => (
            <Card 
              key={game.id}
              className={`overflow-hidden transition-all duration-300 ${
                hoveredGameId === game.id ? 'scale-105' : ''
              } animate-bounce-in`}
              onMouseEnter={() => setHoveredGameId(game.id)}
              onMouseLeave={() => setHoveredGameId(null)}
              style={{
                borderColor: hoveredGameId === game.id ? game.color : undefined,
                boxShadow: hoveredGameId === game.id ? `0 8px 20px -4px ${game.color}40` : undefined
              }}
            >
              <div 
                className="h-36 relative bg-gradient-to-r"
                style={{ 
                  background: `linear-gradient(to right, ${game.color}30, ${game.color}50)`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white drop-shadow-md">{game.name}</span>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center">{game.name}</CardTitle>
                <CardDescription className="text-center">{game.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>שחקנים:</span>
                  <span>{game.minPlayers}-{game.maxPlayers}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-2 pb-6">
                <Button 
                  className="animate-pulse-glow"
                  style={{ 
                    backgroundColor: game.color,
                    borderColor: 'transparent' 
                  }}
                >
                  צור משחק חדש
                </Button>
                <Button variant="outline">חדרים פעילים</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <footer className="text-center text-muted-foreground py-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">איך זה עובד?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card p-4 rounded-lg shadow">
                <h3 className="font-bold mb-2">1. בחר משחק</h3>
                <p>בחר מתוך 10 משחקי חברה קבוצתיים</p>
              </div>
              <div className="bg-card p-4 rounded-lg shadow">
                <h3 className="font-bold mb-2">2. צור חדר</h3>
                <p>צור חדר פרטי או ציבורי והזמן את חבריך</p>
              </div>
              <div className="bg-card p-4 rounded-lg shadow">
                <h3 className="font-bold mb-2">3. התחל לשחק!</h3>
                <p>שחקו יחד בזמן אמת עם ניקוד אוטומטי</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
