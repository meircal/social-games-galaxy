
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initializeAliasGame, initializeTabooGame, initializeFiveSecondsGame, initializeWhatAmIGame, initializeWordChainGame, 
  initializeTruthOrDareGame, initializeGroupMemoryGame, initializeChineseWhispersGame, initializeTriviaGame, initializeMysteryCase,
  setCurrentGameId, updateTurn, updateScore } from "@/store/slices/gameSlice";
import { updateRoomStatus } from "@/store/slices/roomsSlice";
import { GameId, TurnState } from "@/types/game";
import { getGameById } from "@/data/gameData";
import { v4 as uuidv4 } from "@/utils/uuid";
import { Play, Clock, Users, ArrowRight, Check, X } from "lucide-react";

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { currentRoom, rooms } = useAppSelector((state) => state.rooms);
  const { currentUser } = useAppSelector((state) => state.user);
  const gameState = useAppSelector((state) => state.game);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [remainingTime, setRemainingTime] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const room = currentRoom?.id === roomId 
    ? currentRoom 
    : rooms.find(r => r.id === roomId);
    
  const gameInfo = room ? getGameById(room.gameId) : null;
  
  // Removed the first isHost declaration here
  
  useEffect(() => {
    if (!room) {
      toast({
        title: "שגיאה",
        description: "החדר המבוקש לא נמצא",
        variant: "destructive",
      });
      navigate("/");
    }
    
    if (!currentUser) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר תחילה",
        variant: "destructive",
      });
      navigate("/");
    }

    if (room?.status === 'playing' && !gameStarted) {
      setGameStarted(true);
    }
  }, [room, currentUser, navigate, toast, gameStarted]);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isTimerRunning && remainingTime > 0) {
      interval = window.setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
    } else if (remainingTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleTimeUp();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, remainingTime]);

  const initializeGame = () => {
    if (!room || !currentUser) return;
    
    dispatch(updateRoomStatus({ roomId: room.id, status: 'playing' }));
    
    dispatch(setCurrentGameId(room.gameId));
    
    const initialTurnState: TurnState = {
      currentPlayerId: currentUser.id,
      currentTeamId: undefined,
      startTime: Date.now(),
      endTime: Date.now() + 60000,
      remainingTime: 60,
      status: 'active'
    };

    switch (room.gameId) {
      case GameId.Alias:
        const aliasWords = ["כדורגל", "מחשב", "תפוח", "בית", "מכונית", "טלפון", "ספר", "שמש", "ירח", "כוכב"];
        dispatch(initializeAliasGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          wordList: aliasWords,
          usedWords: [],
          correctGuesses: 0,
          skippedWords: [],
          currentWord: aliasWords[0]
        }));
        setCurrentQuestion(aliasWords[0]);
        break;
        
      case GameId.Taboo:
        const tabooCards = [
          { word: "אינטרנט", tabooWords: ["מחשב", "רשת", "אתר", "גלישה", "מידע"] },
          { word: "כדורגל", tabooWords: ["ספורט", "שחקן", "כדור", "שער", "קבוצה"] },
          { word: "פיצה", tabooWords: ["אוכל", "איטלקי", "גבינה", "רוטב", "מאפה"] }
        ];
        dispatch(initializeTabooGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          wordList: tabooCards,
          usedWords: [],
          correctGuesses: 0,
          failedWords: [],
          currentWord: tabooCards[0].word,
          tabooWords: tabooCards[0].tabooWords
        }));
        setCurrentQuestion(tabooCards[0].word);
        break;
        
      case GameId.FiveSeconds:
        const fiveSecQuestions = [
          "ציין שלושה סוגי חיות",
          "ציין שלושה מאכלים איטלקיים",
          "ציין שלוש מדינות באירופה",
          "ציין שלושה ספורטאים מפורסמים"
        ];
        dispatch(initializeFiveSecondsGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          questionList: fiveSecQuestions,
          usedQuestions: [],
          answers: {},
          currentQuestion: fiveSecQuestions[0]
        }));
        setCurrentQuestion(fiveSecQuestions[0]);
        setRemainingTime(5);
        break;
        
      case GameId.WhatAmI:
        const whatAmITerms = ["נמר", "מחשב", "טלוויזיה", "כדורגל", "פיצה"];
        dispatch(initializeWhatAmIGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          termList: whatAmITerms,
          usedTerms: [],
          hints: [],
          questions: [],
          answers: [],
          guessed: false,
          currentTerm: whatAmITerms[0]
        }));
        setCurrentQuestion("נחש מה אני: רמזים יינתנו בהמשך");
        break;

      case GameId.WordChain:
        dispatch(initializeWordChainGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          wordChain: ["שמש"],
          validationResults: {},
          currentPlayerId: currentUser.id,
          timePerTurn: 30,
          currentWord: "שמש"
        }));
        setCurrentQuestion("שמש");
        setRemainingTime(30);
        break;

      case GameId.TruthOrDare:
        const truthQuestions = ["מה הדבר הכי מביך שקרה לך?", "מה החלום הכי מוזר שחלמת?", "מה הסוד שאף פעם לא סיפרת?"];
        const dareQuestions = ["רקוד ריקוד מצחיק", "שיר שיר בקול רם", "עשה חיקוי של מישהו מפורסם"];
        
        dispatch(initializeTruthOrDareGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          currentPlayerId: currentUser.id,
          truthQuestions: truthQuestions,
          dareChallenges: dareQuestions,
          currentType: 'truth',
          currentQuestion: truthQuestions[0],
          responses: []
        }));
        setCurrentQuestion(truthQuestions[0]);
        break;
        
      case GameId.GroupMemory:
        dispatch(initializeGroupMemoryGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          currentSequence: ["אדום"],
          playerSequence: [],
          currentPlayerId: currentUser.id,
          maxSequenceLength: 10,
          failedAttempt: false
        }));
        setCurrentQuestion("זכור את הרצף: אדום");
        break;
        
      case GameId.ChineseWhispers:
        dispatch(initializeChineseWhispersGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          originalMessage: "היום יום שלישי בשבוע והשמש זורחת בחוץ",
          currentMessage: "היום יום שלישי בשבוע והשמש זורחת בחוץ",
          playerOrder: room.players.map(p => p.id),
          currentPlayerIndex: 0,
          messages: [],
          revealed: false
        }));
        setCurrentQuestion("העבר את ההודעה: היום יום שלישי בשבוע והשמש זורחת בחוץ");
        break;
        
      case GameId.Trivia:
        const triviaQuestions = [
          {
            id: "q1",
            text: "מה בירת ישראל?",
            options: ["תל אביב", "חיפה", "ירושלים", "באר שבע"],
            correctAnswer: 2,
            category: "גאוגרפיה",
            difficulty: "easy" as const
          },
          {
            id: "q2",
            text: "איזו מדינה היא הגדולה ביותר בעולם?",
            options: ["סין", "קנדה", "ארה\"ב", "רוסיה"],
            correctAnswer: 3,
            category: "גאוגרפיה",
            difficulty: "medium" as const
          },
          {
            id: "q3",
            text: "מי כתב את הספר ׳הנסיך הקטן׳?",
            options: ["אנטואן דה סנט-אכזופרי", "ויקטור הוגו", "אלבר קאמי", "ז׳אן-פול סארטר"],
            correctAnswer: 0,
            category: "ספרות",
            difficulty: "medium" as const
          }
        ];
        
        dispatch(initializeTriviaGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          questions: triviaQuestions,
          currentQuestionIndex: 0,
          answers: {},
          timePerQuestion: 20,
          categories: ["גאוגרפיה", "ספרות", "היסטוריה", "מדע"]
        }));
        setCurrentQuestion(triviaQuestions[0].text);
        setRemainingTime(20);
        break;
        
      case GameId.MysteryCase:
        dispatch(initializeMysteryCase({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          caseName: "המטמון האבוד",
          clues: [
            "המטמון נמצא בתוך מבנה עתיק",
            "ליד המטמון יש מים זורמים",
            "על המטמון שומר בעל חיים",
            "כדי להגיע למטמון צריך לפתור חידה"
          ],
          revealedClues: 1,
          guesses: [],
          solution: "המטמון נמצא במערה מאחורי המפל, שמור על ידי דרקון",
          isSolved: false
        }));
        setCurrentQuestion("מקרה: המטמון האבוד\nרמז 1: המטמון נמצא בתוך מבנה עתיק");
        break;
        
      default:
        // Fallback to Alias game if game type is unknown
        const defaultWords = ["כדורגל", "מחשב", "תפוח", "בית", "מכונית"];
        dispatch(initializeAliasGame({
          roomId: room.id,
          round: 1,
          turn: initialTurnState,
          scores: room.players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {}),
          gameStatus: 'playing',
          wordList: defaultWords,
          usedWords: [],
          correctGuesses: 0,
          skippedWords: [],
          currentWord: defaultWords[0]
        }));
        setCurrentQuestion(defaultWords[0]);
    }
    
    setCurrentPlayerId(currentUser.id);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  const handleStartGame = () => {
    if (!room || !currentUser) return;
    
    if (currentUser.id !== room.host.id) {
      toast({
        title: "שגיאה",
        description: "רק מנהל החדר יכול להתחיל את המשחק",
        variant: "destructive",
      });
      return;
    }
    
    initializeGame();
    
    toast({
      title: "המשחק החל",
      description: "בהצלחה!",
    });
  };

  const handleAnswer = (isAnswerCorrect: boolean) => {
    if (!room || !currentUser) return;
    
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      dispatch(updateScore({
        gameId: room.gameId,
        playerId: currentPlayerId,
        score: (gameState[`${room.gameId}Game`]?.scores[currentPlayerId] || 0) + 1
      }));
      
      moveToNextQuestion();
    }
    
    setTimeout(() => {
      setIsCorrect(null);
      setAnswer("");
    }, 1000);
  };

  const handleTimeUp = () => {
    if (!room) return;
    
    toast({
      title: "הזמן נגמר!",
      description: "התור עובר לשחקן הבא",
    });
    
    moveToNextPlayer();
  };

  const moveToNextQuestion = () => {
    if (!room) return;
    
    let nextQuestion = "";
    
    switch (room.gameId) {
      case GameId.Alias:
        if (!gameState.aliasGame) return;
        const usedWords = [...gameState.aliasGame.usedWords, gameState.aliasGame.currentWord || ""];
        const availableWords = gameState.aliasGame.wordList.filter(w => !usedWords.includes(w));
        
        if (availableWords.length === 0) {
          handleGameEnd();
          return;
        }
        
        nextQuestion = availableWords[Math.floor(Math.random() * availableWords.length)];
        setCurrentQuestion(nextQuestion);
        break;
        
      case GameId.Taboo:
        if (!gameState.tabooGame) return;
        const usedTabooWords = [...gameState.tabooGame.usedWords];
        const availableCards = gameState.tabooGame.wordList.filter(card => 
          !usedTabooWords.some(used => used.word === card.word)
        );
        
        if (availableCards.length === 0) {
          handleGameEnd();
          return;
        }
        
        const nextCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        setCurrentQuestion(nextCard.word);
        break;
        
      case GameId.FiveSeconds:
        if (!gameState.fiveSecondsGame) return;
        const usedQuestions = [...gameState.fiveSecondsGame.usedQuestions, gameState.fiveSecondsGame.currentQuestion || ""];
        const availableQuestions = gameState.fiveSecondsGame.questionList.filter(q => !usedQuestions.includes(q));
        
        if (availableQuestions.length === 0) {
          handleGameEnd();
          return;
        }
        
        nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        setCurrentQuestion(nextQuestion);
        setRemainingTime(5);
        break;

      case GameId.Trivia:
        if (!gameState.triviaGame) return;
        const nextIndex = gameState.triviaGame.currentQuestionIndex + 1;
        
        if (nextIndex >= gameState.triviaGame.questions.length) {
          handleGameEnd();
          return;
        }
        
        const nextTriviaQuestion = gameState.triviaGame.questions[nextIndex];
        setCurrentQuestion(nextTriviaQuestion.text);
        setRemainingTime(20);
        break;
        
      default:
        // Handle other game types as needed
        moveToNextPlayer();
        return;
    }
  };

  const moveToNextPlayer = () => {
    if (!room) return;
    
    const currentPlayerIndex = room.players.findIndex(p => p.id === currentPlayerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    const nextPlayer = room.players[nextPlayerIndex];
    
    setCurrentPlayerId(nextPlayer.id);
    setRemainingTime(60);
    
    dispatch(updateTurn({
      gameId: room.gameId,
      turn: {
        currentPlayerId: nextPlayer.id,
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        remainingTime: 60,
        status: 'active'
      }
    }));
    
    if (nextPlayerIndex === 0) {
      // Full round completed
      // Could increment round counter here if needed
    }
  };

  const handleGameEnd = () => {
    if (!room) return;
    
    dispatch(updateRoomStatus({ roomId: room.id, status: 'finished' }));
    
    const scores = gameState[`${room.gameId}Game`]?.scores || {};
    const highestScore = Math.max(...Object.values(scores).map(score => Number(score)));
    const winners = room.players.filter(player => scores[player.id] === highestScore);
    
    toast({
      title: "המשחק הסתיים!",
      description: winners.length === 1 
        ? `המנצח הוא: ${winners[0].name} עם ${highestScore} נקודות`
        : `יש תיקו בין ${winners.map(w => w.name).join(', ')} עם ${highestScore} נקודות`,
    });
    
    setGameStarted(false);
    setIsTimerRunning(false);
  };

  const handleSkip = () => {
    if (!room) return;
    
    toast({
      title: "דילגת על השאלה",
      description: "עוברים לשאלה הבאה",
    });
    
    if (room.gameId === GameId.Alias && gameState.aliasGame) {
      const skippedWords = [...gameState.aliasGame.skippedWords, gameState.aliasGame.currentWord || ""];
    } else if (room.gameId === GameId.Taboo && gameState.tabooGame) {
      const failedWords = [...gameState.tabooGame.failedWords, gameState.tabooGame.currentWord || ""];
    }
    
    moveToNextQuestion();
  };

  if (!room || !currentUser) return null;
  
  const isHost = currentUser.id === room.host.id;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-2xl">חדר: {room.name}</CardTitle>
          <CardDescription>
            סוג משחק: {gameInfo?.name || room.gameId} | 
            סוג חדר: {room.type === 'public' ? 'ציבורי' : 'פרטי'} | 
            מנהל החדר: {room.host.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {!gameStarted ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">משתתפים</h3>
                <div className="mt-2 space-y-1">
                  {room.players.map(player => (
                    <div key={player.id} className="flex items-center">
                      <span className="font-medium">{player.name}</span>
                      {player.id === room.host.id && (
                        <span className="mr-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
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
              
              {isHost && room.status === 'waiting' ? (
                <div className="flex justify-center">
                  <Button onClick={handleStartGame} className="gap-2">
                    <Play className="h-4 w-4" />
                    התחל משחק
                  </Button>
                </div>
              ) : room.status === 'waiting' && (
                <p className="text-center text-muted-foreground">
                  ממתין למנהל החדר להתחיל את המשחק...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>תור של: {room.players.find(p => p.id === currentPlayerId)?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className={remainingTime < 10 ? "text-red-500 font-bold" : ""}>
                    {remainingTime} שניות
                  </span>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">השאלה הנוכחית</h3>
                  <div className="text-2xl font-bold p-4 bg-primary/10 rounded-md">
                    {currentQuestion}
                  </div>
                  
                  {room.gameId === GameId.Taboo && gameState.tabooGame?.tabooWords && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">מילים אסורות:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {gameState.tabooGame.tabooWords.map((word, idx) => (
                          <span key={idx} className="bg-destructive/20 text-destructive px-2 py-1 rounded text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {currentPlayerId === currentUser.id ? (
                  <>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="destructive" 
                        onClick={handleSkip}
                        className="gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        דלג
                      </Button>
                      
                      <Button 
                        variant="default" 
                        onClick={() => handleAnswer(true)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        תשובה נכונה
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">
                    {`זה התור של ${room.players.find(p => p.id === currentPlayerId)?.name}, נסו לנחש את התשובה!`}
                  </p>
                )}
              </div>
              
              {isCorrect !== null && (
                <div className={`text-center p-2 rounded-md ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה!'}
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium">ניקוד</h3>
                <div className="mt-2">
                  {room.players.map(player => (
                    <div key={player.id} className="flex justify-between py-1 border-b">
                      <span>{player.name}</span>
                      <span className="font-medium">
                        {gameState[`${room.gameId}Game`]?.scores[player.id] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-card border-t p-4">
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              חזרה לדף הבית
            </Button>
            
            {room.status === 'playing' && isHost && (
              <Button variant="destructive" onClick={handleGameEnd}>
                סיים משחק
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameRoom;
