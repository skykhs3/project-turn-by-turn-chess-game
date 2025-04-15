
import { useState, useEffect } from 'react';
import ChessBoard from './ChessBoard';
import { 
  ChessBoard as ChessBoardType, 
  ChessPiece, 
  Position, 
  PieceColor, 
  initializeBoard,
  Move,
  positionToNotation,
  PieceType,
  promotePawn,
  GameState
} from '@/lib/chess-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ChessGame = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentPlayer: 'white',
    lastMove: null,
    enPassantTarget: null
  });
  
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: ChessPiece[];
    black: ChessPiece[];
  }>({ white: [], black: [] });
  const [winner, setWinner] = useState<PieceColor | null>(null);
  
  // Handle player move
  const handleMove = (
    from: Position, 
    to: Position, 
    capturedPiece: ChessPiece | null,
    isPromotion: boolean,
    isCastling: boolean,
    isEnPassant: boolean,
    enPassantTarget: Position | null,
    castlingSide?: 'kingside' | 'queenside'
  ) => {
    // Get the piece that moved
    const piece = gameState.board[from.row][from.col];
    if (!piece) return;
    
    // Create a new game state
    setGameState(prevState => ({
      board: prevState.board.map(row => [...row]),  // Make a copy of the board
      currentPlayer: prevState.currentPlayer === 'white' ? 'black' : 'white',
      lastMove: {
        from,
        to,
        piece: { ...piece },
        capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
        isPromotion,
        isCastling,
        castlingSide,
        isEnPassant
      },
      enPassantTarget
    }));
    
    // Record the move
    const move: Move = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
      isPromotion,
      isCastling,
      castlingSide,
      isEnPassant
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
      
      // Check if a king was captured (game over)
      if (capturedPiece.type === 'king') {
        setWinner(gameState.currentPlayer);
        toast(`${gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)} wins the game by capturing the king!`, {
          duration: 5000
        });
      }
    }
  };
  
  // Effect to apply the moves to the board
  useEffect(() => {
    if (gameState.lastMove) {
      const { from, to, piece, isPromotion, isCastling, castlingSide, isEnPassant } = gameState.lastMove;
      
      // Apply the move to the board
      const newBoard = gameState.board.map(row => [...row]);
      
      // If not a promotion (those are handled separately)
      if (!isPromotion) {
        // Remove piece from original position
        newBoard[from.row][from.col] = null;
        
        // Place piece at new position
        newBoard[to.row][to.col] = { ...piece, hasMoved: true };
        
        // Handle castling - move the rook too
        if (isCastling && castlingSide) {
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
        
        // Handle en passant - remove the captured pawn
        if (isEnPassant) {
          const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
          newBoard[captureRow][to.col] = null;
        }
        
        // Update the board in game state
        setGameState(prevState => ({
          ...prevState,
          board: newBoard
        }));
      } else {
        // For promotions, we move the pawn but don't change its type yet
        // That will be handled in handlePromotion
        newBoard[from.row][from.col] = null;
        newBoard[to.row][to.col] = { ...piece, hasMoved: true };
        
        // Update the board in game state
        setGameState(prevState => ({
          ...prevState,
          board: newBoard
        }));
      }
    }
  }, [gameState.lastMove]);
  
  // Handle pawn promotion
  const handlePromotion = (position: Position, newType: PieceType) => {
    // Create a copy of the current board
    const newBoard = gameState.board.map(row => [...row]);
    
    // Get the piece at the promotion position
    const piece = newBoard[position.row][position.col];
    
    if (piece && piece.type === 'pawn') {
      // Replace the pawn with the promoted piece
      newBoard[position.row][position.col] = {
        type: newType,
        color: piece.color,
        hasMoved: true
      };
      
      // Update the game state with the new board
      setGameState(prevState => ({
        ...prevState,
        board: newBoard
      }));
      
      // Update the last move in the history to include promotion info
      if (moveHistory.length > 0) {
        const lastMoveIndex = moveHistory.length - 1;
        const updatedMoves = [...moveHistory];
        updatedMoves[lastMoveIndex] = {
          ...updatedMoves[lastMoveIndex],
          isPromotion: true,
          promotedTo: newType
        };
        setMoveHistory(updatedMoves);
      }
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setGameState({
      board: initializeBoard(),
      currentPlayer: 'white',
      lastMove: null,
      enPassantTarget: null
    });
    setMoveHistory([]);
    setLastMove(null);
    setCapturedPieces({ white: [], black: [] });
    setWinner(null);
    toast('New game started');
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex items-center justify-between w-full">
          {winner ? (
            <h2 className="text-xl font-bold">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${winner === 'white' ? 'bg-white border border-gray-300' : 'bg-black'}`}></span>
              {winner.charAt(0).toUpperCase() + winner.slice(1)} Won!
            </h2>
          ) : (
            <h2 className="text-xl font-bold">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${gameState.currentPlayer === 'white' ? 'bg-white border border-gray-300' : 'bg-black'}`}></span>
              {gameState.currentPlayer === 'white' ? 'White' : 'Black'}'s Turn
            </h2>
          )}
          <Button onClick={resetGame} variant="outline">New Game</Button>
        </div>
        <ChessBoard 
          gameState={gameState}
          onMove={handleMove} 
          onPromotion={handlePromotion}
          lastMove={lastMove}
          gameOver={winner !== null}
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
                  
                  let notation = '';
                  
                  // Special case for castling
                  if (move.isCastling) {
                    notation = move.castlingSide === 'kingside' ? 'O-O' : 'O-O-O';
                  } else {
                    const pieceSymbol = move.piece.type === 'pawn' ? '' : move.piece.type.charAt(0).toUpperCase();
                    const captureSymbol = move.capturedPiece || move.isEnPassant ? 'x' : '-';
                    const promotionText = move.isPromotion ? `=${move.promotedTo?.charAt(0).toUpperCase()}` : '';
                    const enPassantText = move.isEnPassant ? ' e.p.' : '';
                    
                    notation = `${pieceSymbol}${from}${captureSymbol}${to}${promotionText}${enPassantText}`;
                  }
                  
                  return (
                    <li key={index} className="text-sm mb-1">
                      <span className={move.piece.color === 'white' ? 'text-black' : 'text-gray-700'}>
                        {Math.floor(index/2) + 1}.{move.piece.color === 'black' ? '..' : ''} {notation}
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
