
import { useState, useEffect } from 'react';
import ChessBoard from './ChessBoard';
import { 
  ChessBoard as ChessBoardType, 
  ChessPiece, 
  Position, 
  PieceColor, 
  initializeBoard,
  Move,
  positionToNotation
} from '@/lib/chess-utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

const ChessGame = () => {
  // Game state
  const [board, setBoard] = useState<ChessBoardType>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: ChessPiece[];
    black: ChessPiece[];
  }>({ white: [], black: [] });
  
  // Handle player move
  const handleMove = (from: Position, to: Position, capturedPiece: ChessPiece | null) => {
    // Update the board
    const piece = board[from.row][from.col];
    const newBoard = board.map(row => [...row]);
    
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    setBoard(newBoard);
    
    // Record the move
    const move: Move = {
      from,
      to,
      piece: { ...piece! }, // Clone the piece object
      capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
    };
    
    setMoveHistory([...moveHistory, move]);
    setLastMove({ from, to });
    
    // Update captured pieces
    if (capturedPiece) {
      const newCapturedPieces = { ...capturedPieces };
      if (capturedPiece.color === 'white') {
        newCapturedPieces.white = [...capturedPieces.white, capturedPiece];
      } else {
        newCapturedPieces.black = [...capturedPieces.black, capturedPiece];
      }
      setCapturedPieces(newCapturedPieces);
    }
    
    // Switch players
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
  };
  
  // Reset the game
  const resetGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer('white');
    setMoveHistory([]);
    setLastMove(null);
    setCapturedPieces({ white: [], black: [] });
    toast('New game started');
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex items-center justify-between w-full">
          <h2 className="text-xl font-bold">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${currentPlayer === 'white' ? 'bg-white border border-gray-300' : 'bg-black'}`}></span>
            {currentPlayer === 'white' ? 'White' : 'Black'}'s Turn
          </h2>
          <Button onClick={resetGame} variant="outline">New Game</Button>
        </div>
        <ChessBoard 
          board={board} 
          currentPlayer={currentPlayer} 
          onMove={handleMove} 
          lastMove={lastMove}
        />
      </div>
      
      <div className="flex flex-col w-full lg:w-64">
        {/* Game info panel */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
          <h3 className="font-bold mb-2">Captured Pieces</h3>
          <div className="flex justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">White</h4>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.white.map((piece, index) => (
                  <span key={index} className="text-2xl">
                    {piece.type === 'pawn' ? '♙' : 
                     piece.type === 'knight' ? '♘' : 
                     piece.type === 'bishop' ? '♗' : 
                     piece.type === 'rook' ? '♖' : 
                     piece.type === 'queen' ? '♕' : '♔'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Black</h4>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.black.map((piece, index) => (
                  <span key={index} className="text-2xl">
                    {piece.type === 'pawn' ? '♟' : 
                     piece.type === 'knight' ? '♞' : 
                     piece.type === 'bishop' ? '♝' : 
                     piece.type === 'rook' ? '♜' : 
                     piece.type === 'queen' ? '♛' : '♚'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Move history */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="font-bold mb-2">Move History</h3>
          <div className="max-h-64 overflow-y-auto">
            {moveHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No moves yet</p>
            ) : (
              <ol className="list-decimal list-inside">
                {moveHistory.map((move, index) => {
                  const from = positionToNotation(move.from);
                  const to = positionToNotation(move.to);
                  const pieceSymbol = move.piece.type.charAt(0).toUpperCase();
                  const captureSymbol = move.capturedPiece ? 'x' : '-';
                  
                  return (
                    <li key={index} className="text-sm mb-1">
                      <span className={move.piece.color === 'white' ? 'text-black' : 'text-gray-700'}>
                        {Math.floor(index/2) + 1}.{move.piece.color === 'black' ? '..' : ''} {pieceSymbol}{from}{captureSymbol}{to}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
