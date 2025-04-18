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
import { Crown, Castle, ArrowUpToLine, Sword } from 'lucide-react';

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
  
  useEffect(() => {
    if (selectedSquare) {
      const moves = getValidMoves(gameState, selectedSquare);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedSquare, gameState]);
  
  const handleSquareClick = (position: Position) => {
    if (gameOver) {
      toast('Game over! Start a new game.');
      return;
    }
    
    const piece = board[position.row][position.col];
    
    if (!selectedSquare) {
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare(position);
      } else if (piece) {
        toast(`It's ${currentPlayer}'s turn`);
      }
      return;
    }
    
    if (position.row === selectedSquare.row && position.col === selectedSquare.col) {
      setSelectedSquare(null);
      return;
    }
    
    if (isValidMove(gameState, selectedSquare, position)) {
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      
      if (selectedPiece?.type === 'pawn') {
        const isPromotion = (selectedPiece.color === 'white' && position.row === 0) ||
                           (selectedPiece.color === 'black' && position.row === 7);
        
        if (isPromotion) {
          const { 
            capturedPiece, 
            isEnPassant,
            enPassantTarget: newEnPassantTarget 
          } = applyMove(gameState, selectedSquare, position);
          
          setPendingPromotion({
            from: selectedSquare,
            to: position,
            capturedPiece,
            isEnPassant,
            enPassantTarget: newEnPassantTarget
          });
          
          setPromotionPosition(position);
          return;
        }
      }
      
      const { 
        capturedPiece, 
        isPromotion,
        isCastling,
        castlingSide,
        isEnPassant,
        enPassantTarget: newEnPassantTarget
      } = applyMove(gameState, selectedSquare, position);
      
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
      
      setSelectedSquare(null);
      
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
    else if (piece && piece.color === currentPlayer) {
      setSelectedSquare(position);
    } 
    else {
      toast('Invalid move');
      setSelectedSquare(null);
    }
  };
  
  const handlePromotionConfirm = () => {
    if (promotionPosition && pendingPromotion) {
      const { from, to, capturedPiece, isEnPassant, enPassantTarget: newEnPassantTarget } = pendingPromotion;
      
      onMove(
        from, 
        to, 
        capturedPiece, 
        true,
        false,
        isEnPassant,
        newEnPassantTarget
      );
      
      onPromotion(to, promotionSelectValue);
      
      setSelectedSquare(null);
      setPromotionPosition(null);
      setPendingPromotion(null);
      
      toast(`Pawn promoted to ${promotionSelectValue}`);
    }
  };
  
  const renderPieceIcon = (pieceType: PieceType) => {
    switch (pieceType) {
      case 'queen': return <Crown className="h-6 w-6" />;
      case 'rook': return <Castle className="h-6 w-6" />;
      case 'bishop': return <ArrowUpToLine className="h-6 w-6" />;
      case 'knight': return <Sword className="h-6 w-6" />;
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
