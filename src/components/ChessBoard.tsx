
import { useState, useEffect } from 'react';
import { 
  ChessBoard as ChessBoardType, 
  ChessPiece, 
  Position, 
  getValidMoves,
  isValidMove,
  applyMove,
  positionToNotation,
  PieceColor,
  isPawnPromotion,
  promotePawn,
  PieceType,
  GameState
} from '@/lib/chess-utils';
import ChessSquare from './ChessSquare';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Queen, Rook, Bishop, ChessKnight } from 'lucide-react';

interface ChessBoardProps {
  gameState: GameState;
  onMove: (
    from: Position, 
    to: Position, 
    capturedPiece: ChessPiece | null, 
    isPromotion: boolean,
    isCastling: boolean,
    isEnPassant: boolean,
    enPassantTarget: Position | null,
    castlingSide?: 'kingside' | 'queenside'
  ) => void;
  onPromotion: (position: Position, newType: PieceType) => void;
  lastMove: { from: Position; to: Position } | null;
  gameOver?: boolean;
}

const ChessBoard = ({ 
  gameState, 
  onMove, 
  onPromotion,
  lastMove, 
  gameOver = false 
}: ChessBoardProps) => {
  const { board, currentPlayer, enPassantTarget } = gameState;
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [promotionPosition, setPromotionPosition] = useState<Position | null>(null);
  const [promotionSelectValue, setPromotionSelectValue] = useState<PieceType>('queen');
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Position;
    to: Position;
    capturedPiece: ChessPiece | null;
    isEnPassant: boolean;
    enPassantTarget: Position | null;
  } | null>(null);
  
  // Update valid moves when a square is selected
  useEffect(() => {
    if (selectedSquare) {
      const moves = getValidMoves(gameState, selectedSquare);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedSquare, gameState]);
  
  const handleSquareClick = (position: Position) => {
    // Don't allow moves if game is over
    if (gameOver) {
      toast('Game over! Start a new game.');
      return;
    }
    
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
    if (isValidMove(gameState, selectedSquare, position)) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      
      // Check if it's a pawn moving to the last rank (promotion)
      if (selectedPiece?.type === 'pawn') {
        const isPromotion = (selectedPiece.color === 'white' && position.row === 0) ||
                           (selectedPiece.color === 'black' && position.row === 7);
        
        if (isPromotion) {
          const { 
            capturedPiece, 
            isEnPassant,
            enPassantTarget: newEnPassantTarget 
          } = applyMove(gameState, selectedSquare, position);
          
          // Store the promotion move details for later processing
          setPendingPromotion({
            from: selectedSquare,
            to: position,
            capturedPiece,
            isEnPassant,
            enPassantTarget: newEnPassantTarget
          });
          
          // Show promotion dialog
          setPromotionPosition(position);
          return;
        }
      }
      
      // Regular non-promotion move
      const { 
        capturedPiece, 
        isPromotion,
        isCastling,
        castlingSide,
        isEnPassant,
        enPassantTarget: newEnPassantTarget
      } = applyMove(gameState, selectedSquare, position);
      
      // Call the onMove callback to update the game state
      onMove(
        selectedSquare, 
        position, 
        capturedPiece, 
        isPromotion, 
        isCastling, 
        isEnPassant,
        newEnPassantTarget,
        castlingSide
      );
      
      // Reset selection
      setSelectedSquare(null);
      
      // Show move notification
      const from = positionToNotation(selectedSquare);
      const to = positionToNotation(position);
      
      let moveDescription = `Moved from ${from} to ${to}`;
      
      if (capturedPiece) {
        moveDescription += ` and captured ${capturedPiece.color}'s ${capturedPiece.type}`;
      }
      
      if (isCastling) {
        moveDescription = `Castled ${castlingSide}`;
      }
      
      if (isEnPassant) {
        moveDescription = `En passant capture from ${from} to ${to}`;
      }
      
      toast(moveDescription);
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
  
  const handlePromotionConfirm = () => {
    if (promotionPosition && pendingPromotion) {
      const { from, to, capturedPiece, isEnPassant, enPassantTarget: newEnPassantTarget } = pendingPromotion;
      
      // First call onMove to update the game state with the promotion move
      onMove(
        from, 
        to, 
        capturedPiece, 
        true, // isPromotion
        false, // isCastling
        isEnPassant,
        newEnPassantTarget
      );
      
      // Then call onPromotion to update the piece type
      onPromotion(to, promotionSelectValue);
      
      // Reset states
      setSelectedSquare(null);
      setPromotionPosition(null);
      setPendingPromotion(null);
      
      toast(`Pawn promoted to ${promotionSelectValue}`);
    }
  };
  
  const renderPieceIcon = (pieceType: PieceType) => {
    switch (pieceType) {
      case 'queen': return <Queen className="h-6 w-6" />;
      case 'rook': return <Rook className="h-6 w-6" />;
      case 'bishop': return <Bishop className="h-6 w-6" />;
      case 'knight': return <ChessKnight className="h-6 w-6" />;
      default: return null;
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
    <>
      <div className="grid grid-cols-8 border border-gray-800 shadow-lg" style={{ width: 'min(100%, 560px)', height: 'min(100%, 560px)' }}>
        {board.flat().map((piece, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const position = { row, col };
          const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
          const isValidMoveSquare = isValidMovePosition(position);
          const isLastMove = isLastMovePosition(position);
          const isEnPassantSquare = !!(enPassantTarget && enPassantTarget.row === row && enPassantTarget.col === col);
          
          return (
            <ChessSquare
              key={index}
              position={position}
              piece={piece}
              isSelected={isSelected}
              isValidMove={isValidMoveSquare && !gameOver}
              isLastMove={isLastMove}
              isEnPassant={isEnPassantSquare}
              onClick={() => handleSquareClick(position)}
            />
          );
        })}
      </div>
      
      {/* Pawn Promotion Dialog */}
      <Dialog open={promotionPosition !== null} onOpenChange={(open) => {
        if (!open) {
          setPromotionPosition(null);
          setPendingPromotion(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promote Pawn</DialogTitle>
            <DialogDescription>
              Your pawn has reached the end of the board! Choose a piece to promote to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {['queen', 'rook', 'bishop', 'knight'].map((piece) => (
                <div 
                  key={piece}
                  onClick={() => setPromotionSelectValue(piece as PieceType)}
                  className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-colors
                    ${promotionSelectValue === piece ? 'bg-primary/20 border border-primary' : 'hover:bg-muted'}`}
                >
                  {renderPieceIcon(piece as PieceType)}
                  <span className="text-sm mt-1 capitalize">{piece}</span>
                </div>
              ))}
            </div>
            
            <Button onClick={handlePromotionConfirm}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChessBoard;
