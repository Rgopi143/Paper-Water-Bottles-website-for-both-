/*
  # EcoPure Marketplace Database Schema

  ## Overview
  Complete database schema for a multi-seller eco-friendly paper water bottle marketplace
  with real-time buyer-seller chat, order management, and product catalog.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - 'buyer', 'seller', or 'admin'
  - `avatar_url` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `seller_profiles`
  Additional information for sellers
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `business_name` (text)
  - `business_description` (text)
  - `business_address` (text)
  - `gst_number` (text)
  - `fssai_license` (text)
  - `approved` (boolean) - admin approval status
  - `created_at` (timestamptz)

  ### 3. `products`
  Product catalog
  - `id` (uuid, PK)
  - `seller_id` (uuid, FK to profiles)
  - `name` (text)
  - `description` (text)
  - `size_ml` (integer) - 500 or 750
  - `price` (decimal)
  - `wholesale_price` (decimal)
  - `stock_quantity` (integer)
  - `images` (jsonb) - array of image URLs
  - `certifications` (jsonb) - FSSAI, eco certifications
  - `batch_info` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `orders`
  Order records
  - `id` (uuid, PK)
  - `order_number` (text, unique)
  - `buyer_id` (uuid, FK to profiles)
  - `seller_id` (uuid, FK to profiles)
  - `total_amount` (decimal)
  - `status` (text) - 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  - `shipping_address` (jsonb)
  - `billing_address` (jsonb)
  - `payment_status` (text) - 'pending', 'paid', 'refunded'
  - `payment_method` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `order_items`
  Individual items in orders
  - `id` (uuid, PK)
  - `order_id` (uuid, FK to orders)
  - `product_id` (uuid, FK to products)
  - `quantity` (integer)
  - `price_per_unit` (decimal)
  - `total_price` (decimal)

  ### 6. `chats`
  Chat conversations between buyers and sellers
  - `id` (uuid, PK)
  - `order_id` (uuid, FK to orders, nullable)
  - `product_id` (uuid, FK to products, nullable)
  - `buyer_id` (uuid, FK to profiles)
  - `seller_id` (uuid, FK to profiles)
  - `last_message_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 7. `messages`
  Individual messages in chats
  - `id` (uuid, PK)
  - `chat_id` (uuid, FK to chats)
  - `sender_id` (uuid, FK to profiles)
  - `text` (text)
  - `attachments` (jsonb) - array of file URLs
  - `read_by` (jsonb) - array of user IDs who read the message
  - `created_at` (timestamptz)

  ### 8. `cart_items`
  Shopping cart items for buyers
  - `id` (uuid, PK)
  - `buyer_id` (uuid, FK to profiles)
  - `product_id` (uuid, FK to products)
  - `quantity` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Buyers can read their own profiles, orders, carts, and chats
  - Sellers can read their own products, orders, and chats
  - Public can read active products
  - Authenticated users can create chats and messages
  - Only participants can access their chats and messages

  ## Indexes
  - Created on foreign keys for performance
  - Created on frequently queried fields (order_number, status, etc.)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_description text,
  business_address text,
  gst_number text,
  fssai_license text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  size_ml integer NOT NULL CHECK (size_ml IN (500, 750)),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  wholesale_price decimal(10,2) CHECK (wholesale_price > 0),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  images jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '{}'::jsonb,
  batch_info text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_unit decimal(10,2) NOT NULL CHECK (price_per_unit > 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, seller_id, order_id)
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chats_buyer ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_order ON chats(order_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  read_by jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cart_items_buyer ON cart_items(buyer_id);

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for seller_profiles
CREATE POLICY "Sellers can read own seller profile"
  ON seller_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sellers can insert own seller profile"
  ON seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can update own seller profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- RLS Policies for orders
CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products"
  ON orders FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update their orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "Buyers can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- RLS Policies for chats
CREATE POLICY "Participants can view their chats"
  ON chats FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Participants can update their chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Participants can view chat messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for cart_items
CREATE POLICY "Buyers can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can insert to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can delete from own cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (buyer_id = auth.uid());