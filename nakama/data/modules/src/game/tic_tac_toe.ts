// Win patterns: 3 rows, 3 columns, 2 diagonals
const WIN_PATTERNS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function checkWinner(board: Array<string | null>): string | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function isDraw(board: Array<string | null>, moveCount: number): boolean {
  return moveCount === 9 && checkWinner(board) === null;
}

export function isValidMove(
  board: Array<string | null>,
  position: number,
  currentTurn: string,
  playerId: string
): ValidationResult {
  if (currentTurn !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (position < 0 || position > 8) {
    return { valid: false, error: 'Invalid position (must be 0-8)' };
  }

  if (board[position] !== null) {
    return { valid: false, error: 'Cell already occupied' };
  }

  return { valid: true };
}

export function getWinningPattern(board: Array<string | null>): number[] | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return pattern;
    }
  }
  return null;
}
