import { COLLECTION_PLAYER_STATS, LEADERBOARD_ID, SCORE_WIN, SCORE_DRAW, SCORE_LOSS } from '../utils/constants';

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  score: number;
  lastUpdated: number;
}

export function updatePlayerStats(
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  userId: string,
  result: 'win' | 'loss' | 'draw',
  username?: string
): void {
  try {
    // Read existing stats
    const objects = nk.storageRead([{
      collection: COLLECTION_PLAYER_STATS,
      key: 'stats',
      userId: userId
    }]);

    let stats: PlayerStats;
    if (objects.length > 0) {
      // Nakama returns value as already-parsed object
      stats = objects[0].value as PlayerStats;
    } else {
      stats = { wins: 0, losses: 0, draws: 0, winStreak: 0, score: 0, lastUpdated: 0 };
    }

    // Update stats based on result
    if (result === 'win') {
      stats.wins++;
      stats.winStreak++;
    } else if (result === 'loss') {
      stats.losses++;
      stats.winStreak = 0;
    } else {
      stats.draws++;
    }

    // Calculate score
    stats.score = (stats.wins * SCORE_WIN) + (stats.draws * SCORE_DRAW) + (stats.losses * SCORE_LOSS);
    stats.lastUpdated = Date.now();

    // Write stats to storage - Nakama expects JS object
    nk.storageWrite([{
      collection: COLLECTION_PLAYER_STATS,
      key: 'stats',
      userId: userId,
      value: stats,  // Pass object directly, Nakama handles serialization
      permissionRead: 2,
      permissionWrite: 0
    }]);

    logger.info('Storage write successful for user %s', userId);

    // Update leaderboard with username
    try {
      nk.leaderboardRecordWrite(LEADERBOARD_ID, userId, username || userId, stats.score, 0);
      logger.info('Leaderboard updated for user %s with score %d', userId, stats.score);
    } catch (lbError) {
      logger.error('Failed to update leaderboard for %s: %v', userId, lbError);
      throw lbError;
    }

    logger.info('Updated stats for user %s: %s (wins: %d, losses: %d, draws: %d, score: %d)',
      userId, result, stats.wins, stats.losses, stats.draws, stats.score);
  } catch (error) {
    logger.error('Failed to update player stats for %s: %v', userId, error);
    throw error;
  }
}

export function getPlayerStats(
  nk: nkruntime.Nakama,
  userId: string
): PlayerStats | null {
  try {
    const objects = nk.storageRead([{
      collection: COLLECTION_PLAYER_STATS,
      key: 'stats',
      userId: userId
    }]);

    if (objects.length === 0) {
      return null;
    }

    // Nakama returns value as already-parsed object
    return objects[0].value as PlayerStats;
  } catch (error) {
    return null;
  }
}
