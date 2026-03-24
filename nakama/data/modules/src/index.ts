import { LEADERBOARD_ID } from './utils/constants';
import {
  handleMatchInit,
  handleMatchJoinAttempt,
  handleMatchJoin,
  handleMatchLeave,
  handleMatchLoop,
  handleMatchTerminate,
  handleMatchSignal
} from './match_handler';
import { createMatchRPC } from './rpc/create_match';
import { findMatchRPC } from './rpc/find_match';
import { getLeaderboardRPC } from './rpc/get_leaderboard';
import { getPlayerStatsRPC } from './rpc/get_player_stats';

function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  logger.info('Tic-Tac-Toe server module initialized');

  try {
    nk.leaderboardCreate(LEADERBOARD_ID, true, 'desc', 'best', '0 0 * * 1');
    logger.info('Leaderboard created: %s', LEADERBOARD_ID);
  } catch (e) {
    logger.info('Leaderboard already exists: %s', LEADERBOARD_ID);
  }

  initializer.registerRpc('create_match', createMatchRPC);
  initializer.registerRpc('find_match', findMatchRPC);
  initializer.registerRpc('get_leaderboard', getLeaderboardRPC);
  initializer.registerRpc('get_player_stats', getPlayerStatsRPC);
  logger.info('RPC endpoints registered');

  initializer.registerMatch('tictactoe', {
    matchInit: handleMatchInit,
    matchJoinAttempt: handleMatchJoinAttempt,
    matchJoin: handleMatchJoin,
    matchLeave: handleMatchLeave,
    matchLoop: handleMatchLoop,
    matchTerminate: handleMatchTerminate,
    matchSignal: handleMatchSignal
  });
  logger.info('Match handler registered: tictactoe');
}

(globalThis as any).InitModule = InitModule;
