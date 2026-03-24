import { LEADERBOARD_ID, COLLECTION_PLAYER_STATS } from '../utils/constants';

export interface PlayerStats {
  rank: number | null;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalGames: number;
}

export function getPlayerStatsRPC(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  try {
    const userId = ctx.userId;

    // Validate userId is a non-empty string
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      logger.warn('Invalid userId in getPlayerStats: %v', userId);
      return JSON.stringify({
        rank: null,
        score: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        totalGames: 0
      });
    }

    const objects = nk.storageRead([{
      collection: COLLECTION_PLAYER_STATS,
      key: 'stats',
      userId: userId
    }]);

    if (objects.length === 0) {
      return JSON.stringify({
        rank: null,
        score: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        totalGames: 0
      });
    }

    // Nakama returns value as already-parsed object
    const stats = objects[0].value as { score?: number; wins?: number; losses?: number; draws?: number; winStreak?: number };

    const records = nk.leaderboardRecordsList(LEADERBOARD_ID, [userId], 1);
    const rank = records.records.length > 0 ? records.records[0].rank : null;

    const result: PlayerStats = {
      rank: rank,
      score: stats.score || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      draws: stats.draws || 0,
      winStreak: stats.winStreak || 0,
      totalGames: (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0)
    };

    return JSON.stringify(result);
  } catch (error) {
    logger.error('Failed to get player stats: %v', error);
    throw error;
  }
}
