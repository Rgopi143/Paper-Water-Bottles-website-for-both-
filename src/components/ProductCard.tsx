import { ShoppingCart, MessageSquare } from 'lucide-react';
import { Product } from '../lib/supabase';

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onMessageSeller?: (product: Product) => void;
  showActions?: boolean;
};

export function ProductCard({ product, onAddToCart, onMessageSeller, showActions = true }: ProductCardProps) {
  const mainImage = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            {product.size_ml}ml
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
            {product.wholesale_price && (
              <span className="text-sm text-gray-600 ml-2">
                (Bulk: ₹{product.wholesale_price})
              </span>
            )}
          </div>
        </div>

        {product.stock_quantity > 0 ? (
          <div className="text-sm text-gray-600 mb-3">
            {product.stock_quantity} units available
          </div>
        ) : (
          <div className="text-sm text-red-600 mb-3 font-medium">
            Out of stock
          </div>
        )}

        {showActions && product.stock_quantity > 0 && (
          <div className="flex gap-2">
            {onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            )}
            {onMessageSeller && (
              <button
                onClick={() => onMessageSeller(product)}
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                title="Message seller"
              >
                <MessageSquare size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
