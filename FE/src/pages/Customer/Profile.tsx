import { useState, useEffect, useRef } from 'react';
import { User, ShoppingBag, LogOut, Phone, Mail, Home, Edit2, Save, X, Camera, CalendarClock, Wallet, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header';
import { userAPI } from '../Axios/Axios';
import { toast } from 'sonner';
import OrderHistoryTab from './OrderHistoryTab';
import SubscriptionTab from './SubscriptionTab';
import WalletTab from './WalletTab';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'account' | 'orders' | 'subscriptions' | 'wallet'>(
    (searchParams.get('tab') as any) || 'account'
  );

  // Redirect to login if not authenticated, preserve full return URL
  useEffect(() => {
    if (user === null) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${returnUrl}`, { replace: true });
    }
  }, [user, navigate]);

  // Sync tab from URL param
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'orders' || t === 'subscriptions' || t === 'account' || t === 'wallet') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'account' | 'orders' | 'subscriptions' | 'wallet') => {
    setActiveTab(tab);
    setSearchParams(tab !== 'account' ? { tab } : {});
  };
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipSyncRef = useRef(false);

  // Province/District/Ward state
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ code: number; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: number; name: string }[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<{ code: number; name: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ code: number; name: string } | null>(null);
  const [selectedWard, setSelectedWard] = useState<{ code: number; name: string } | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [locationTab, setLocationTab] = useState<'province' | 'district' | 'ward'>('province');
  const [locationSearch, setLocationSearch] = useState('');
  const locationPanelRef = useRef<HTMLDivElement>(null);
  const locationSearchRef = useRef<HTMLInputElement>(null);

  const normalise = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    street: string;
    avatar: string;
    gender: 'male' | 'female' | 'other' | '';
    dateOfBirth: string;
  }>({
    name: user?.name || '',
    phone: user?.phone || '',
    street: (user as any)?.street || '',
    avatar: user?.avatar || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  });

  // Update form data when user changes (skip if we just saved to avoid overwriting fresh data)
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        street: (user as any)?.street || '',
        avatar: user.avatar || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
      });
      if ((user as any).province) setSelectedProvince({ code: 0, name: (user as any).province });
      if ((user as any).district) setSelectedDistrict({ code: 0, name: (user as any).district });
      if ((user as any).ward) setSelectedWard({ code: 0, name: (user as any).ward });
    }
  }, [user]);

  // Fetch all provinces once on mount
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=1')
      .then((r) => r.json())
      .then((data: { code: number; name: string }[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  // Close location panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationPanelRef.current && !locationPanelRef.current.contains(e.target as Node)) {
        setShowLocationPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



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
        street: (user as any)?.street || '',
        avatar: user?.avatar || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
      });
      setSelectedProvince((user as any)?.province ? { code: 0, name: (user as any).province } : null);
      setSelectedDistrict((user as any)?.district ? { code: 0, name: (user as any).district } : null);
      setSelectedWard((user as any)?.ward ? { code: 0, name: (user as any).ward } : null);
      setShowLocationPanel(false);
    }
    setIsEditing(!isEditing);
  };

  const handleProvinceChange = async (code: number, name: string) => {
    setSelectedProvince({ code, name });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    setLocationSearch('');
    setLocationTab('district');
    setLoadingDistricts(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts ?? []);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (code: number, name: string) => {
    setSelectedDistrict({ code, name });
    setSelectedWard(null);
    setLocationSearch('');
    setLocationTab('ward');
    setLoadingWards(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      const data = await res.json();
      setWards(data.wards ?? []);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = (_code: number, name: string) => {
    setSelectedWard({ code: _code, name });
    setLocationSearch('');
    setShowLocationPanel(false);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const street = formData.street.trim();
      const ward = selectedWard?.name || '';
      const district = selectedDistrict?.name || '';
      const province = selectedProvince?.name || '';

      // Build combined address string (backward-compatible with old `address` field)
      const combinedAddress = [street, ward, district, province].filter(Boolean).join(', ');

      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        avatar: formData.avatar,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth,
        // Individual fields (new schema)
        street,
        ward,
        district,
        province,
        // Combined field (existing schema – always saved)
        address: combinedAddress,
      };
      const updatedUser = await userAPI.updateUser(user._id, updateData);
      
      // Update auth context with new user data
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Sync local form/selection state from the returned user,
      // and skip the user-sync useEffect so it doesn't overwrite our fresh state
      skipSyncRef.current = true;
      setFormData({
        name: updatedUser.name || '',
        phone: updatedUser.phone || '',
        street: (updatedUser as any).street || street,
        avatar: updatedUser.avatar || '',
        gender: updatedUser.gender || '',
        dateOfBirth: updatedUser.dateOfBirth ? new Date(updatedUser.dateOfBirth).toISOString().split('T')[0] : '',
      });
      // Preserve the names we selected (API may not return ward/district/province if they were empty before)
      const savedProvince = (updatedUser as any).province || province;
      const savedDistrict = (updatedUser as any).district || district;
      const savedWard = (updatedUser as any).ward || ward;
      if (savedProvince) setSelectedProvince(prev => ({ code: prev?.code ?? 0, name: savedProvince }));
      if (savedDistrict) setSelectedDistrict(prev => ({ code: prev?.code ?? 0, name: savedDistrict }));
      if (savedWard) setSelectedWard(prev => ({ code: prev?.code ?? 0, name: savedWard }));

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
                  onClick={() => handleTabChange('account')}
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
                  onClick={() => handleTabChange('orders')}
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
                  onClick={() => handleTabChange('subscriptions')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${
                    activeTab === 'subscriptions'
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-[#364153] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <CalendarClock className="w-5 h-5" />
                  <span className="font-medium">Recurring Orders</span>
                </button>

                <button
                  onClick={() => handleTabChange('wallet')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${
                    activeTab === 'wallet'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-[#364153] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">My Wallet</span>
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

                    {/* Shipping Address */}
                    <div className="group md:col-span-2 space-y-3">
                      <label className="block text-sm font-medium text-[#6A7282] mb-2">Shipping Address</label>

                      {/* Specific address input (street/house number) */}
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) => handleInputChange('street', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00B207] transition-colors"
                          placeholder="Specific address (house number, street name)"
                        />
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                          <Home className="w-5 h-5 text-[#00B207] mt-0.5" />
                          <span className="text-[#101828] font-medium">
                            {[
                              formData.street || (user as any)?.street,
                              selectedWard?.name || (user as any)?.ward,
                              selectedDistrict?.name || (user as any)?.district,
                              selectedProvince?.name || (user as any)?.province,
                            ].filter(Boolean).join(', ') || user?.address || 'Not set'}
                          </span>
                        </div>
                      )}

                      {/* Province / District / Ward selector */}
                      {isEditing && (
                        <div className="relative" ref={locationPanelRef}>
                          <button
                            type="button"
                            onClick={() => {
                              const open = !showLocationPanel;
                              setShowLocationPanel(open);
                              if (open) {
                                const tab = !selectedProvince ? 'province'
                                  : !selectedDistrict ? 'district'
                                  : 'ward';
                                setLocationTab(tab);
                                setLocationSearch('');
                                setTimeout(() => locationSearchRef.current?.focus(), 50);
                              }
                            }}
                            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm text-left bg-white hover:border-[#00B207] focus:outline-none focus:border-[#00B207] transition-colors"
                          >
                            {selectedWard && selectedDistrict && selectedProvince ? (
                              <span className="text-[#101828]">
                                {selectedWard.name}, {selectedDistrict.name}, {selectedProvince.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">Province/City, District, Ward</span>
                            )}
                          </button>

                          {showLocationPanel && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                              {/* Tab headers */}
                              <div className="flex border-b border-gray-200">
                                {([
                                  { key: 'province' as const, label: 'Province / City' },
                                  { key: 'district' as const, label: 'District' },
                                  { key: 'ward' as const, label: 'Ward' },
                                ]).map(({ key, label }) => (
                                  <button
                                    key={key}
                                    type="button"
                                    disabled={
                                      (key === 'district' && !selectedProvince) ||
                                      (key === 'ward' && !selectedDistrict)
                                    }
                                    onClick={() => {
                                      setLocationTab(key);
                                      setLocationSearch('');
                                      setTimeout(() => locationSearchRef.current?.focus(), 50);
                                    }}
                                    className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                      locationTab === key
                                        ? 'border-[#00B207] text-[#00B207]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>

                              {/* Search */}
                              <div className="px-3 pt-2.5 pb-1.5">
                                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus-within:border-[#00B207] focus-within:bg-white transition-colors">
                                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <input
                                    ref={locationSearchRef}
                                    type="text"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    placeholder={
                                      locationTab === 'province' ? 'Tìm kiếm tỉnh/thành phố...'
                                        : locationTab === 'district' ? 'Tìm kiếm quận/huyện...'
                                        : 'Tìm kiếm phường/xã...'
                                    }
                                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                  />
                                  {locationSearch && (
                                    <button
                                      type="button"
                                      onClick={() => { setLocationSearch(''); locationSearchRef.current?.focus(); }}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* List */}
                              <div className="max-h-52 overflow-y-auto py-1">
                                {locationTab === 'province' && (() => {
                                  const filtered = locationSearch
                                    ? provinces.filter((p) => normalise(p.name).includes(normalise(locationSearch)))
                                    : provinces;
                                  return filtered.length > 0
                                    ? filtered.map((p) => (
                                        <button key={p.code} type="button"
                                          onClick={() => handleProvinceChange(p.code, p.name)}
                                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                            selectedProvince?.name === p.name ? 'text-[#00B207] font-medium bg-green-50' : 'text-gray-700'
                                          }`}
                                        >{p.name}</button>
                                      ))
                                    : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                                })()}

                                {locationTab === 'district' && (() => {
                                  if (loadingDistricts) return <p className="text-center py-6 text-sm text-gray-400">Loading...</p>;
                                  const filtered = locationSearch
                                    ? districts.filter((d) => normalise(d.name).includes(normalise(locationSearch)))
                                    : districts;
                                  return filtered.length > 0
                                    ? filtered.map((d) => (
                                        <button key={d.code} type="button"
                                          onClick={() => handleDistrictChange(d.code, d.name)}
                                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                            selectedDistrict?.name === d.name ? 'text-[#00B207] font-medium bg-green-50' : 'text-gray-700'
                                          }`}
                                        >{d.name}</button>
                                      ))
                                    : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                                })()}

                                {locationTab === 'ward' && (() => {
                                  if (loadingWards) return <p className="text-center py-6 text-sm text-gray-400">Loading...</p>;
                                  const filtered = locationSearch
                                    ? wards.filter((w) => normalise(w.name).includes(normalise(locationSearch)))
                                    : wards;
                                  return filtered.length > 0
                                    ? filtered.map((w) => (
                                        <button key={w.code} type="button"
                                          onClick={() => handleWardChange(w.code, w.name)}
                                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                            selectedWard?.name === w.name ? 'text-[#00B207] font-medium bg-green-50' : 'text-gray-700'
                                          }`}
                                        >{w.name}</button>
                                      ))
                                    : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === 'orders' && (
              <div>
                <OrderHistoryTab highlightOrderId={searchParams.get('highlight') ?? undefined} />
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscriptions' && (
              <SubscriptionTab />
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <WalletTab />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
