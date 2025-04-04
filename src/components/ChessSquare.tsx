
import { ChessPiece, Position, getPieceSymbol } from '@/lib/chess-utils';
import { cn } from '@/lib/utils';

interface ChessSquareProps {
  position: Position;
  piece: ChessPiece | null;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  onClick: () => void;
}

const ChessSquare = ({
  position,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  onClick,
}: ChessSquareProps) => {
  const { row, col } = position;
  const isLight = (row + col) % 2 === 0;
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center text-4xl md:text-5xl p-1 transition-all duration-200',
        isLight ? 'bg-chess-light-square' : 'bg-chess-dark-square',
        isSelected && 'bg-chess-selected',
        isValidMove && 'cursor-pointer',
        isLastMove && 'bg-chess-last-move'
      )}
      onClick={onClick}
      data-position={`${row},${col}`}
    >
      {/* Coordinate labels for the first column and bottom row */}
      {col === 0 && (
        <div className="absolute top-0 left-0 text-xs p-0.5 font-bold opacity-70">
          {8 - row}
        </div>
      )}
      {row === 7 && (
        <div className="absolute bottom-0 right-0 text-xs p-0.5 font-bold opacity-70">
          {String.fromCharCode(97 + col)}
        </div>
      )}
      
      {/* Chess piece */}
      {piece && (
        <div className={cn(
          'transition-all',
          piece.color === 'white' ? 'text-white' : 'text-black',
          isSelected && 'animate-piece-move'
        )}>
          {getPieceSymbol(piece)}
        </div>
      )}
      
      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <div className="absolute w-1/4 h-1/4 rounded-full bg-chess-valid-move"></div>
      )}
      
      {/* Valid capture indicator */}
      {isValidMove && piece && (
        <div className="absolute inset-0 border-2 border-chess-valid-move rounded-sm"></div>
      )}
    </div>
  );
};

export default ChessSquare;
