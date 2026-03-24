// OpCodes for match communication
export enum OpCode {
  MAKE_MOVE = 1,
  GAME_UPDATE = 2,
  GAME_OVER = 3,
  PLAYER_JOINED = 4,
  PLAYER_LEFT = 5,
  TURN_TIMEOUT = 6,
}

// Storage collections
export const COLLECTION_PLAYER_STATS = 'player_stats';
export const COLLECTION_MATCHMAKING = 'matchmaking';

// Leaderboard
export const LEADERBOARD_ID = 'tictactoe_global';

// Game configuration
export const TURN_TIME_LIMIT_MS = 30000;  // 30 seconds
export const DISCONNECT_GRACE_PERIOD_MS = 15000;  // 15 seconds
export const MATCHMAKING_QUEUE_EXPIRY_MS = 300000;  // 5 minutes
export const MAX_PLAYERS = 2;

// Match tick rate
export const MATCH_TICK_RATE = 1;  // 1 tick per second

// Score calculation (must be >= 0 for Nakama leaderboard)
export const SCORE_WIN = 3;
export const SCORE_DRAW = 1;
export const SCORE_LOSS = 0;
