import { OpCode, MAX_PLAYERS, MATCH_TICK_RATE, TURN_TIME_LIMIT_MS } from './utils/constants';
import { MatchState, PlayerInfo, serializeStateForClient } from './game/state';
import { checkWinner, isDraw, isValidMove } from './game/tic_tac_toe';
import { TurnTimer } from './game/timer';
import { updatePlayerStats } from './storage/stats';

export function handleMatchInit(
  ctx,
  logger,
  nk,
  params
) {
  const gameMode = (params.gameMode || 'classic') as 'classic' | 'timed';

  const state: MatchState = {
    board: Array(9).fill(null),
    currentTurn: '',
    players: {},
    winner: null,
    isDraw: false,
    gameMode: gameMode,
    turnTimeLimit: gameMode === 'timed' ? TURN_TIME_LIMIT_MS : undefined,
    status: 'waiting',
    turnStartTime: undefined,
    moveCount: 0,
    disconnectedPlayers: []
  };

  logger.info('Match initialized: %s (mode: %s)', ctx.matchId, gameMode);

  return {
    state: state,
    tickRate: MATCH_TICK_RATE,
    label: JSON.stringify({ gameMode })
  };
}

export function handleMatchJoinAttempt(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  presence,
  metadata
) {
  const playerCount = Object.keys(state.players).length;
  if (playerCount >= MAX_PLAYERS) {
    return {
      state: state,
      accept: false,
      rejectMessage: 'Match is full'
    };
  }

  if (state.status === 'finished') {
    return {
      state: state,
      accept: false,
      rejectMessage: 'Match has ended'
    };
  }

  logger.info('Player %s attempting to join match %s', presence.userId, ctx.matchId);

  return {
    state: state,
    accept: true
  };
}

export function handleMatchJoin(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  presences
) {
  const players = Object.values(state.players);
  for (const presence of presences) {
    const symbol: 'X' | 'O' = players.length === 0 ? 'X' : 'O';

    // Fetch display name from account
    let displayName = presence.username || 'Player';
    try {
      const account = nk.accountGetId(presence.userId);
      if (account?.user?.displayName) {
        displayName = account.user.displayName;
      }
    } catch (e) {
      logger.warn('Failed to get account for user %s: %v', presence.userId, e);
    }

    const player: PlayerInfo = {
      userId: presence.userId,
      username: displayName,
      sessionId: presence.sessionId,
      symbol: symbol
    };

    state.players[presence.sessionId] = player;
    players.push(player);

    dispatcher.broadcastMessage(
      OpCode.PLAYER_JOINED,
      JSON.stringify({ player }),
      null,
      null
    );

    logger.info('Player %s joined as %s', presence.userId, symbol);
  }

  if (players.length === MAX_PLAYERS && state.status === 'waiting') {
    state.status = 'playing';

    const firstPlayer = players.find(p => p.symbol === 'X');
    if (firstPlayer) {
      state.currentTurn = firstPlayer.userId;
      state.turnStartTime = Date.now();
    }

    const clientState = serializeStateForClient(state);
    dispatcher.broadcastMessage(
      OpCode.GAME_UPDATE,
      JSON.stringify({ type: 'game_start', state: clientState }),
      null,
      null
    );

    logger.info('Game started in match %s', ctx.matchId);
  }

  return { state };
}

export function handleMatchLeave(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  presences
) {
  for (const presence of presences) {
    const player = state.players[presence.sessionId];
    if (!player) continue;

    delete state.players[presence.sessionId];

    dispatcher.broadcastMessage(
      OpCode.PLAYER_LEFT,
      JSON.stringify({ userId: player.userId, username: player.username }),
      null,
      null
    );

    logger.info('Player %s left match %s', presence.userId, ctx.matchId);

    const remainingPlayers = Object.values(state.players);
    if (state.status === 'playing' && remainingPlayers.length === 1) {
      const remainingPlayer = remainingPlayers[0];

      state.winner = remainingPlayer.userId;
      state.status = 'finished';

      updatePlayerStats(nk, logger, remainingPlayer.userId, 'win', remainingPlayer.username);
      updatePlayerStats(nk, logger, player.userId, 'loss', player.username);

      dispatcher.broadcastMessage(
        OpCode.GAME_OVER,
        JSON.stringify({
          winner: remainingPlayer.userId,
          isDraw: false,
          reason: 'opponent_left',
          board: state.board
        }),
        null,
        null
      );

      logger.info('Game over in match %s - opponent left', ctx.matchId);
    }
  }

  return { state };
}

