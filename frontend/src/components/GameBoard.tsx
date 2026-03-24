import React, { useState } from 'react';

interface GameBoardProps {
  board: Array<string | null>;
  onCellClick: (index: number) => void;
  currentTurn: string;
  myUserId: string;
  isGameOver: boolean;
  timeRemaining?: number;
  mySymbol?: 'X' | 'O' | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  currentTurn,
  myUserId,
  isGameOver,
  timeRemaining,
  mySymbol,
}) => {
  const [clickedCell, setClickedCell] = useState<number | null>(null);
  const isMyTurn = currentTurn === myUserId && !isGameOver;

  const handleClick = (index: number) => {
    if (!isMyTurn || board[index] !== null) return;
    setClickedCell(index);
    onCellClick(index);
    // Reset animation trigger after animation completes
    setTimeout(() => setClickedCell(null), 300);
  };

  const renderCell = (index: number) => {
    const symbol = board[index];
    const isEmpty = symbol === null;
    const canClick = isMyTurn && isEmpty;
    const justClicked = clickedCell === index;

    return (
      <button
        key={index}
        onClick={() => handleClick(index)}
        disabled={!canClick}
        className={`
          game-cell w-full aspect-square rounded-xl
          flex items-center justify-center text-5xl font-black
          transition-all duration-150 relative overflow-hidden
          ${canClick
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'cursor-not-allowed'
          }
          ${isEmpty && canClick
            ? 'bg-white/80 dark:bg-dark-600 hover:bg-white dark:hover:bg-dark-500 hover:shadow-lg dark:hover:shadow-purple-500/20'
            : 'bg-white/90 dark:bg-dark-600'
          }
          ${symbol === 'X' ? 'shadow-blue-500/30 dark:shadow-neon-blue/30' : ''}
          ${symbol === 'O' ? 'shadow-red-500/30 dark:shadow-neon-red/30' : ''}
          ${justClicked ? 'cell-pop' : ''}
        `}
      >
        {symbol && (
          <span
            className={`
              ${symbol === 'X'
                ? 'text-blue-500 dark:text-neon-blue dark:drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                : 'text-red-500 dark:text-neon-red dark:drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
              }
              ${!board.slice(0, index).includes(symbol) || board.indexOf(symbol) === index ? 'cell-pop' : ''}
            `}
          >
            {symbol}
          </span>
        )}
        {/* Hover preview */}
        {isEmpty && canClick && (
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-black opacity-0 hover:opacity-20 transition-opacity text-gray-400 dark:text-gray-500">
            {mySymbol}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Turn indicator */}
      <div className="mb-4 p-4 glass-card rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              {isGameOver ? 'Game Over' : 'Current Turn'}
            </p>
            {!isGameOver && (
              <p className={`text-lg font-bold flex items-center gap-2 ${
                isMyTurn
                  ? 'text-green-500 dark:text-neon-green'
                  : 'text-orange-500 dark:text-neon-yellow'
              }`}>
                {isMyTurn ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Your Turn
                  </>
                ) : (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Opponent&apos;s Turn
                  </>
                )}
              </p>
            )}
          </div>
          {timeRemaining !== undefined && !isGameOver && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Time Left</p>
              <div className={`text-3xl font-black tabular-nums ${
                timeRemaining <= 5
                  ? 'text-red-500 dark:text-neon-red animate-pulse'
                  : timeRemaining <= 10
                    ? 'text-orange-500 dark:text-neon-yellow'
                    : 'text-gray-800 dark:text-white'
              }`}>
                {timeRemaining}
                <span className="text-lg">s</span>
              </div>
            </div>
          )}
        </div>

        {/* Turn progress bar for timed mode */}
        {timeRemaining !== undefined && !isGameOver && (
          <div className="mt-3 h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                timeRemaining <= 5
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : timeRemaining <= 10
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${(timeRemaining / 30) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Game board with neon glow */}
      <div className="relative">
        {/* Glow effect behind the board */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 dark:opacity-50 -z-10 scale-95"></div>

        {/* The actual board */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 rounded-2xl shadow-2xl grid-glow">
          {board.map((_, index) => renderCell(index))}
        </div>
      </div>

      {/* Game hint */}
      {!isGameOver && isMyTurn && (
        <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Tap a cell to place your <span className={mySymbol === 'X' ? 'text-blue-500 dark:text-neon-blue font-bold' : 'text-red-500 dark:text-neon-red font-bold'}>{mySymbol}</span>
        </p>
      )}
    </div>
  );
};

export default GameBoard;
