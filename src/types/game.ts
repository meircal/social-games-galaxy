
export type Player = {
  id: string;
  name: string;
  avatar?: string;
};

export type Team = {
  id: string;
  name: string;
  color: string;
  players: Player[];
  score: number;
};

export type RoomType = 'public' | 'private';

export type Room = {
  id: string;
  name: string;
  gameId: GameId;
  type: RoomType;
  password?: string;
  host: Player;
  teams: Team[];
  players: Player[];
  settings: GameSettings;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
};

export enum GameId {
  Alias = 'alias',
  Taboo = 'taboo',
  FiveSeconds = 'five-seconds',
  WhatAmI = 'what-am-i',
  WordChain = 'word-chain',
  TruthOrDare = 'truth-or-dare',
  GroupMemory = 'group-memory',
  ChineseWhispers = 'chinese-whispers',
  Trivia = 'trivia',
  MysteryCase = 'mystery-case'
}

export type GameSettings = {
  scoreToWin?: number;
  timeLimit?: number;
  roundsCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories?: string[];
  teamBased?: boolean;
};

export type GameInfo = {
  id: GameId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  imageUrl?: string;
  color: string;
  settings: {
    scoreToWin?: boolean;
    timeLimit?: boolean;
    roundsCount?: boolean;
    difficulty?: boolean;
    categories?: boolean;
    teamBased?: boolean;
  };
};

export type TurnState = {
  currentTeamId?: string;
  currentPlayerId?: string;
  startTime?: number;
  endTime?: number;
  remainingTime?: number;
  status: 'waiting' | 'active' | 'completed' | 'skipped';
};

export type CommonGameState = {
  roomId: string;
  round: number;
  turn: TurnState;
  scores: Record<string, number>; // teamId or playerId -> score
  gameStatus: 'waiting' | 'ready' | 'playing' | 'paused' | 'finished';
};

// Game-specific state types
export type AliasGame = CommonGameState & {
  currentWord?: string;
  wordList: string[];
  usedWords: string[];
  correctGuesses: number;
  skippedWords: string[];
};

export type TabooGame = CommonGameState & {
  currentWord?: string;
  tabooWords?: string[];
  wordList: Array<{ word: string; tabooWords: string[] }>;
  usedWords: Array<{ word: string; tabooWords: string[] }>;
  correctGuesses: number;
  failedWords: string[];
};

export type FiveSecondsGame = CommonGameState & {
  currentQuestion?: string;
  questionList: string[];
  usedQuestions: string[];
  answers: Record<string, boolean>;
};

export type WhatAmIGame = CommonGameState & {
  currentTerm?: string;
  termList: string[];
  usedTerms: string[];
  hints: string[];
  questions: string[];
  answers: string[];
  guessed: boolean;
};

export type WordChainGame = CommonGameState & {
  currentWord?: string;
  wordChain: string[];
  validationResults: Record<string, boolean>;
  currentPlayerId: string;
  timePerTurn: number;
};

export type TruthOrDareGame = CommonGameState & {
  currentPlayerId: string;
  truthQuestions: string[];
  dareChallenges: string[];
  currentType: 'truth' | 'dare';
  currentQuestion?: string;
  currentChallenge?: string;
  responses: Array<{ playerId: string; type: 'truth' | 'dare'; text: string; response?: string }>;
};

export type GroupMemoryGame = CommonGameState & {
  currentSequence: string[];
  playerSequence: string[];
  currentPlayerId: string;
  maxSequenceLength: number;
  failedAttempt: boolean;
};

export type ChineseWhispersGame = CommonGameState & {
  originalMessage: string;
  currentMessage?: string;
  playerOrder: string[];
  currentPlayerIndex: number;
  messages: Array<{ playerId: string; message: string }>;
  revealed: boolean;
};

export type TriviaGame = CommonGameState & {
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  currentQuestionIndex: number;
  answers: Record<string, Record<string, number>>;
  timePerQuestion: number;
  categories: string[];
};

export type MysteryCase = CommonGameState & {
  caseName: string;
  clues: string[];
  revealedClues: number;
  guesses: Array<{ teamId: string; guess: string }>;
  solution: string;
  isSolved: boolean;
};
