
// Types for chess pieces and board state
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isPromotion?: boolean;
  promotedTo?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export type ChessBoard = (ChessPiece | null)[][];

// Initialize a new chess board with pieces in starting positions
export const initializeBoard = (): ChessBoard => {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Place rooks
  board[0][0] = { type: 'rook', color: 'black' };
  board[0][7] = { type: 'rook', color: 'black' };
  board[7][0] = { type: 'rook', color: 'white' };
  board[7][7] = { type: 'rook', color: 'white' };
  
  // Place knights
  board[0][1] = { type: 'knight', color: 'black' };
  board[0][6] = { type: 'knight', color: 'black' };
  board[7][1] = { type: 'knight', color: 'white' };
  board[7][6] = { type: 'knight', color: 'white' };
  
  // Place bishops
  board[0][2] = { type: 'bishop', color: 'black' };
  board[0][5] = { type: 'bishop', color: 'black' };
  board[7][2] = { type: 'bishop', color: 'white' };
  board[7][5] = { type: 'bishop', color: 'white' };
  
  // Place queens
  board[0][3] = { type: 'queen', color: 'black' };
  board[7][3] = { type: 'queen', color: 'white' };
  
  // Place kings
  board[0][4] = { type: 'king', color: 'black' };
  board[7][4] = { type: 'king', color: 'white' };
  
  return board;
};

// Chess move validation
export const isValidMove = (
  board: ChessBoard,
  from: Position,
  to: Position,
  currentPlayer: PieceColor
): boolean => {
  const piece = board[from.row][from.col];
  
  // Check if there's a piece at the starting position
  if (!piece) return false;
  
  // Check if the piece belongs to the current player
  if (piece.color !== currentPlayer) return false;
  
  // Check if the destination is already occupied by a piece of the same color
  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.color === currentPlayer) return false;
  
  // Check specific movement rules for each piece type
  switch (piece.type) {
    case 'pawn':
      return isValidPawnMove(board, from, to, piece.color);
    case 'knight':
      return isValidKnightMove(from, to);
    case 'bishop':
      return isValidBishopMove(board, from, to);
    case 'rook':
      return isValidRookMove(board, from, to);
    case 'queen':
      return isValidQueenMove(board, from, to);
    case 'king':
      return isValidKingMove(board, from, to);
    default:
      return false;
  }
};

// Helper functions for specific piece move validation
const isValidPawnMove = (
  board: ChessBoard,
  from: Position,
  to: Position,
  color: PieceColor
): boolean => {
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  
  // Forward move (1 square)
  if (
    from.col === to.col &&
    to.row === from.row + direction &&
    !board[to.row][to.col]
  ) {
    return true;
  }
  
  // Initial 2-square move
  if (
    from.col === to.col &&
    from.row === startRow &&
    to.row === from.row + 2 * direction &&
    !board[from.row + direction][from.col] &&
    !board[to.row][to.col]
  ) {
    return true;
  }
  
  // Capture
  if (
    Math.abs(from.col - to.col) === 1 &&
    to.row === from.row + direction &&
    board[to.row][to.col] &&
    board[to.row][to.col]?.color !== color
  ) {
    return true;
  }
  
  // TODO: En passant and promotion
  
  return false;
};

const isValidKnightMove = (from: Position, to: Position): boolean => {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

const isValidBishopMove = (
  board: ChessBoard,
  from: Position,
  to: Position
): boolean => {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Must move diagonally
  if (rowDiff !== colDiff) return false;
  
  // Check if path is clear
  const rowDirection = from.row < to.row ? 1 : -1;
  const colDirection = from.col < to.col ? 1 : -1;
  
  let currentRow = from.row + rowDirection;
  let currentCol = from.col + colDirection;
  
  while (currentRow !== to.row && currentCol !== to.col) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDirection;
    currentCol += colDirection;
  }
  
  return true;
};

const isValidRookMove = (
  board: ChessBoard,
  from: Position,
  to: Position
): boolean => {
  // Must move horizontally or vertically
  if (from.row !== to.row && from.col !== to.col) return false;
  
  // Check if path is clear
  if (from.row === to.row) {
    // Horizontal move
    const colDirection = from.col < to.col ? 1 : -1;
    let currentCol = from.col + colDirection;
    
    while (currentCol !== to.col) {
      if (board[from.row][currentCol]) return false;
      currentCol += colDirection;
    }
  } else {
    // Vertical move
    const rowDirection = from.row < to.row ? 1 : -1;
    let currentRow = from.row + rowDirection;
    
    while (currentRow !== to.row) {
      if (board[currentRow][from.col]) return false;
      currentRow += rowDirection;
    }
  }
  
  return true;
};

const isValidQueenMove = (
  board: ChessBoard,
  from: Position,
  to: Position
): boolean => {
  return (
    isValidBishopMove(board, from, to) || isValidRookMove(board, from, to)
  );
};

const isValidKingMove = (
  board: ChessBoard,
  from: Position,
  to: Position
): boolean => {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Regular king move (one square in any direction)
  if (rowDiff <= 1 && colDiff <= 1) return true;
  
  // TODO: Castling
  
  return false;
};

// Function to get all valid moves for a given position
export const getValidMoves = (
  board: ChessBoard,
  position: Position,
  currentPlayer: PieceColor
): Position[] => {
  const validMoves: Position[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const to = { row, col };
      if (isValidMove(board, position, to, currentPlayer)) {
        validMoves.push(to);
      }
    }
  }
  
  return validMoves;
};

// Function to apply a move to the board
export const applyMove = (board: ChessBoard, from: Position, to: Position): { newBoard: ChessBoard, capturedPiece: ChessPiece | null } => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  const capturedPiece = newBoard[to.row][to.col];
  
  // Move the piece
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  
  // Mark the piece as moved (important for pawns, kings, and rooks)
  if (piece) {
    piece.hasMoved = true;
  }
  
  // TODO: Handle special moves like castling, en passant, and promotion
  
  return { newBoard, capturedPiece: capturedPiece || null };
};

// Function to convert algebraic notation to position
export const notationToPosition = (notation: string): Position => {
  const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(notation[1]);
  return { row, col };
};

// Function to convert position to algebraic notation
export const positionToNotation = (position: Position): string => {
  const col = String.fromCharCode('a'.charCodeAt(0) + position.col);
  const row = 8 - position.row;
  return `${col}${row}`;
};

// Helper to get piece Unicode symbol
export const getPieceSymbol = (piece: ChessPiece): string => {
  if (piece.color === 'white') {
    switch (piece.type) {
      case 'pawn': return '♙';
      case 'knight': return '♘';
      case 'bishop': return '♗';
      case 'rook': return '♖';
      case 'queen': return '♕';
      case 'king': return '♔';
    }
  } else {
    switch (piece.type) {
      case 'pawn': return '♟';
      case 'knight': return '♞';
      case 'bishop': return '♝';
      case 'rook': return '♜';
      case 'queen': return '♛';
      case 'king': return '♚';
    }
  }
};
