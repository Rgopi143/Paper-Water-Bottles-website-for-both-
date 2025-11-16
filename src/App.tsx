import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { AuthModal } from './components/AuthModal';
import { CartModal } from './components/CartModal';
import { ChatModal } from './components/ChatModal';
import { CheckoutModal } from './components/CheckoutModal';
import SellerDashboard from './pages/SellerDashboard';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import type { Product, CartItem } from './lib/supabase';

function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cartItems, setCartItems] = useState<Array<CartItem & { product: Product }>>([]);
  const [cartCount, setCartCount] = useState(0);
  const [sizeFilter, setSizeFilter] = useState<'all' | '500' | '750'>('all');
  
  // Filter products based on selected size
  const filteredProducts = products.filter(product => 
    sizeFilter === 'all' || product.size_ml.toString() === sizeFilter
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (user && profile?.role === 'buyer') {
      loadCartCount();
    }
  }, [user, profile]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCartCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('buyer_id', user.id);

      if (error) throw error;
      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (profile?.role !== 'buyer') {
      alert('Only buyers can add items to cart');
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('cart_items').insert({
          buyer_id: user.id,
          product_id: product.id,
          quantity: 1,
        });

        if (error) throw error;
      }

      await loadCartCount();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  const handleMessageSeller = async (product: Product) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('seller_id', product.seller_id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (!existingChat) {
        const { error } = await supabase.from('chats').insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
        });

        if (error) throw error;
      }

      setShowChatModal(true);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleCheckout = (items: Array<CartItem & { product: Product }>) => {
    setCartItems(items);
    setShowCartModal(false);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    loadCartCount();
    alert('Order placed successfully!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user && profile?.role === 'seller') {
    return (
      <Router>
        <div className="min-h-screen bg-cream-50">
          <Header
            onAuthClick={() => setShowAuthModal(true)}
            onCartClick={() => setShowCartModal(true)}
            onChatsClick={() => setShowChatModal(true)}
          />
          <Routes>
            <Route path="/seller/*" element={<SellerDashboard />} />
            <Route path="*" element={<Navigate to="/seller" replace />} />
          </Routes>
          <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
        </div>
      </Router>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Header
          onAuthClick={() => setShowAuthModal(true)}
          onCartClick={() => setShowCartModal(true)}
          onChatsClick={() => setShowChatModal(true)}
          cartCount={cartCount}
        />

        {profile?.role === 'seller' ? (
          <SellerDashboard />
        ) : (
          <main className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="mb-12 bg-green-700 text-white rounded-xl p-8 md:p-12">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Eco-Friendly Paper Water Bottles</h1>
                <p className="text-lg mb-6 text-green-100">
                  Sustainable, biodegradable, and stylish water bottles that help reduce plastic waste.
                  Perfect for homes, offices, and outdoor adventures.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setSizeFilter('all')}
                    className={`px-4 py-2 rounded-full ${sizeFilter === 'all' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
                  >
                    All Sizes
                  </button>
                  <button 
                    onClick={() => setSizeFilter('500')}
                    className={`px-4 py-2 rounded-full ${sizeFilter === '500' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
                  >
                    500ml
                  </button>
                  <button 
                    onClick={() => setSizeFilter('750')}
                    className={`px-4 py-2 rounded-full ${sizeFilter === '750' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
                  >
                    750ml
                  </button>
                </div>
              </div>
            </section>

            {/* Products Grid */}
            <section className="mb-16">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {sizeFilter === 'all' ? 'All Products' : `${sizeFilter}ml Bottles`}
                  <span className="text-gray-500 text-lg ml-2">({filteredProducts.length} items)</span>
                </h2>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product: Product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onMessageSeller={handleMessageSeller}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                  <button 
                    onClick={() => setSizeFilter('all')}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          </main>
        )}

        <section className="bg-green-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Join the Sustainable Movement</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Every EcoPure bottle saves plastic from our oceans and landfills. Make the switch today.
            </p>
            <button
              onClick={() => !user && setShowAuthModal(true)}
              className="bg-white text-green-700 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors font-semibold"
            >
              {user ? 'Shop Now' : 'Get Started'}
            </button>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">About EcoPure</h3>
                <p className="text-sm">
                  Leading the way in sustainable packaging with innovative paper water bottles.
                  FSSAI certified and 100% eco-friendly.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>About Us</li>
                  <li>Products</li>
                  <li>Certifications</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Contact</h3>
                <p className="text-sm">
                  Email: hello@ecopure.com<br />
                  Phone: +91 98765 43210
                </p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              2024 EcoPure. All rights reserved.
            </div>
          </div>
        </footer>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <CartModal
          isOpen={showCartModal}
          onClose={() => setShowCartModal(false)}
          onCheckout={handleCheckout}
        />
        <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          items={cartItems}
          onSuccess={handleCheckoutSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Header
        onAuthClick={() => setShowAuthModal(true)}
        onCartClick={() => setShowCartModal(true)}
        onChatsClick={() => setShowChatModal(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 bg-green-700 text-white rounded-xl p-8 md:p-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Eco-Friendly Paper Water Bottles</h1>
            <p className="text-lg mb-6 text-green-100">
              Sustainable, biodegradable, and stylish water bottles that help reduce plastic waste.
              Perfect for homes, offices, and outdoor adventures.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setSizeFilter('all')}
                className={`px-4 py-2 rounded-full ${sizeFilter === 'all' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
              >
                All Sizes
              </button>
              <button 
                onClick={() => setSizeFilter('500')}
                className={`px-4 py-2 rounded-full ${sizeFilter === '500' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
              >
                500ml
              </button>
              <button 
                onClick={() => setSizeFilter('750')}
                className={`px-4 py-2 rounded-full ${sizeFilter === '750' ? 'bg-white text-green-700' : 'bg-green-600 text-white'} font-medium`}
              >
                750ml
              </button>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {sizeFilter === 'all' ? 'All Products' : `${sizeFilter}ml Bottles`}
              <span className="text-gray-500 text-lg ml-2">({filteredProducts.length} items)</span>
            </h2>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onMessageSeller={handleMessageSeller}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <button 
                onClick={() => setSizeFilter('all')}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>

      <section className="bg-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Sustainable Movement</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Every EcoPure bottle saves plastic from our oceans and landfills. Make the switch today.
          </p>
          <button
            onClick={() => !user && setShowAuthModal(true)}
            className="bg-white text-green-700 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors font-semibold"
          >
            {user ? 'Shop Now' : 'Get Started'}
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">About EcoPure</h3>
              <p className="text-sm">
                Leading the way in sustainable packaging with innovative paper water bottles.
                FSSAI certified and 100% eco-friendly.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Products</li>
                <li>Certifications</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <p className="text-sm">
                Email: hello@ecopure.com<br />
                Phone: +91 98765 43210
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2024 EcoPure. All rights reserved.
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <CartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        onCheckout={handleCheckout}
      />
      <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        items={cartItems}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

export default App;
