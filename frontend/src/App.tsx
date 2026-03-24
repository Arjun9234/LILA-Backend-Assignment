import { useEffect, useState, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import PlayerStatsCard from './components/PlayerStatsCard';
import { useTheme } from './contexts/ThemeContext';
import { nakamaService, GameState, LeaderboardEntry, PlayerStats, OpCode, PlayerInfo } from './services/nakama';

type GameMode = 'classic' | 'timed';
type Screen = 'nickname' | 'menu' | 'matchmaking' | 'game' | 'game-over';

// Theme Toggle Component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle bg-white/10 dark:bg-dark-600 hover:bg-white/20 dark:hover:bg-dark-500 backdrop-blur-sm border border-white/20 dark:border-purple-500/30"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

function App() {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<Screen>('nickname');
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');

  // Nickname
  const [nickname, setNickname] = useState<string>('');
  const [nicknameInput, setNicknameInput] = useState<string>('');
  const [isSettingNickname, setIsSettingNickname] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);

  // Stats and leaderboard
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Game over state
  const [gameOverMessage, setGameOverMessage] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  // Clear nickname input on page load to always ask for it
  // But keep deviceId mapping so returning users get their same account
  useEffect(() => {
    // Disconnect any existing connection first
    nakamaService.disconnect();

    // Only clear the nickname input, NOT the device mappings
    localStorage.removeItem('playerNickname');

    // Reset UI state
    setPlayerStats(null);
    setLeaderboard([]);
    setIsConnected(false);
  }, []);

  // Auto-refresh stats interval
  useEffect(() => {
    if (isConnected && screen === 'menu') {
      const interval = setInterval(() => {
        loadPlayerStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, screen]);

  // Timer countdown effect
  useEffect(() => {
    if (
      gameState?.gameMode === 'timed' &&
      gameState?.status === 'playing' &&
      gameState?.turnStartTime &&
      gameState?.turnTimeLimit
    ) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - gameState.turnStartTime!) / 1000;
        const turnLimitSeconds = gameState.turnTimeLimit! / 1000;
        const remaining = Math.max(0, Math.ceil(turnLimitSeconds - elapsed));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(undefined);
    }
  }, [gameState?.turnStartTime, gameState?.gameMode, gameState?.status]);

  async function initializeConnection(playerName?: string) {
    setIsInitializing(true);
    setError('');

    try {
      await nakamaService.initialize();

      // Use nickname-based deviceId so same nickname = same account
      // This allows returning users to get their existing stats
      let deviceId: string;
      if (playerName) {
        // Create a consistent deviceId based on the nickname
        deviceId = 'player-' + playerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      } else {
        // Fallback to random deviceId if no name provided
        deviceId = localStorage.getItem('deviceId') || generateDeviceId();
        localStorage.setItem('deviceId', deviceId);
      }

      await nakamaService.authenticateDevice(deviceId);

      // Set display_name for proper display in game
      if (playerName) {
        await nakamaService.updateAccount(playerName);
      }

      await nakamaService.connectSocket();

      setupSocketListeners();
      await loadPlayerStats();

      setIsConnected(true);
      if (playerName) {
        setScreen('menu');
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(`Failed to connect: ${err.message}. Make sure Nakama server is running.`);
    } finally {
      setIsInitializing(false);
    }
  }

  async function handleSetNickname() {
    if (!nicknameInput.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (nicknameInput.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (nicknameInput.length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }

    setIsSettingNickname(true);
    setError('');

    try {
      const trimmedNickname = nicknameInput.trim();

      if (!isConnected) {
        await initializeConnection(trimmedNickname);
      } else {
        await nakamaService.updateAccount(trimmedNickname);
      }

      // Don't save nickname to localStorage - ask every time
      // localStorage.setItem('playerNickname', trimmedNickname);
      setNickname(trimmedNickname);
      setScreen('menu');
    } catch (err: any) {
      console.error('Failed to set nickname:', err);
      setError('Failed to set nickname. Please try again.');
    } finally {
      setIsSettingNickname(false);
    }
  }

  function generateDeviceId(): string {
    return 'device-' + Math.random().toString(36).substring(2, 15);
  }

  function setupSocketListeners() {
    nakamaService.onMatchData((data) => {
      console.log('Match data:', data);

      switch (data.opCode) {
        case OpCode.GAME_UPDATE:
          handleGameUpdate(data);
          break;
        case OpCode.GAME_OVER:
          handleGameOver(data);
          break;
        case OpCode.PLAYER_JOINED:
          handlePlayerJoined(data);
          break;
        case OpCode.PLAYER_LEFT:
          handlePlayerLeft(data);
          break;
      }
    });

    nakamaService.onDisconnect(() => {
      setIsConnected(false);
      setError('Disconnected from server');
    });

    nakamaService.onError((err) => {
      console.error('Socket error:', err);
      setError('Connection error occurred');
    });
  }

  function handleGameUpdate(data: any) {
    if (data.type === 'game_start') {
      const state = data.state;
      setGameState(state);
      setPlayers(state.players);

      const myUserId = nakamaService.getCurrentUserId();
      const myPlayer = state.players.find((p: PlayerInfo) => p.userId === myUserId);
      if (myPlayer) {
        setMySymbol(myPlayer.symbol);
      }

      setScreen('game');
    } else if (data.type === 'move_made') {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn,
          turnStartTime: data.turnStartTime,
        };
      });
    }
  }

  async function handleGameOver(data: any) {
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'finished',
        winner: data.winner || null,
        isDraw: data.isDraw || false,
        board: data.board || prev.board,
      };
    });

    const myUserId = nakamaService.getCurrentUserId();
    let message = '';

    if (data.isDraw) {
      message = "It's a draw!";
    } else if (data.winner === myUserId) {
      message = 'You won!';
    } else {
      message = 'You lost!';
    }

    if (data.reason === 'opponent_left') {
      message += ' (Opponent left)';
    } else if (data.reason === 'timeout') {
      message += ' (Timeout)';
    }

    setGameOverMessage(message);
    setScreen('game-over');

    // Immediately refresh stats and leaderboard after game ends
    setIsLoadingStats(true);
    try {
      const [stats, leaderboardData] = await Promise.all([
        nakamaService.getPlayerStats(),
        nakamaService.getLeaderboard(100),
      ]);
      setPlayerStats(stats);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Failed to refresh data after game:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }

  function handlePlayerJoined(data: any) {
    console.log('Player joined:', data.player);
    setPlayers((prev) => [...prev, data.player]);
  }

  function handlePlayerLeft(data: any) {
    console.log('Player left:', data.userId);
    setPlayers((prev) => prev.filter((p) => p.userId !== data.userId));
  }

  const loadPlayerStats = useCallback(async () => {
    try {
      const stats = await nakamaService.getPlayerStats();
      setPlayerStats(stats);
    } catch (err) {
      console.error('Failed to load player stats:', err);
    }
  }, []);

  async function loadLeaderboard() {
    try {
      const data = await nakamaService.getLeaderboard(100);
      setLeaderboard(data);
      setShowLeaderboard(true);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      alert('Failed to load leaderboard');
    }
  }

  async function startMatchmaking() {
    setError('');
    setScreen('matchmaking');

    try {
      const matchId = await nakamaService.findMatch(selectedMode);
      await nakamaService.joinMatch(matchId);
    } catch (err: any) {
      console.error('Matchmaking error:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error';
      setError(`Matchmaking failed: ${errorMessage}`);
      setScreen('menu');
    }
  }

  async function playAgain() {
    await nakamaService.leaveMatch();
    setGameState(null);
    setPlayers([]);
    setMySymbol(null);
    setGameOverMessage('');
    setScreen('menu');
  }

  async function handleCellClick(index: number) {
    if (!gameState || gameState.status !== 'playing') return;

    const myUserId = nakamaService.getCurrentUserId();
    if (gameState.currentTurn !== myUserId) return;

    if (gameState.board[index] !== null) return;

    try {
      await nakamaService.makeMove(index);
    } catch (err) {
      console.error('Move failed:', err);
    }
  }

  function handleChangeNickname() {
    setScreen('nickname');
  }

  // Render nickname entry screen
  if (screen === 'nickname') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full">
          <div className="glass-card rounded-2xl shadow-2xl p-8 animate-scale-in">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <span className="text-6xl animate-float inline-block">🎮</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                TIC-TAC-TOE
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Enter your nickname to start
              </p>
            </div>

            {/* Nickname input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Your Nickname
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSettingNickname) {
                    handleSetNickname();
                  }
                }}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-dark-500 bg-white dark:bg-dark-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-lg font-medium"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {nicknameInput.length}/20 characters
              </p>
            </div>

            {/* Start button */}
            <button
              onClick={handleSetNickname}
              disabled={isSettingNickname || isInitializing || !nicknameInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingNickname || isInitializing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isInitializing ? 'Connecting...' : 'Setting up...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Let's Play!
                </span>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render loading screen
  if (isInitializing) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="glass-card rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="spinner"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-800 dark:text-white">Connecting to server...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Render connection error
  if (!isConnected && error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="glass-card rounded-2xl shadow-2xl p-8 max-w-md text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => initializeConnection(nickname)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg btn-glow"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render main menu
  if (screen === 'menu') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full">
          <div className="glass-card rounded-2xl shadow-2xl p-8 mb-6 animate-slide-up">
            {/* Title */}
            <div className="text-center mb-6">
              <div className="inline-block mb-4">
                <span className="text-6xl animate-float inline-block">🎮</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                TIC-TAC-TOE
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Real-time Multiplayer Battle
              </p>
            </div>

            {/* Player info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Playing as</p>
                    <p className="font-bold text-gray-800 dark:text-white text-lg">{nickname}</p>
                  </div>
                </div>
                <button
                  onClick={handleChangeNickname}
                  className="p-2 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                  title="Change nickname"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Game mode selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Select Game Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMode('classic')}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    selectedMode === 'classic'
                      ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 shadow-lg'
                      : 'border-gray-200 dark:border-dark-500 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  {selectedMode === 'classic' && (
                    <div className="absolute top-2 right-2">
                      <span className="text-purple-500 text-xl">✓</span>
                    </div>
                  )}
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="font-bold text-gray-800 dark:text-white">Classic</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No time limit</p>
                </button>
                <button
                  onClick={() => setSelectedMode('timed')}
                  className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                    selectedMode === 'timed'
                      ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 shadow-lg'
                      : 'border-gray-200 dark:border-dark-500 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  {selectedMode === 'timed' && (
                    <div className="absolute top-2 right-2">
                      <span className="text-purple-500 text-xl">✓</span>
                    </div>
                  )}
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="font-bold text-gray-800 dark:text-white">Timed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">30s per turn</p>
                </button>
              </div>
            </div>

            {/* Play button */}
            <button
              onClick={startMatchmaking}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl btn-glow mb-3"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Match
              </span>
            </button>

            {/* Leaderboard button */}
            <button
              onClick={loadLeaderboard}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl btn-glow"
            >
              <span className="flex items-center justify-center gap-2">
                🏆 Leaderboard
              </span>
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Player stats */}
          {playerStats && <PlayerStatsCard stats={playerStats} />}
        </div>

        {/* Leaderboard modal */}
        {showLeaderboard && (
          <Leaderboard
            leaderboard={leaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUserId={nakamaService.getCurrentUserId()}
          />
        )}
      </div>
    );
  }

  // Render matchmaking screen
  if (screen === 'matchmaking') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="glass-card rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-scale-in">
          {/* Orbiting animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white font-bold">VS</span>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                  X
                </div>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shadow-lg">
                  O
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Finding a random player
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Mode: {selectedMode === 'classic' ? 'Classic' : 'Timed (30s/turn)'}
          </p>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          <button
            onClick={() => {
              nakamaService.leaveMatch();
              setScreen('menu');
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render game screen
  if (screen === 'game' && gameState) {
    const myUserId = nakamaService.getCurrentUserId();
    const myPlayer = players.find((p) => p.userId === myUserId);
    const opponent = players.find((p) => p.userId !== myUserId);
    const isMyTurn = gameState.currentTurn === myUserId;

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="max-w-lg w-full">
          {/* Player info header */}
          <div className="glass-card rounded-2xl shadow-lg p-4 mb-6 animate-slide-up">
            <div className="flex justify-between items-center">
              {/* Player (You) */}
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMyTurn ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500' : ''}`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg ${mySymbol === 'X' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-red-500 to-pink-500 text-white'}`}>
                  {mySymbol}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">You</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                    {myPlayer?.username || nickname || 'Player'}
                  </p>
                </div>
              </div>

              {/* VS */}
              <div className="text-center px-4">
                <div className="text-2xl font-black text-gray-300 dark:text-dark-500">VS</div>
              </div>

              {/* Opponent */}
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${!isMyTurn && gameState.status === 'playing' ? 'bg-red-500/10 dark:bg-red-500/20 ring-2 ring-red-500' : ''}`}>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-right">Opponent</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] text-right">
                    {opponent?.username || 'Waiting...'}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg ${opponent?.symbol === 'X' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-red-500 to-pink-500 text-white'}`}>
                  {opponent?.symbol || '?'}
                </div>
              </div>
            </div>
          </div>

          {/* Game board */}
          <GameBoard
            board={gameState.board}
            onCellClick={handleCellClick}
            currentTurn={gameState.currentTurn}
            myUserId={myUserId || ''}
            isGameOver={gameState.status === 'finished'}
            timeRemaining={timeRemaining}
            mySymbol={mySymbol}
          />
        </div>
      </div>
    );
  }

  // Render game over screen
  if (screen === 'game-over' && gameState) {
    const myUserId = nakamaService.getCurrentUserId();
    const won = gameState.winner === myUserId;
    const draw = gameState.isDraw;

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full">
          <div className="glass-card rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
            {/* Result icon */}
            <div className={`text-7xl mb-4 ${won ? 'winner-celebration' : ''}`}>
              {draw ? '🤝' : won ? '🏆' : '😔'}
            </div>

            {/* Result message */}
            <h2 className={`text-3xl font-black mb-2 ${
              draw
                ? 'text-yellow-500'
                : won
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent'
                  : 'text-red-500'
            }`}>
              {draw ? "It's a Draw!" : won ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{gameOverMessage}</p>

            {/* Final board - smaller */}
            <div className="grid grid-cols-3 gap-2 my-6 max-w-[180px] mx-auto">
              {gameState.board.map((cell, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xl font-black ${
                    theme === 'dark'
                      ? 'bg-dark-600'
                      : 'bg-gray-100'
                  } ${
                    cell === 'X' ? 'text-blue-500' : cell === 'O' ? 'text-red-500' : ''
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={playAgain}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg btn-glow"
              >
                <span className="flex items-center justify-center gap-2">
                  🎮 Play Again
                </span>
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg btn-glow"
              >
                <span className="flex items-center justify-center gap-2">
                  🏆 View Leaderboard
                </span>
              </button>
            </div>
          </div>

          {/* Updated stats with loading indicator */}
          {playerStats && (
            <div className="mt-6 relative">
              {isLoadingStats && (
                <div className="absolute inset-0 bg-white/50 dark:bg-dark-800/50 rounded-2xl flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              )}
              <PlayerStatsCard stats={playerStats} />
            </div>
          )}
        </div>

        {/* Leaderboard modal */}
        {showLeaderboard && (
          <Leaderboard
            leaderboard={leaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUserId={nakamaService.getCurrentUserId()}
          />
        )}
      </div>
    );
  }

  return null;
}

export default App;
