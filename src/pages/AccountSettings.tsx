import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AccountSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    promotions: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
      }));
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update local profile
      updateProfile({
        ...profile,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        
        await supabase.auth.signOut();
        navigate('/');
        toast.success('Your account has been deleted successfully.');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please try again.');
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                <p className="mt-1 text-sm text-gray-500">Update your account's profile information and email address.</p>
                
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      id="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                      ZIP / Postal code
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      id="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Update Password</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ensure your account is using a long, random password to stay secure.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Email Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">Manage how you receive email notifications.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="email"
                        name="email"
                        type="checkbox"
                        checked={notifications.email}
                        onChange={handleNotificationChange}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email" className="font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-gray-500">Receive email notifications about your account and orders.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="promotions"
                        name="promotions"
                        type="checkbox"
                        checked={notifications.promotions}
                        onChange={handleNotificationChange}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="promotions" className="font-medium text-gray-700">
                        Promotional Emails
                      </label>
                      <p className="text-gray-500">Receive emails about new products, special offers, and more.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">SMS Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">Manage how you receive SMS notifications.</p>

                <div className="mt-6">
                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="sms"
                        name="sms"
                        type="checkbox"
                        checked={notifications.sms}
                        onChange={handleNotificationChange}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="sms" className="font-medium text-gray-700">
                        SMS Notifications
                      </label>
                      <p className="text-gray-500">Receive SMS notifications about your orders and delivery updates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Data Privacy</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your data privacy settings and download your personal data.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Download My Data
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Download all the data we have associated with your account.
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={handleDeleteAccount}
                  >
                    Delete My Account
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Permanently delete your account and all of your data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'profile'
                    ? 'bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700'
                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('password')}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'password'
                    ? 'bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700'
                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">Password</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'notifications'
                    ? 'bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700'
                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">Notifications</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'privacy'
                    ? 'bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700'
                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">Privacy & Data</span>
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
