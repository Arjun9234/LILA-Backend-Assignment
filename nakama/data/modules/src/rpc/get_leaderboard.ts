import { LEADERBOARD_ID, COLLECTION_PLAYER_STATS } from '../utils/constants';

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

export function getLeaderboardRPC(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  try {
    const { limit } = JSON.parse(payload || '{}') as { limit?: number };
    const actualLimit = Math.min(limit || 100, 100);

    const records = nk.leaderboardRecordsList(LEADERBOARD_ID, undefined, actualLimit);

    const leaderboard: LeaderboardEntry[] = records.records.map((record, index) => {
      const ownerId = record.ownerId;

      // Validate ownerId before reading storage
      if (!ownerId || typeof ownerId !== 'string' || ownerId.length === 0) {
        logger.warn('Invalid ownerId in leaderboard record: %v', ownerId);
        return {
          rank: record.rank || (index + 1),
          score: record.score,
          userId: ownerId || '',
          username: record.username || 'Player',
          wins: 0,
          losses: 0,
          draws: 0,
          winStreak: 0
        };
      }

      const statsObjects = nk.storageRead([{
        collection: COLLECTION_PLAYER_STATS,
        key: 'stats',
        userId: ownerId
      }]);

      // Nakama returns value as already-parsed object
      const stats = statsObjects.length > 0
        ? statsObjects[0].value as { wins?: number; losses?: number; draws?: number; winStreak?: number }
        : { wins: 0, losses: 0, draws: 0, winStreak: 0 };

      return {
        rank: record.rank || (index + 1),
        score: record.score,
        userId: record.ownerId,
        username: record.username || 'Player',
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        draws: stats.draws || 0,
        winStreak: stats.winStreak || 0
      };
    });

    return JSON.stringify({ leaderboard });
  } catch (error) {
    logger.error('Failed to get leaderboard: %v', error);
    throw error;
  }
}
