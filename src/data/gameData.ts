
import { GameId, GameInfo } from '../types/game';

export const gamesInfo: GameInfo[] = [
  {
    id: GameId.Alias,
    name: "אליאס אונליין",
    description: "נסה להסביר את המושג לחברי הקבוצה מבלי להשתמש במילה עצמה",
    minPlayers: 2,
    maxPlayers: 20,
    imageUrl: "/games/alias.jpg",
    color: "#8B5CF6", // Purple
    settings: {
      scoreToWin: true,
      timeLimit: true,
      roundsCount: false,
      difficulty: true,
      categories: true,
      teamBased: true
    }
  },
  {
    id: GameId.Taboo,
    name: "Taboo אונליין",
    description: "הסבר מילה מבלי להשתמש במילים האסורות שמופיעות לצידה",
    minPlayers: 2,
    maxPlayers: 20,
    imageUrl: "/games/taboo.jpg",
    color: "#0EA5E9", // Blue
    settings: {
      scoreToWin: true,
      timeLimit: true,
      roundsCount: false,
      difficulty: true,
      categories: true,
      teamBased: true
    }
  },
  {
    id: GameId.FiveSeconds,
    name: "5 שניות",
    description: "תן שלוש תשובות לשאלה תוך 5 שניות",
    minPlayers: 2,
    maxPlayers: 20,
    imageUrl: "/games/five-seconds.jpg",
    color: "#F97316", // Orange
    settings: {
      scoreToWin: true,
      timeLimit: false,
      roundsCount: true,
      difficulty: true,
      categories: true,
      teamBased: true
    }
  },
  {
    id: GameId.WhatAmI,
    name: "מה אני?",
    description: "נחש את המושג על סמך שאלות כן/לא",
    minPlayers: 2,
    maxPlayers: 15,
    imageUrl: "/games/what-am-i.jpg",
    color: "#D946EF", // Pink
    settings: {
      scoreToWin: true,
      timeLimit: true,
      roundsCount: false,
      difficulty: true,
      categories: true,
      teamBased: false
    }
  },
  {
    id: GameId.WordChain,
    name: "מילים מתחלפות",
    description: "צור שרשרת מילים, כשהמילה הבאה מתחילה באות האחרונה של הקודמת",
    minPlayers: 2,
    maxPlayers: 15,
    imageUrl: "/games/word-chain.jpg",
    color: "#10B981", // Green
    settings: {
      scoreToWin: false,
      timeLimit: true,
      roundsCount: true,
      difficulty: false,
      categories: false,
      teamBased: false
    }
  },
  {
    id: GameId.TruthOrDare,
    name: "אמת או חובה חשיבתי",
    description: "ענה על שאלות יצירתיות או פתור משימות לוגיות",
    minPlayers: 2,
    maxPlayers: 20,
    imageUrl: "/games/truth-or-dare.jpg",
    color: "#EF4444", // Red
    settings: {
      scoreToWin: false,
      timeLimit: false,
      roundsCount: true,
      difficulty: true,
      categories: true,
      teamBased: false
    }
  },
  {
    id: GameId.GroupMemory,
    name: "זיכרון קבוצתי",
    description: "הוסף פריט לשרשרת וזכור את כל הפריטים הקודמים",
    minPlayers: 2,
    maxPlayers: 15,
    imageUrl: "/games/group-memory.jpg",
    color: "#FBBF24", // Yellow
    settings: {
      scoreToWin: false,
      timeLimit: false,
      roundsCount: true,
      difficulty: true,
      categories: false,
      teamBased: true
    }
  },
  {
    id: GameId.ChineseWhispers,
    name: "מסר מקולקל",
    description: "העבר מידע דרך שרשרת שחקנים וראה כמה המסר השתנה בסוף",
    minPlayers: 3,
    maxPlayers: 20,
    imageUrl: "/games/chinese-whispers.jpg",
    color: "#8B5CF6", // Purple
    settings: {
      scoreToWin: false,
      timeLimit: false,
      roundsCount: true,
      difficulty: false,
      categories: true,
      teamBased: false
    }
  },
  {
    id: GameId.Trivia,
    name: "טריוויה קבוצתית",
    description: "ענה על שאלות ידע כללי כקבוצה",
    minPlayers: 1,
    maxPlayers: 30,
    imageUrl: "/games/trivia.jpg",
    color: "#0EA5E9", // Blue
    settings: {
      scoreToWin: true,
      timeLimit: true,
      roundsCount: true,
      difficulty: true,
      categories: true,
      teamBased: true
    }
  },
  {
    id: GameId.MysteryCase,
    name: "פיצוח סוד",
    description: "פתור חידה על סמך רמזים שנחשפים בהדרגה",
    minPlayers: 1,
    maxPlayers: 20,
    imageUrl: "/games/mystery-case.jpg",
    color: "#D946EF", // Pink
    settings: {
      scoreToWin: false,
      timeLimit: false,
      roundsCount: false,
      difficulty: true,
      categories: true,
      teamBased: true
    }
  }
];

export const getGameById = (id: GameId): GameInfo => {
  return gamesInfo.find(game => game.id === id) || gamesInfo[0];
};
