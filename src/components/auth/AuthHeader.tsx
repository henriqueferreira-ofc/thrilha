import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';

export const AuthHeader: React.FC = () => {
  return (
    <nav className="py-5 px-6 md:px-12 flex justify-between items-center border-b border-white/10">
      <Link to="/" className="flex items-center gap-2">
        <Mountain className="h-6 w-6 text-purple-300" />
        <span className="text-xl font-bold purple-gradient-text">Thrilha</span>
      </Link>
    </nav>
  );
};
