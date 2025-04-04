
import { useState, useEffect } from 'react';
import { 
  ChessBoard as ChessBoardType, 
  ChessPiece, 
  Position, 
  getValidMoves,
  isValidMove,
  applyMove,
  positionToNotation,
  PieceColor
} from '@/lib/chess-utils';
import ChessSquare from './ChessSquare';
import { toast } from 'sonner';

interface ChessBoardProps {
  board: ChessBoardType;
  currentPlayer: PieceColor;
  onMove: (from: Position, to: Position, capturedPiece: ChessPiece | null) => void;
  lastMove: { from: Position; to: Position } | null;
}

const ChessBoard = ({ board, currentPlayer, onMove, lastMove }: ChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  
  // Update valid moves when a square is selected
  useEffect(() => {
    if (selectedSquare) {
      const moves = getValidMoves(board, selectedSquare, currentPlayer);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedSquare, board, currentPlayer]);
  
  const handleSquareClick = (position: Position) => {
    const piece = board[position.row][position.col];
    
    // If no square is selected yet
    if (!selectedSquare) {
      // Only allow selecting pieces of the current player's color
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare(position);
      } else if (piece) {
        toast(`It's ${currentPlayer}'s turn`);
      }
      return;
    }
    
    // If the same square is clicked again, deselect it
    if (position.row === selectedSquare.row && position.col === selectedSquare.col) {
      setSelectedSquare(null);
      return;
    }
    
    // If another square is clicked
    // Check if it's a valid move
    if (isValidMove(board, selectedSquare, position, currentPlayer)) {
      const { newBoard, capturedPiece } = applyMove(board, selectedSquare, position);
      
      // Call the onMove callback to update the game state
      onMove(selectedSquare, position, capturedPiece);
      
      // Reset selection
      setSelectedSquare(null);
      
      // Show move notification
      const from = positionToNotation(selectedSquare);
      const to = positionToNotation(position);
      const captureText = capturedPiece ? ` and captured ${capturedPiece.color}'s ${capturedPiece.type}` : '';
      toast(`Moved from ${from} to ${to}${captureText}`);
    } 
    // If it's another piece of the same color, select it instead
    else if (piece && piece.color === currentPlayer) {
      setSelectedSquare(position);
    } 
    // If it's an invalid move
    else {
      toast('Invalid move');
      setSelectedSquare(null);
    }
  };
  
  const isValidMovePosition = (position: Position) => {
    return validMoves.some(move => move.row === position.row && move.col === position.col);
  };

  const isLastMovePosition = (position: Position) => {
    if (!lastMove) return false;
    return (
      (position.row === lastMove.from.row && position.col === lastMove.from.col) ||
      (position.row === lastMove.to.row && position.col === lastMove.to.col)
    );
  };
  
  // Render the board
  return (
    <div className="grid grid-cols-8 border border-gray-800 shadow-lg" style={{ width: 'min(100%, 560px)', height: 'min(100%, 560px)' }}>
      {board.flat().map((piece, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const position = { row, col };
        const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
        const isValidMoveSquare = isValidMovePosition(position);
        const isLastMove = isLastMovePosition(position);
        
        return (
          <ChessSquare
            key={index}
            position={position}
            piece={piece}
            isSelected={isSelected}
            isValidMove={isValidMoveSquare}
            isLastMove={isLastMove}
            onClick={() => handleSquareClick(position)}
          />
        );
      })}
    </div>
  );
};

export default ChessBoard;
