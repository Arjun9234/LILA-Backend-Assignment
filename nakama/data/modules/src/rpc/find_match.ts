import { COLLECTION_MATCHMAKING, MATCHMAKING_QUEUE_EXPIRY_MS } from '../utils/constants';

const MATCHMAKING_QUEUE_OWNER_ID = '00000000-0000-0000-0000-000000000000';

interface QueueEntry {
  matchId: string;
  createdBy?: string;
  timestamp: number;
}

function parseQueueEntry(rawValue: unknown): QueueEntry | null {
  let data: unknown = rawValue;

  if (typeof rawValue === 'string') {
    try {
      data = JSON.parse(rawValue);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as { [key: string]: unknown };
  const matchId = typeof obj.matchId === 'string' ? obj.matchId : null;
  const timestamp = typeof obj.timestamp === 'number'
    ? obj.timestamp
    : (typeof obj.timestamp === 'string' ? Number(obj.timestamp) : NaN);
  const createdBy = typeof obj.createdBy === 'string' ? obj.createdBy : undefined;

  if (!matchId || !Number.isFinite(timestamp)) {
    return null;
  }

  return {
    matchId,
    createdBy,
    timestamp
  };
}

export function findMatchRPC(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  try {
    const { mode } = JSON.parse(payload) as { mode: 'classic' | 'timed' };
    const userId = ctx.userId;

    // Validate userId is a non-empty string
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      logger.error('Invalid userId in findMatch: %v', userId);
      throw new Error('Invalid userId');
    }

    const queueKey = `matchmaking_queue_${mode}`;

    const objects = nk.storageRead([{
      collection: COLLECTION_MATCHMAKING,
      key: queueKey,
      userId: MATCHMAKING_QUEUE_OWNER_ID
    }]);

    if (objects.length > 0) {
      const rawValue = objects[0].value as unknown;
      const queueData = parseQueueEntry(rawValue);

      if (!queueData) {
        nk.storageDelete([{
          collection: COLLECTION_MATCHMAKING,
          key: queueKey,
          userId: MATCHMAKING_QUEUE_OWNER_ID
        }]);
        logger.warn('Removed invalid queue entry for mode %s', mode);
      } else {
        const matchId = queueData.matchId;
        const timestamp = queueData.timestamp;

        if (Date.now() - timestamp < MATCHMAKING_QUEUE_EXPIRY_MS) {
          if (queueData.createdBy === userId) {
            logger.info('Player %s reusing own queued match %s', userId, matchId);
            return JSON.stringify({ matchId });
          }

          nk.storageDelete([{
            collection: COLLECTION_MATCHMAKING,
            key: queueKey,
            userId: MATCHMAKING_QUEUE_OWNER_ID
          }]);

          logger.info('Player %s joined match %s from queue', userId, matchId);
          return JSON.stringify({ matchId });
        } else {
          nk.storageDelete([{
            collection: COLLECTION_MATCHMAKING,
            key: queueKey,
            userId: MATCHMAKING_QUEUE_OWNER_ID
          }]);
          logger.info('Removed stale queue entry for mode %s', mode);
        }
      }
    }

    const matchId = nk.matchCreate('tictactoe', { gameMode: mode });

    nk.storageWrite([{
      collection: COLLECTION_MATCHMAKING,
      key: queueKey,
      userId: MATCHMAKING_QUEUE_OWNER_ID,
      value: {
        matchId,
        createdBy: userId,
        timestamp: Date.now()
      },
      permissionRead: 1,
      permissionWrite: 0
    }]);

    logger.info('Player %s created match %s and added to queue', userId, matchId);
    return JSON.stringify({ matchId });
  } catch (error) {
    logger.error('Failed to find match: %v', error);
    throw error;
  }
}
