import { supabase } from '../lib/supabase';

// Test accounts
const TEST_ACCOUNTS = [
  {
    email: 'buyer1@example.com',
    password: 'Buyer@123',
    fullName: 'John Buyer',
    role: 'buyer',
    address: {
      street: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    }
  },
  {
    email: 'buyer2@example.com',
    password: 'Buyer@123',
    fullName: 'Priya Sharma',
    role: 'buyer',
    address: {
      street: '456 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    }
  },
  {
    email: 'seller@example.com',
    password: 'Seller@123',
    fullName: 'Eco Store',
    role: 'seller',
    business: {
      name: 'Eco Store',
      description: 'Eco-friendly products store',
      address: '789 Green Park',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110016',
      gst_number: '22AAAAA0000A1Z5',
      fssai_license: '12345678901234'
    }
  }
];

// Test products
const TEST_PRODUCTS = [
  {
    name: 'Premium Paper Water Bottle - 500ml',
    description: 'Eco-friendly paper water bottle, perfect for daily use. Leak-proof and durable.',
    size_ml: 500,
    price: 199,
    wholesale_price: 149,
    stock_quantity: 100,
    images: [
      'https://example.com/paper-bottle-1.jpg',
      'https://example.com/paper-bottle-2.jpg'
    ],
    certifications: {
      fda: 'FDA Approved',
      biodegradable: '100% Biodegradable'
    },
    batch_info: 'BATCH-2023-11-001',
  },
  {
    name: 'Eco Paper Bottle - 750ml',
    description: 'Large capacity paper water bottle with bamboo lid. Perfect for outdoor activities.',
    size_ml: 750,
    price: 299,
    wholesale_price: 229,
    stock_quantity: 75,
    images: [
      'https://example.com/eco-bottle-1.jpg',
      'https://example.com/eco-bottle-2.jpg'
    ],
    certifications: {
      fda: 'FDA Approved',
      biodegradable: '100% Biodegradable',
      bpa: 'BPA Free'
    },
    batch_info: 'BATCH-2023-11-002',
  },
  {
    name: 'Kids Paper Water Bottle - 350ml',
    description: 'Colorful and lightweight paper water bottle designed for kids. Safe and fun!',
    size_ml: 500, // Using 500ml as 350ml is not in the type
    price: 149,
    wholesale_price: 99,
    stock_quantity: 50,
    images: [
      'https://example.com/kids-bottle-1.jpg'
    ],
    certifications: {
      fda: 'FDA Approved',
      nonToxic: 'Non-Toxic Materials',
      bpa: 'BPA Free'
    },
    batch_info: 'BATCH-2023-11-003',
  },
];

export async function setupTestData() {
  try {
    const results = [];
    
    for (const account of TEST_ACCOUNTS) {
      // 1. Sign up test account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      });

      if (signUpError && signUpError.message !== 'User already registered') {
        console.error(`Error creating ${account.role} account:`, signUpError);
        continue;
      }

      const user = signUpData?.user || (await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })).data.user;

      if (!user) {
        console.error(`Failed to get user for ${account.email}`);
        continue;
      }

      // 2. Create user profile
      const profileData = {
        id: user.id,
        email: account.email,
        full_name: account.fullName,
        role: account.role,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.error(`Error creating profile for ${account.email}:`, profileError);
        continue;
      }

      // 3. For sellers, add business info and products
      if (account.role === 'seller' && account.business) {
        const { error: sellerError } = await supabase
          .from('seller_profiles')
          .upsert({
            user_id: user.id,
            business_name: account.business.name,
            business_description: account.business.description,
            business_address: `${account.business.address}, ${account.business.city}, ${account.business.state} - ${account.business.pincode}`,
            gst_number: account.business.gst_number,
            fssai_license: account.business.fssai_license,
            approved: true
          });

        if (sellerError) {
          console.error('Error creating seller profile:', sellerError);
          continue;
        }

        // Add test products for seller
        for (const product of TEST_PRODUCTS) {
          const { error: productError } = await supabase
            .from('products')
            .upsert({
              ...product,
              seller_id: user.id,
              is_active: true,
            });

          if (productError) {
            console.error('Error adding product:', product.name, productError);
          } else {
            console.log('Added product:', product.name);
          }
        }
      } else if (account.role === 'buyer' && account.address) {
        // Add address for buyers
        const { error: addressError } = await supabase
          .from('user_addresses')
          .upsert({
            user_id: user.id,
            is_default: true,
            full_name: account.fullName,
            phone: '9876543210',
            address_line1: account.address.street,
            city: account.address.city,
            state: account.address.state,
            pincode: account.address.pincode,
            country: account.address.country,
            address_type: 'home'
          });

        if (addressError) {
          console.error('Error adding address:', addressError);
        }
      }

      results.push({
        email: account.email,
        password: account.password,
        role: account.role,
        status: 'success'
      });
    }

    console.log('Test data setup complete!');
    console.log('You can log in with these accounts:');
    
    console.log('\n=== SELLER ACCOUNT ===');
    const seller = TEST_ACCOUNTS.find(a => a.role === 'seller');
    if (seller) {
      console.log(`Email: ${seller.email}`);
      console.log(`Password: ${seller.password}`);
    }
    
    console.log('\n=== BUYER ACCOUNTS ===');
    TEST_ACCOUNTS
      .filter(a => a.role === 'buyer')
      .forEach(buyer => {
        console.log(`Email: ${buyer.email}`);
        console.log(`Password: ${buyer.password}`);
        console.log('---');
      });
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}
