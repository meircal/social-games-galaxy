
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  CommonGameState, 
  GameId,
  AliasGame,
  TabooGame,
  FiveSecondsGame,
  WhatAmIGame,
  WordChainGame,
  TruthOrDareGame,
  GroupMemoryGame,
  ChineseWhispersGame,
  TriviaGame,
  MysteryCase,
  TurnState
} from '../../types/game';

interface GameState {
  currentGameId: GameId | null;
  loading: boolean;
  error: string | null;
  aliasGame: AliasGame | null;
  tabooGame: TabooGame | null; 
  fiveSecondsGame: FiveSecondsGame | null;
  whatAmIGame: WhatAmIGame | null;
  wordChainGame: WordChainGame | null;
  truthOrDareGame: TruthOrDareGame | null;
  groupMemoryGame: GroupMemoryGame | null;
  chineseWhispersGame: ChineseWhispersGame | null;
  triviaGame: TriviaGame | null;
  mysteryCase: MysteryCase | null;
}

const initialState: GameState = {
  currentGameId: null,
  loading: false,
  error: null,
  aliasGame: null,
  tabooGame: null,
  fiveSecondsGame: null,
  whatAmIGame: null,
  wordChainGame: null,
  truthOrDareGame: null,
  groupMemoryGame: null,
  chineseWhispersGame: null,
  triviaGame: null,
  mysteryCase: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCurrentGameId: (state, action: PayloadAction<GameId | null>) => {
      state.currentGameId = action.payload;
    },
    resetGame: (state) => {
      state.currentGameId = null;
      state.aliasGame = null;
      state.tabooGame = null;
      state.fiveSecondsGame = null;
      state.whatAmIGame = null;
      state.wordChainGame = null;
      state.truthOrDareGame = null;
      state.groupMemoryGame = null;
      state.chineseWhispersGame = null;
      state.triviaGame = null;
      state.mysteryCase = null;
    },
    
    // Game specific actions
    initializeAliasGame: (state, action: PayloadAction<AliasGame>) => {
      state.aliasGame = action.payload;
    },
    updateAliasGame: (state, action: PayloadAction<Partial<AliasGame>>) => {
      if (state.aliasGame) {
        state.aliasGame = { ...state.aliasGame, ...action.payload };
      }
    },
    
    initializeTabooGame: (state, action: PayloadAction<TabooGame>) => {
      state.tabooGame = action.payload;
    },
    updateTabooGame: (state, action: PayloadAction<Partial<TabooGame>>) => {
      if (state.tabooGame) {
        state.tabooGame = { ...state.tabooGame, ...action.payload };
      }
    },
    
    initializeFiveSecondsGame: (state, action: PayloadAction<FiveSecondsGame>) => {
      state.fiveSecondsGame = action.payload;
    },
    updateFiveSecondsGame: (state, action: PayloadAction<Partial<FiveSecondsGame>>) => {
      if (state.fiveSecondsGame) {
        state.fiveSecondsGame = { ...state.fiveSecondsGame, ...action.payload };
      }
    },
    
    initializeWhatAmIGame: (state, action: PayloadAction<WhatAmIGame>) => {
      state.whatAmIGame = action.payload;
    },
    updateWhatAmIGame: (state, action: PayloadAction<Partial<WhatAmIGame>>) => {
      if (state.whatAmIGame) {
        state.whatAmIGame = { ...state.whatAmIGame, ...action.payload };
      }
    },
    
    initializeWordChainGame: (state, action: PayloadAction<WordChainGame>) => {
      state.wordChainGame = action.payload;
    },
    updateWordChainGame: (state, action: PayloadAction<Partial<WordChainGame>>) => {
      if (state.wordChainGame) {
        state.wordChainGame = { ...state.wordChainGame, ...action.payload };
      }
    },
    
    initializeTruthOrDareGame: (state, action: PayloadAction<TruthOrDareGame>) => {
      state.truthOrDareGame = action.payload;
    },
    updateTruthOrDareGame: (state, action: PayloadAction<Partial<TruthOrDareGame>>) => {
      if (state.truthOrDareGame) {
        state.truthOrDareGame = { ...state.truthOrDareGame, ...action.payload };
      }
    },
    
    initializeGroupMemoryGame: (state, action: PayloadAction<GroupMemoryGame>) => {
      state.groupMemoryGame = action.payload;
    },
    updateGroupMemoryGame: (state, action: PayloadAction<Partial<GroupMemoryGame>>) => {
      if (state.groupMemoryGame) {
        state.groupMemoryGame = { ...state.groupMemoryGame, ...action.payload };
      }
    },
    
    initializeChineseWhispersGame: (state, action: PayloadAction<ChineseWhispersGame>) => {
      state.chineseWhispersGame = action.payload;
    },
    updateChineseWhispersGame: (state, action: PayloadAction<Partial<ChineseWhispersGame>>) => {
      if (state.chineseWhispersGame) {
        state.chineseWhispersGame = { ...state.chineseWhispersGame, ...action.payload };
      }
    },
    
    initializeTriviaGame: (state, action: PayloadAction<TriviaGame>) => {
      state.triviaGame = action.payload;
    },
    updateTriviaGame: (state, action: PayloadAction<Partial<TriviaGame>>) => {
      if (state.triviaGame) {
        state.triviaGame = { ...state.triviaGame, ...action.payload };
      }
    },
    
    initializeMysteryCase: (state, action: PayloadAction<MysteryCase>) => {
      state.mysteryCase = action.payload;
    },
    updateMysteryCase: (state, action: PayloadAction<Partial<MysteryCase>>) => {
      if (state.mysteryCase) {
        state.mysteryCase = { ...state.mysteryCase, ...action.payload };
      }
    },
    
    updateTurn: (state, action: PayloadAction<{ gameId: GameId, turn: Partial<TurnState> }>) => {
      const { gameId, turn } = action.payload;
      
      switch (gameId) {
        case GameId.Alias:
          if (state.aliasGame) {
            state.aliasGame.turn = { ...state.aliasGame.turn, ...turn };
          }
          break;
        case GameId.Taboo:
          if (state.tabooGame) {
            state.tabooGame.turn = { ...state.tabooGame.turn, ...turn };
          }
          break;
        case GameId.FiveSeconds:
          if (state.fiveSecondsGame) {
            state.fiveSecondsGame.turn = { ...state.fiveSecondsGame.turn, ...turn };
          }
          break;
        case GameId.WhatAmI:
          if (state.whatAmIGame) {
            state.whatAmIGame.turn = { ...state.whatAmIGame.turn, ...turn };
          }
          break;
        case GameId.WordChain:
          if (state.wordChainGame) {
            state.wordChainGame.turn = { ...state.wordChainGame.turn, ...turn };
          }
          break;
        case GameId.TruthOrDare:
          if (state.truthOrDareGame) {
            state.truthOrDareGame.turn = { ...state.truthOrDareGame.turn, ...turn };
          }
          break;
        case GameId.GroupMemory:
          if (state.groupMemoryGame) {
            state.groupMemoryGame.turn = { ...state.groupMemoryGame.turn, ...turn };
          }
          break;
        case GameId.ChineseWhispers:
          if (state.chineseWhispersGame) {
            state.chineseWhispersGame.turn = { ...state.chineseWhispersGame.turn, ...turn };
          }
          break;
        case GameId.Trivia:
          if (state.triviaGame) {
            state.triviaGame.turn = { ...state.triviaGame.turn, ...turn };
          }
          break;
        case GameId.MysteryCase:
          if (state.mysteryCase) {
            state.mysteryCase.turn = { ...state.mysteryCase.turn, ...turn };
          }
          break;
      }
    },
    
    updateScore: (state, action: PayloadAction<{ gameId: GameId, playerId: string, score: number }>) => {
      const { gameId, playerId, score } = action.payload;
      
      switch (gameId) {
        case GameId.Alias:
          if (state.aliasGame) {
            state.aliasGame.scores[playerId] = score;
          }
          break;
        case GameId.Taboo:
          if (state.tabooGame) {
            state.tabooGame.scores[playerId] = score;
          }
          break;
        case GameId.FiveSeconds:
          if (state.fiveSecondsGame) {
            state.fiveSecondsGame.scores[playerId] = score;
          }
          break;
        case GameId.WhatAmI:
          if (state.whatAmIGame) {
            state.whatAmIGame.scores[playerId] = score;
          }
          break;
        case GameId.WordChain:
          if (state.wordChainGame) {
            state.wordChainGame.scores[playerId] = score;
          }
          break;
        case GameId.TruthOrDare:
          if (state.truthOrDareGame) {
            state.truthOrDareGame.scores[playerId] = score;
          }
          break;
        case GameId.GroupMemory:
          if (state.groupMemoryGame) {
            state.groupMemoryGame.scores[playerId] = score;
          }
          break;
        case GameId.ChineseWhispers:
          if (state.chineseWhispersGame) {
            state.chineseWhispersGame.scores[playerId] = score;
          }
          break;
        case GameId.Trivia:
          if (state.triviaGame) {
            state.triviaGame.scores[playerId] = score;
          }
          break;
        case GameId.MysteryCase:
          if (state.mysteryCase) {
            state.mysteryCase.scores[playerId] = score;
          }
          break;
      }
    }
  },
});

export const {
  setLoading,
  setError,
  setCurrentGameId,
  resetGame,
  initializeAliasGame,
  updateAliasGame,
  initializeTabooGame,
  updateTabooGame,
  initializeFiveSecondsGame,
  updateFiveSecondsGame,
  initializeWhatAmIGame,
  updateWhatAmIGame,
  initializeWordChainGame,
  updateWordChainGame,
  initializeTruthOrDareGame,
  updateTruthOrDareGame,
  initializeGroupMemoryGame,
  updateGroupMemoryGame,
  initializeChineseWhispersGame,
  updateChineseWhispersGame,
  initializeTriviaGame,
  updateTriviaGame,
  initializeMysteryCase,
  updateMysteryCase,
  updateTurn,
  updateScore
} = gameSlice.actions;

export default gameSlice.reducer;
