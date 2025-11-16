import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
};

export type SellerProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_description?: string;
  business_address?: string;
  gst_number?: string;
  fssai_license?: string;
  approved: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  size_ml: 500 | 750;
  price: number;
  wholesale_price?: number;
  stock_quantity: number;
  images: string[];
  certifications: Record<string, string>;
  batch_info?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: Record<string, string>;
  billing_address: Record<string, string>;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
};

export type Chat = {
  id: string;
  order_id?: string;
  product_id?: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  attachments: Array<{ url: string; type: string; size: number }>;
  read_by: string[];
  created_at: string;
};

export type CartItem = {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};
