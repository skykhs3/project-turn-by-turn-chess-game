
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
  castlingSide?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
}

export type ChessBoard = (ChessPiece | null)[][];

// Initialize a new chess board with pieces in starting positions
export const initializeBoard = (): ChessBoard => {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
  }
  
  // Place rooks
  board[0][0] = { type: 'rook', color: 'black', hasMoved: false };
  board[0][7] = { type: 'rook', color: 'black', hasMoved: false };
  board[7][0] = { type: 'rook', color: 'white', hasMoved: false };
  board[7][7] = { type: 'rook', color: 'white', hasMoved: false };
  
  // Place knights
  board[0][1] = { type: 'knight', color: 'black', hasMoved: false };
  board[0][6] = { type: 'knight', color: 'black', hasMoved: false };
  board[7][1] = { type: 'knight', color: 'white', hasMoved: false };
  board[7][6] = { type: 'knight', color: 'white', hasMoved: false };
  
  // Place bishops
  board[0][2] = { type: 'bishop', color: 'black', hasMoved: false };
  board[0][5] = { type: 'bishop', color: 'black', hasMoved: false };
  board[7][2] = { type: 'bishop', color: 'white', hasMoved: false };
  board[7][5] = { type: 'bishop', color: 'white', hasMoved: false };
  
  // Place queens
  board[0][3] = { type: 'queen', color: 'black', hasMoved: false };
  board[7][3] = { type: 'queen', color: 'white', hasMoved: false };
  
  // Place kings
  board[0][4] = { type: 'king', color: 'black', hasMoved: false };
  board[7][4] = { type: 'king', color: 'white', hasMoved: false };
  
  return board;
};

// Track the last moved pawn for en passant
export interface GameState {
  board: ChessBoard;
  currentPlayer: PieceColor;
  lastMove: Move | null;
  enPassantTarget: Position | null;
}

// Chess move validation
export const isValidMove = (
  gameState: GameState,
  from: Position,
  to: Position
): boolean => {
  const { board, currentPlayer, enPassantTarget } = gameState;
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
      return isValidPawnMove(gameState, from, to);
    case 'knight':
      return isValidKnightMove(from, to);
    case 'bishop':
      return isValidBishopMove(board, from, to);
    case 'rook':
      return isValidRookMove(board, from, to);
    case 'queen':
      return isValidQueenMove(board, from, to);
    case 'king':
      return isValidKingMove(gameState, from, to);
    default:
      return false;
  }
};

// Helper functions for specific piece move validation
const isValidPawnMove = (
  gameState: GameState,
  from: Position,
  to: Position
): boolean => {
  const { board, enPassantTarget } = gameState;
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== 'pawn') return false;
  
  const color = piece.color;
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
  
  // Regular capture
  if (
    Math.abs(from.col - to.col) === 1 &&
    to.row === from.row + direction &&
    board[to.row][to.col] &&
    board[to.row][to.col]?.color !== color
  ) {
    return true;
  }
  
  // En passant capture
  if (
    enPassantTarget &&
    Math.abs(from.col - to.col) === 1 &&
    to.row === from.row + direction &&
    to.row === enPassantTarget.row &&
    to.col === enPassantTarget.col
  ) {
    return true;
  }
  
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
  gameState: GameState,
  from: Position,
  to: Position
): boolean => {
  const { board } = gameState;
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== 'king') return false;
  
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Regular king move (one square in any direction)
  if (rowDiff <= 1 && colDiff <= 1) return true;
  
  // Castling
  if (rowDiff === 0 && colDiff === 2) {
    // King hasn't moved yet
    if (piece.hasMoved) return false;
    
    const kingsideCol = 6;
    const queensideCol = 2;
    
    // Kingside castling
    if (to.col === kingsideCol) {
      const rookPos = { row: from.row, col: 7 };
      const rook = board[rookPos.row][rookPos.col];
      
      // Check if there's a rook that hasn't moved
      if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) return false;
      
      // Check if path is clear
      for (let col = from.col + 1; col < rookPos.col; col++) {
        if (board[from.row][col]) return false;
      }
      
      return true;
    }
    
    // Queenside castling
    if (to.col === queensideCol) {
      const rookPos = { row: from.row, col: 0 };
      const rook = board[rookPos.row][rookPos.col];
      
      // Check if there's a rook that hasn't moved
      if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) return false;
      
      // Check if path is clear
      for (let col = from.col - 1; col > rookPos.col; col--) {
        if (board[from.row][col]) return false;
      }
      
      return true;
    }
  }
  
  return false;
};