export function handleMatchLoop(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  messages
) {
  if (state.status === 'finished') {
    return { state };
  }

  if (state.status === 'playing' && state.gameMode === 'timed' && state.turnStartTime) {
    const now = Date.now();
    if (TurnTimer.hasTimedOut(state.turnStartTime, now)) {
      const players = Object.values(state.players);
      const currentPlayer = players.find(p => p.userId === state.currentTurn);
      const otherPlayer = players.find(p => p.userId !== state.currentTurn);

      if (currentPlayer && otherPlayer) {
        state.winner = otherPlayer.userId;
        state.status = 'finished';

        updatePlayerStats(nk, logger, otherPlayer.userId, 'win', otherPlayer.username);
        updatePlayerStats(nk, logger, currentPlayer.userId, 'loss', currentPlayer.username);

        dispatcher.broadcastMessage(
          OpCode.TURN_TIMEOUT,
          JSON.stringify({
            player: currentPlayer.userId,
            winner: otherPlayer.userId
          }),
          null,
          null
        );

        dispatcher.broadcastMessage(
          OpCode.GAME_OVER,
          JSON.stringify({
            winner: otherPlayer.userId,
            isDraw: false,
            reason: 'timeout',
            board: state.board
          }),
          null,
          null
        );

        logger.info('Game over in match %s - turn timeout', ctx.matchId);
      }
    }
  }

  for (const message of messages) {
    if (message.opCode === OpCode.MAKE_MOVE) {
      handleMakeMove(ctx, logger, nk, dispatcher, state, message);
    }
  }

  return { state };
}

function handleMakeMove(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  message: nkruntime.MatchMessage
): void {
  if (state.status !== 'playing') {
    return;
  }

  const data = parseMovePayload(message.data);
  if (!data) {
    logger.warn('Failed to parse move payload');
    return;
  }
  const position = data.position;
  const playerId = message.sender.userId;

  const validation = isValidMove(state.board, position, state.currentTurn, playerId);

  if (!validation.valid) {
    dispatcher.broadcastMessage(
      OpCode.GAME_UPDATE,
      JSON.stringify({ error: validation.error }),
      [message.sender],
      null
    );
    logger.warn('Invalid move from %s: %s', playerId, validation.error);
    return;
  }

  const players = Object.values(state.players);
  const player = players.find(p => p.userId === playerId);
  if (!player) return;

  state.board[position] = player.symbol;
  state.moveCount++;

  const winner = checkWinner(state.board);
  const draw = isDraw(state.board, state.moveCount);

  if (winner || draw) {
    state.status = 'finished';
    state.winner = winner;
    state.isDraw = draw;

    if (winner) {
      const winnerPlayer = players.find(p => p.symbol === winner);
      const loserPlayer = players.find(p => p.symbol !== winner);

      if (winnerPlayer && loserPlayer) {
        updatePlayerStats(nk, logger, winnerPlayer.userId, 'win', winnerPlayer.username);
        updatePlayerStats(nk, logger, loserPlayer.userId, 'loss', loserPlayer.username);
      }
    } else if (draw) {
      for (const p of players) {
        updatePlayerStats(nk, logger, p.userId, 'draw', p.username);
      }
    }

    dispatcher.broadcastMessage(
      OpCode.GAME_OVER,
      JSON.stringify({
        winner: winner ? players.find(p => p.symbol === winner)?.userId : null,
        isDraw: draw,
        board: state.board
      }),
      null,
      null
    );

    logger.info('Game over in match %s - %s', ctx.matchId, draw ? 'draw' : `winner: ${winner}`);
  } else {
    const otherPlayer = players.find(p => p.userId !== playerId);
    if (otherPlayer) {
      state.currentTurn = otherPlayer.userId;
      state.turnStartTime = Date.now();
    }

    dispatcher.broadcastMessage(
      OpCode.GAME_UPDATE,
      JSON.stringify({
        type: 'move_made',
        board: state.board,
        currentTurn: state.currentTurn,
        turnStartTime: state.turnStartTime
      }),
      null,
      null
    );

    logger.info('Move made at position %d by %s', position, playerId);
  }
}

