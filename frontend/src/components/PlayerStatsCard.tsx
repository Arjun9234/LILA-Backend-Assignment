import React from 'react';
import { PlayerStats } from '../services/nakama';

interface PlayerStatsCardProps {
  stats: PlayerStats;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ stats }) => {
  const winRate = stats.totalGames > 0
    ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="glass-card rounded-2xl shadow-lg p-6 animate-slide-up">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Your Statistics
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {/* Rank */}
        <div className="stat-card p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Rank</p>
          <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {stats.rank ? `#${stats.rank}` : '—'}
          </p>
        </div>

        {/* Score */}
        <div className="stat-card p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Score</p>
          <p className="text-2xl font-black text-green-500 dark:text-neon-green">
            {stats.score}
          </p>
        </div>

        {/* Win Rate */}
        <div className="stat-card p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Win Rate</p>
          <p className="text-2xl font-black text-blue-500 dark:text-neon-blue">
            {winRate}%
          </p>
        </div>
      </div>

      {/* W/L/D Stats */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="bg-green-500/10 dark:bg-green-500/20 rounded-xl p-3 text-center border border-green-500/20">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Wins</p>
          <p className="text-xl font-black text-green-600 dark:text-green-400">{stats.wins}</p>
        </div>

        <div className="bg-red-500/10 dark:bg-red-500/20 rounded-xl p-3 text-center border border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Losses</p>
          <p className="text-xl font-black text-red-600 dark:text-red-400">{stats.losses}</p>
        </div>

        <div className="bg-yellow-500/10 dark:bg-yellow-500/20 rounded-xl p-3 text-center border border-yellow-500/20">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Draws</p>
          <p className="text-xl font-black text-yellow-600 dark:text-yellow-400">{stats.draws}</p>
        </div>
      </div>

      {/* Win Streak */}
      {stats.winStreak > 0 && (
        <div className="mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl"></div>
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl animate-bounce-subtle">🔥</span>
              <div>
                <p className="text-xs text-white/80 font-medium">WINNING STREAK</p>
                <p className="text-2xl font-black text-white">{stats.winStreak} {stats.winStreak === 1 ? 'Game' : 'Games'}</p>
              </div>
              <span className="text-2xl animate-bounce-subtle" style={{ animationDelay: '150ms' }}>🔥</span>
            </div>
          </div>
        </div>
      )}

      {/* Games played */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Games Played: <span className="font-bold text-gray-700 dark:text-gray-300">{stats.totalGames}</span>
        </p>
      </div>
    </div>
  );
};

export default PlayerStatsCard;
