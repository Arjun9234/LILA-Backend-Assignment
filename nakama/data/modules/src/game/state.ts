export interface PlayerInfo {
  userId: string;
  username: string;
  sessionId: string;
  symbol: 'X' | 'O';
}

export interface MatchState {
  board: Array<string | null>;
  currentTurn: string;
  players: Record<string, PlayerInfo>;
  winner: string | null;
  isDraw: boolean;
  gameMode: 'classic' | 'timed';
  turnTimeLimit?: number;
  status: 'waiting' | 'playing' | 'finished';
  turnStartTime?: number;
  moveCount: number;
  disconnectedPlayers: string[];
}

export interface GameStateForClient {
  board: Array<string | null>;
  currentTurn: string;
  players: PlayerInfo[];
  winner: string | null;
  isDraw: boolean;
  gameMode: 'classic' | 'timed';
  turnTimeLimit?: number;
  status: 'waiting' | 'playing' | 'finished';
  turnStartTime?: number;
}

export function serializeStateForClient(state: MatchState): GameStateForClient {
  return {
    board: state.board,
    currentTurn: state.currentTurn,
    players: Object.values(state.players),
    winner: state.winner,
    isDraw: state.isDraw,
    gameMode: state.gameMode,
    turnTimeLimit: state.turnTimeLimit,
    status: state.status,
    turnStartTime: state.turnStartTime,
  };
}