// Function to get all valid moves for a given position
export const getValidMoves = (
  gameState: GameState,
  position: Position
): Position[] => {
  const validMoves: Position[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const to = { row, col };
      if (isValidMove(gameState, position, to)) {
        validMoves.push(to);
      }
    }
  }
  
  return validMoves;
};

// Check if a pawn is eligible for promotion (at opponent's back rank)
export const isPawnPromotion = (position: Position, piece: ChessPiece): boolean => {
  if (piece.type !== 'pawn') return false;
  
  // White pawns promote on row 0, black pawns promote on row 7
  return (piece.color === 'white' && position.row === 0) || 
         (piece.color === 'black' && position.row === 7);
};

// Function to detect if a move is castling
export const isCastlingMove = (from: Position, to: Position, piece: ChessPiece): { isCastling: boolean, side?: 'kingside' | 'queenside' } => {
  if (piece.type !== 'king') return { isCastling: false };
  
  // Kings move two squares horizontally for castling
  if (Math.abs(from.col - to.col) === 2 && from.row === to.row) {
    const side = to.col > from.col ? 'kingside' : 'queenside';
    return { isCastling: true, side };
  }
  
  return { isCastling: false };
};

// Function to detect if a move is en passant
export const isEnPassantMove = (
  from: Position, 
  to: Position, 
  piece: ChessPiece, 
  enPassantTarget: Position | null
): boolean => {
  if (!enPassantTarget || piece.type !== 'pawn') return false;
  
  // Check if the pawn is moving to the en passant target square
  return to.row === enPassantTarget.row && to.col === enPassantTarget.col;
};

// Function to apply a move to the board
export const applyMove = (
  gameState: GameState, 
  from: Position, 
  to: Position
): { 
  newBoard: ChessBoard, 
  capturedPiece: ChessPiece | null,
  isPromotion: boolean,
  isCastling: boolean,
  castlingSide?: 'kingside' | 'queenside',
  isEnPassant: boolean,
  enPassantTarget: Position | null
} => {
  const { board, enPassantTarget } = gameState;
  const newBoard = board.map(row => [...row]);
  const piece = { ...newBoard[from.row][from.col]! };  // Clone the piece
  const capturedPiece = newBoard[to.row][to.col] ? { ...newBoard[to.row][to.col]! } : null;
  
  // Check for special moves
  const isPromotion = isPawnPromotion(to, piece);
  const { isCastling, side: castlingSide } = isCastlingMove(from, to, piece);
  const isEnPassant = isEnPassantMove(from, to, piece, enPassantTarget);
  
  // Regular move
  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;
  
  // Handle castling
  if (isCastling && castlingSide) {
    // Move the rook too
    if (castlingSide === 'kingside') {
      // Move rook from h-file to f-file
      const rookFromCol = 7;
      const rookToCol = 5;
      newBoard[from.row][rookToCol] = { ...newBoard[from.row][rookFromCol]!, hasMoved: true };
      newBoard[from.row][rookFromCol] = null;
    } else { // queenside
      // Move rook from a-file to d-file
      const rookFromCol = 0;
      const rookToCol = 3;
      newBoard[from.row][rookToCol] = { ...newBoard[from.row][rookFromCol]!, hasMoved: true };
      newBoard[from.row][rookFromCol] = null;
    }
  }
  
  // Handle en passant capture
  let capturedEnPassantPiece = null;
  if (isEnPassant) {
    // Remove the captured pawn (which is one square behind the landing square)
    const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    capturedEnPassantPiece = newBoard[captureRow][to.col];
    newBoard[captureRow][to.col] = null;
  }
  
  // Set en passant target for the next move
  let newEnPassantTarget: Position | null = null;
  
  // If a pawn moves two squares, set the en passant target
  if (piece.type === 'pawn' && Math.abs(from.row - to.row) === 2) {
    const enPassantRow = piece.color === 'white' ? from.row - 1 : from.row + 1;
    newEnPassantTarget = { row: enPassantRow, col: from.col };
  }
  
  return { 
    newBoard, 
    capturedPiece: capturedEnPassantPiece || capturedPiece, 
    isPromotion,
    isCastling,
    castlingSide,
    isEnPassant,
    enPassantTarget: newEnPassantTarget
  };
};

// Function to promote a pawn to a new piece type
export const promotePawn = (
  board: ChessBoard,
  position: Position,
  newType: PieceType
): ChessBoard => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[position.row][position.col];
  
  if (piece && piece.type === 'pawn') {
    newBoard[position.row][position.col] = {
      type: newType,
      color: piece.color,
      hasMoved: true
    };
  }
  
  return newBoard;
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