function parseMovePayload(raw: unknown): { position: number } | null {
  if (!raw) return null;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { position: raw };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) {
      return { position: Number(trimmed) };
    }
    try {
      return JSON.parse(raw) as { position: number };
    } catch {
      return null;
    }
  }

  if (typeof raw === 'object' && 'position' in (raw as Record<string, unknown>)) {
    const position = (raw as { position: unknown }).position;
    if (typeof position === 'number' && Number.isFinite(position)) {
      return { position };
    }
    if (typeof position === 'string' && /^\d+$/.test(position.trim())) {
      return { position: Number(position) };
    }
    return null;
  }

  // Nakama may provide binary payloads as typed arrays or array-like objects.
  const bytes = toByteArray(raw as Record<string, unknown>);
  if (bytes.length === 0) {
    return null;
  }

  if (bytes.length === 1) {
    return { position: bytes[0] };
  }

  const asText = bytesToString(bytes).trim();
  if (/^\d+$/.test(asText)) {
    return { position: Number(asText) };
  }

  try {
    return JSON.parse(asText) as { position: number };
  } catch {
    return null;
  }
}

function toByteArray(raw: Record<string, unknown>): number[] {
  const result: number[] = [];

  if (!raw) return result;

  const rawAny = raw as {
    length?: unknown;
    byteLength?: unknown;
    byteOffset?: unknown;
    buffer?: unknown;
    slice?: unknown;
    [key: number]: unknown;
    [key: string]: unknown;
  };

  // Handle ArrayBuffer-like payloads.
  if (
    typeof rawAny.byteLength === 'number' &&
    typeof rawAny.length !== 'number' &&
    typeof rawAny.slice === 'function'
  ) {
    const view = new Uint8Array(raw as unknown as ArrayBuffer);
    for (let i = 0; i < view.length; i++) {
      result.push(view[i]);
    }
    if (result.length > 0) return result;
  }

  // Handle typed-array-like payloads.
  if (
    rawAny.buffer &&
    typeof rawAny.byteOffset === 'number' &&
    typeof rawAny.byteLength === 'number'
  ) {
    const view = new Uint8Array(rawAny.buffer as ArrayBuffer, rawAny.byteOffset, rawAny.byteLength);
    for (let i = 0; i < view.length; i++) {
      result.push(view[i]);
    }
    if (result.length > 0) return result;
  }

  const maybeLength = rawAny.length;
  if (typeof maybeLength === 'number') {
    for (let i = 0; i < maybeLength; i++) {
      const v = rawAny[i];
      if (typeof v === 'number') {
        result.push(v);
      }
    }
    if (result.length > 0) return result;
  }

  for (const key in rawAny) {
    const v = rawAny[key];
    if (typeof v === 'number') {
      result.push(v);
    }
  }

  return result;
}

function bytesToString(data: Uint8Array): string {
  // JSON payloads contain ASCII characters, so byte-to-char conversion is sufficient.
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data[i]);
  }
  return result;
}

export function handleMatchTerminate(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  graceSeconds
) {
  logger.info('Match terminated: %s', ctx.matchId);
  return { state };
}

export function handleMatchSignal(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state: MatchState,
  data
) {
  logger.info('Match signal received: %s', data);
  return { state };
}
