
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { gamesInfo } from "@/data/gameData";
import { useAppSelector } from "@/store/hooks";
import { UserAuth } from "@/components/UserAuth";
import { Trophy, Users, Clock } from "lucide-react";

const Index = () => {
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const { currentUser } = useAppSelector(state => state.user);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/20 py-12">
      {showAuth && !currentUser && <UserAuth onComplete={() => setShowAuth(false)} />}
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-fade-in">
            גלקסיית המשחקים החברתיים
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in opacity-0 [animation-delay:200ms]">
            עשרה משחקי חברה וחשיבה קבוצתיים אינטראקטיביים עם ניהול קבוצות וניקוד בזמן אמת
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {gamesInfo.map((game) => (
            <Card 
              key={game.id}
              className={`group overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                hoveredGameId === game.id ? 'scale-105' : ''
              } animate-fade-in opacity-0 [animation-delay:400ms] backdrop-blur-sm bg-card/90`}
              onMouseEnter={() => setHoveredGameId(game.id)}
              onMouseLeave={() => setHoveredGameId(null)}
              style={{
                borderColor: hoveredGameId === game.id ? game.color : undefined,
                boxShadow: hoveredGameId === game.id ? `0 8px 32px -4px ${game.color}40` : undefined
              }}
            >
              <div 
                className="h-40 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${game.color}20, ${game.color}40)`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-4xl font-bold text-foreground drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                    {game.name}
                  </span>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">{game.name}</CardTitle>
                <CardDescription className="text-center text-base">{game.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>שחקנים:</span>
                  </div>
                  <span className="font-medium">{game.minPlayers}-{game.maxPlayers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>זמן משחק:</span>
                  </div>
                  <span className="font-medium">15-20 דקות</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-3 pb-6">
                <Button 
                  className="group-hover:animate-pulse"
                  style={{ 
                    backgroundColor: game.color,
                    borderColor: 'transparent' 
                  }}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  צור משחק חדש
                </Button>
                <Button variant="outline" className="hover:bg-card/60">
                  <Users className="w-4 h-4 mr-2" />
                  חדרים פעילים
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <footer className="text-center text-muted-foreground py-12 animate-fade-in opacity-0 [animation-delay:600ms]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-foreground">איך זה עובד?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-lg mb-3 text-foreground">1. בחר משחק</h3>
                <p className="text-sm">בחר מתוך 10 משחקי חברה קבוצתיים מרתקים</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-lg mb-3 text-foreground">2. צור חדר</h3>
                <p className="text-sm">צור חדר פרטי או ציבורי והזמן את חבריך למשחק</p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="font-bold text-lg mb-3 text-foreground">3. התחל לשחק!</h3>
                <p className="text-sm">שחקו יחד בזמן אמת עם ניקוד אוטומטי ומעקב התקדמות</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
