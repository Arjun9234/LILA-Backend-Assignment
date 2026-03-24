import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../services/nakama';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
  currentUserId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, onClose, currentUserId }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-200 ${
        isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleClose}
    >
      <div
        className={`glass-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 text-8xl">🏆</div>
            <div className="absolute bottom-0 right-0 text-8xl">🎮</div>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                Leaderboard
              </h2>
              <p className="text-amber-100 text-sm mt-1 font-medium">Top Players Worldwide</p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Leaderboard content */}
        <div className="overflow-y-auto max-h-[calc(85vh-100px)] custom-scrollbar">
          {(!leaderboard || leaderboard.length === 0) ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg font-bold text-gray-800 dark:text-white">No players ranked yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Be the first to win a game!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-600">
              {(leaderboard || []).map((entry, index) => {
                const isCurrentUser = entry.userId === currentUserId;
                return (
                <div
                  key={entry.userId}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-600/50 transition-colors ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 ring-2 ring-purple-500 ring-inset'
                      : index < 3
                        ? index === 0
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'
                          : index === 1
                            ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20'
                            : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
                        : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-14">
                      {index === 0 && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🥇</span>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-slate-400 flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🥈</span>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🥉</span>
                        </div>
                      )}
                      {index > 2 && (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-lg">
                          #{entry.rank}
                        </div>
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-grow min-w-0">
                      <p className={`font-bold truncate text-lg ${isCurrentUser ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                        {entry.username}
                        {isCurrentUser && <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">You</span>}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          W: {entry.wins}
                        </span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          L: {entry.losses}
                        </span>
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          D: {entry.draws}
                        </span>
                      </div>
                    </div>

                    {/* Score and streak */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
                        <p className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {entry.score}
                        </p>
                      </div>
                      {entry.winStreak > 0 && (
                        <p className="text-sm font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1 justify-end mt-1">
                          <span className="text-base">🔥</span>
                          {entry.winStreak} streak
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-dark-700 border-t border-gray-100 dark:border-dark-600">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Play more games to climb the ranks!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
