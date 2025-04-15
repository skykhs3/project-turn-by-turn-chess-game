
import React from 'react';
import ChessGame from '@/components/ChessGame';
import { Toaster } from 'sonner';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Chess Arena</h1>
          <p className="text-gray-600">A turn-by-turn chess game for two players on one screen.</p>
        </header>
        
        <main>
          <ChessGame />
          <Toaster position="bottom-right" />
        </main>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 Chess Arena. Use white and black pieces to play chess with a friend.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
