import { useState, useEffect, useRef } from 'react';
import { User, ShoppingBag, LogOut, Phone, Mail, Home, Edit2, Save, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header';
import { userAPI } from '../Axios/Axios';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'orders'>('account');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    avatar: string;
    gender: 'male' | 'female' | 'other' | '';
    dateOfBirth: string;
  }>({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    clearLocalCart();
    logout();
    navigate('/');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        avatar: user?.avatar || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const updateData = {
        ...formData,
        gender: formData.gender || undefined
      };
      const updatedUser = await userAPI.updateUser(user._id, updateData);
      
      // Update auth context with new user data
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: base64String }));
        toast.success('Avatar updated! Click Save to apply changes.');
      };
      reader.onerror = () => {
        toast.error('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
             

              {/* Navigation Menu */}
              <nav className="p-4">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${
                    activeTab === 'account'
                      ? 'bg-[#EDF2EE] text-[#00B207]'
                      : 'text-[#364153] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Account Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${
                    activeTab === 'orders'
                      ? 'bg-[#EDF2EE] text-[#00B207]'
                      : 'text-[#364153] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">Order History</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-[#364153] hover:bg-[#F3F4F6]"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Information Section */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                {/* Header with Edit Button */}
                <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
                  <h2 className="text-2xl font-bold text-[#101828]">Account Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00B207] text-white rounded-lg font-medium hover:bg-[#00B207]/90 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00B207] text-white rounded-lg font-medium hover:bg-[#00B207]/90 transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 p-6 mb-6 rounded-xl bg-gradient-to-r from-[#EDF2EE] to-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div
                        onClick={handleAvatarClick}
                        className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}
                      >
                        {formData.avatar || user?.avatar ? (
                          <img
                            src={formData.avatar || user?.avatar}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User') + '&background=00B207&color=fff&size=200';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00B207] to-[#00B207]/80 flex items-center justify-center border-4 border-white shadow-lg">
                            <User className="w-12 h-12 text-white" />
                          </div>
                        )}
                        {isEditing && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#00B207] rounded-full flex items-center justify-center shadow-md">
                              <Edit2 className="w-4 h-4 text-white" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[#101828] mb-1">{user?.name || 'Your Name'}</h3>
                      <p className="text-sm text-[#6A7282] mb-2">{user?.email}</p>
                      {isEditing && (
                        <p className="text-xs text-[#6A7282]">
                          <Camera className="w-3 h-3 inline mr-1" />
                          Click on avatar to change photo (Max 2MB)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="group">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                          placeholder="Enter your name"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <User className="w-5 h-5 text-[#00B207]" />
                          <span className="text-[#101828] font-medium">{user?.name || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Email Address</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                        <Mail className="w-5 h-5 text-[#00B207]" />
                        <span className="text-[#101828] font-medium">{user?.email || 'Not set'}</span>
                      </div>
                      {isEditing && <p className="text-xs text-[#6A7282] mt-1">Email cannot be changed</p>}
                    </div>

                    {/* Phone */}
                    <div className="group">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <Phone className="w-5 h-5 text-[#00B207]" />
                          <span className="text-[#101828] font-medium">{user?.phone || 'Not set'}</span>
                        </div>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="group">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Gender</label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <User className="w-5 h-5 text-[#00B207]" />
                          <span className="text-[#101828] font-medium">
                            {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="group md:col-span-2">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Date of Birth</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <User className="w-5 h-5 text-[#00B207]" />
                          <span className="text-[#101828] font-medium">
                            {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'Not set'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="group md:col-span-2">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Shipping Address</label>
                      {isEditing ? (
                        <textarea
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                          placeholder="Enter your complete address"
                          rows={3}
                        />
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <Home className="w-5 h-5 text-[#00B207] mt-0.5" />
                          <span className="text-[#101828] font-medium">{user?.address || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-2xl font-bold text-[#101828] mb-6">Order History</h2>
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="w-16 h-16 text-[#E5E7EB] mb-4" />
                  <h3 className="text-lg font-semibold text-[#364153] mb-2">No Orders Yet</h3>
                  <p className="text-sm text-[#6A7282] text-center">You haven't placed any orders yet.<br />Start shopping to see your order history here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
