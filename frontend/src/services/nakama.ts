import { Client, Session, Socket, Match } from '@heroiclabs/nakama-js';

export interface PlayerInfo {
  userId: string;
  username: string;
  symbol: 'X' | 'O';
}

export interface GameState {
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

export interface LeaderboardEntry {
  rank: number;
  score: number;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
}

export interface PlayerStats {
  rank: number | null;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalGames: number;
}

export enum OpCode {
  MAKE_MOVE = 1,
  GAME_UPDATE = 2,
  GAME_OVER = 3,
  PLAYER_JOINED = 4,
  PLAYER_LEFT = 5,
  TURN_TIMEOUT = 6,
}

class NakamaService {
  private client: Client | null = null;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private currentMatch: Match | null = null;
  private matchDataCallback: ((data: any) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;
  private errorCallback: ((error: any) => void) | null = null;

  private parseRpcPayload<T>(payload: unknown): T {
    if (typeof payload === 'string') {
      return JSON.parse(payload) as T;
    }

    return payload as T;
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(String((error as { message: unknown }).message));
    }

    return new Error('Unknown error');
  }

  // Configuration - Update these for your deployment
  private readonly SERVER_KEY = 'defaultserverkey';
  private readonly HOST = import.meta.env.VITE_NAKAMA_HOST || 'localhost';
  private readonly PORT = import.meta.env.VITE_NAKAMA_PORT || '7350';
  private readonly USE_SSL = import.meta.env.VITE_NAKAMA_SSL === 'true';

  async initialize(): Promise<void> {
    this.client = new Client(this.SERVER_KEY, this.HOST, this.PORT, this.USE_SSL);
  }

  async authenticateDevice(deviceId: string, username?: string): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      this.session = await this.client.authenticateDevice(deviceId, true, username);
      console.log('Authenticated:', this.session);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async updateAccount(displayName: string): Promise<void> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      // Only update display_name, don't touch username (already auto-generated and unique)
      await this.client.updateAccount(this.session, {
        display_name: displayName,
      });
      console.log('Account updated with display name:', displayName);
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  }

  async getAccount(): Promise<{ username: string; displayName: string } | null> {
    if (!this.client || !this.session) return null;

    try {
      const account = await this.client.getAccount(this.session);
      return {
        username: account.user?.username || '',
        displayName: account.user?.display_name || account.user?.username || '',
      };
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async connectSocket(): Promise<void> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      this.socket = this.client.createSocket(this.USE_SSL, false);
      await this.socket.connect(this.session, false);
      this.bindSocketCallbacks();
      console.log('Socket connected');
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    }
  }

  private bindSocketCallbacks(): void {
    if (!this.socket) return;

    this.socket.onmatchdata = (matchData) => {
      const data = JSON.parse(new TextDecoder().decode(matchData.data));
      this.matchDataCallback?.({ ...data, opCode: matchData.op_code });
    };

    this.socket.ondisconnect = () => {
      this.disconnectCallback?.();
    };

    this.socket.onerror = (error) => {
      this.errorCallback?.(error);
    };
  }

  private async reconnectSocket(): Promise<void> {
    if (!this.client || !this.session) {
      throw new Error('Not authenticated');
    }

    try {
      if (this.socket) {
        this.socket.disconnect(false);
      }
    } catch (_e) {
      // Best-effort disconnect before reconnecting.
    }

    this.socket = this.client.createSocket(this.USE_SSL, false);
    await this.socket.connect(this.session, false);
    this.bindSocketCallbacks();
  }

  async createMatch(gameMode: 'classic' | 'timed' = 'classic'): Promise<string> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      const response = await this.client.rpc(
        this.session,
        'create_match',
        { mode: gameMode }
      );

      const data = this.parseRpcPayload<{ matchId?: string }>(response.payload);
      if (!data?.matchId) {
        throw new Error('Invalid response from create_match RPC');
      }
      return data.matchId;
    } catch (error) {
      console.error('Failed to create match:', error);
      throw this.toError(error);
    }
  }

  async findMatch(gameMode: 'classic' | 'timed' = 'classic'): Promise<string> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      const response = await this.client.rpc(
        this.session,
        'find_match',
        { mode: gameMode }
      );

      const data = this.parseRpcPayload<{ matchId?: string }>(response.payload);
      if (!data?.matchId) {
        throw new Error('Invalid response from find_match RPC');
      }
      return data.matchId;
    } catch (error) {
      console.error('Failed to find match:', error);
      throw this.toError(error);
    }
  }

  async joinMatch(matchId: string): Promise<Match> {
    if (!this.socket) {
      await this.connectSocket();
    }

    try {
      const match = await this.socket!.joinMatch(matchId);
      this.currentMatch = match;
      console.log('Joined match:', match);
      return match;
    } catch (error) {
      const message = String((error as { message?: unknown })?.message ?? error ?? '');
      const shouldRetry = message.toLowerCase().includes('timed out')
        || message.toLowerCase().includes('socket')
        || message.toLowerCase().includes('closed');

      if (shouldRetry) {
        console.warn('joinMatch failed, reconnecting socket and retrying once:', message);
        await this.reconnectSocket();
        const retryMatch = await this.socket!.joinMatch(matchId);
        this.currentMatch = retryMatch;
        console.log('Joined match after reconnect:', retryMatch);
        return retryMatch;
      }

      console.error('Failed to join match:', error);
      throw error;
    }
  }

  async leaveMatch(): Promise<void> {
    if (!this.socket || !this.currentMatch) return;

    try {
      await this.socket.leaveMatch(this.currentMatch.match_id);
      this.currentMatch = null;
      console.log('Left match');
    } catch (error) {
      console.error('Failed to leave match:', error);
    }
  }

  async makeMove(position: number): Promise<void> {
    if (!this.socket || !this.currentMatch) throw new Error('Not in a match');

    try {
      await this.socket.sendMatchState(
        this.currentMatch.match_id,
        OpCode.MAKE_MOVE,
        JSON.stringify({ position })
      );
    } catch (error) {
      console.error('Failed to make move:', error);
      throw error;
    }
  }

  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      const response = await this.client.rpc(
        this.session,
        'get_leaderboard',
        { limit }
      );

      const data = this.parseRpcPayload<{ leaderboard?: LeaderboardEntry[] }>(response.payload);
      if (!Array.isArray(data?.leaderboard)) {
        throw new Error('Invalid response from get_leaderboard RPC');
      }
      return data.leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw this.toError(error);
    }
  }

  async getPlayerStats(): Promise<PlayerStats> {
    if (!this.client || !this.session) throw new Error('Not authenticated');

    try {
      const response = await this.client.rpc(this.session, 'get_player_stats', {});
      const data = this.parseRpcPayload<PlayerStats>(response.payload);
      return data;
    } catch (error) {
      console.error('Failed to get player stats:', error);
      throw this.toError(error);
    }
  }

  onMatchData(callback: (data: any) => void): void {
    this.matchDataCallback = callback;
    this.bindSocketCallbacks();
  }

  onMatchPresence(callback: (presence: any) => void): void {
    if (!this.socket) return;

    this.socket.onmatchpresence = (presence) => {
      callback(presence);
    };
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
    this.bindSocketCallbacks();
  }

  onError(callback: (error: any) => void): void {
    this.errorCallback = callback;
    this.bindSocketCallbacks();
  }

  getCurrentUserId(): string | undefined {
    return this.session?.user_id;
  }

  getCurrentUsername(): string | undefined {
    return this.session?.username;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect(true);
      this.socket = null;
    }
    this.session = null;
    this.currentMatch = null;
  }
}

export const nakamaService = new NakamaService();
