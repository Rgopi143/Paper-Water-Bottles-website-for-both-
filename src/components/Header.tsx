import { ShoppingCart, MessageSquare, User, LogOut, Droplet, Package, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

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
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Droplet className="text-green-700" size={32} strokeWidth={2.5} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EcoPure</h1>
              <p className="text-xs text-gray-600">Paper Water Bottles</p>
            </div>
          </Link>

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

                <div className="flex items-center gap-4">
                  <Link
                    to="/"
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-green-700 transition-colors p-2 rounded-md hover:bg-gray-100"
                  >
                    <Home size={20} />
                    <span className="hidden sm:inline">Home</span>
                  </Link>
                  {profile?.role === 'buyer' && (
                    <Link
                      to="/orders"
                      className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-green-700 transition-colors p-2 rounded-md hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Package size={20} />
                      <span className="hidden sm:inline">Orders</span>
                    </Link>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                      aria-expanded={showUserMenu}
                      aria-label="User menu"
                    >
                      <User size={20} />
                      <span className="hidden sm:inline">{profile?.full_name || 'Account'}</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                        <Link
                          to="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={16} />
                          My Account
                        </Link>
                        {profile?.role === 'buyer' && (
                          <Link
                            to="/orders"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        )}
                        {profile?.role === 'seller' && (
                          <Link
                            to="/seller"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <ShoppingCart size={16} />
                            Seller Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
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
