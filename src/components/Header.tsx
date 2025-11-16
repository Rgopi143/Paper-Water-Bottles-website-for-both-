import { ShoppingCart, MessageSquare, User, LogOut, Droplet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type HeaderProps = {
  onAuthClick: () => void;
  onCartClick: () => void;
  onChatsClick: () => void;
  cartCount?: number;
  unreadChats?: number;
};

export function Header({ onAuthClick, onCartClick, onChatsClick, cartCount = 0, unreadChats = 0 }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Droplet className="text-green-700" size={32} strokeWidth={2.5} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoPure</h1>
              <p className="text-xs text-gray-600">Paper Water Bottles</p>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={onChatsClick}
                  className="relative p-2 text-gray-600 hover:text-green-700 transition-colors"
                  aria-label="Messages"
                >
                  <MessageSquare size={24} />
                  {unreadChats > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadChats}
                    </span>
                  )}
                </button>

                {profile?.role === 'buyer' && (
                  <button
                    onClick={onCartClick}
                    className="relative p-2 text-gray-600 hover:text-green-700 transition-colors"
                    aria-label="Shopping cart"
                  >
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 text-gray-600 hover:text-green-700 transition-colors"
                  >
                    <User size={24} />
                    <span className="text-sm font-medium">{profile?.full_name}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
                      </div>
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
