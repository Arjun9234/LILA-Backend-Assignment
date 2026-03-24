export function createMatchRPC(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  try {
    const { mode } = JSON.parse(payload) as { mode: 'classic' | 'timed' };

    const matchId = nk.matchCreate('tictactoe', { gameMode: mode });

    logger.info('Match created: %s (mode: %s)', matchId, mode);

    return JSON.stringify({ matchId });
  } catch (error) {
    logger.error('Failed to create match: %v', error);
    throw error;
  }
}
