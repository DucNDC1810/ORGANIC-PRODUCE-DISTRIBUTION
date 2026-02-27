import { useState, useEffect, useRef } from 'react';
import { User, ShoppingBag, LogOut, Phone, Mail, Home, Edit2, Save, X, Camera, Package, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header';
import { userAPI } from '../Axios/Axios';
import { toast } from 'sonner';
import { orderService, Order } from '../../services/orderService';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'orders'>('account');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; orderId: string; cancelling: boolean }>({ open: false, orderId: '', cancelling: false });
  
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

  // Fetch orders when tab changes to 'orders'
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, orderFilter, orderPage]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res: any = await orderService.getMyOrders(orderPage, 10, orderFilter || undefined);
      // api.ts interceptor already unwraps response.data, so res = { success, data, pagination }
      setOrders(res.data ?? []);
      setOrderTotalPages(res.pagination?.totalPages ?? 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending:    'bg-yellow-100 text-yellow-700',
      confirmed:  'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped:    'bg-indigo-100 text-indigo-700',
      delivered:  'bg-green-100 text-green-700',
      cancelled:  'bg-red-100 text-red-700',
      refunded:   'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusColor = (status?: string) => {
    const map: Record<string, string> = {
      paid:    'text-green-600',
      pending: 'text-yellow-600',
      failed:  'text-red-600',
    };
    return map[status || ''] || 'text-gray-500';
  };

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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#101828]">Order History</h2>
                  {/* Filter */}
                  <select
                    value={orderFilter}
                    onChange={(e) => { setOrderFilter(e.target.value); setOrderPage(1); }}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#364153] focus:outline-none focus:border-[#00B207]"
                  >
                    <option value="">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B207]" />
                  </div>
                ) : (orders ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ShoppingBag className="w-16 h-16 text-[#E5E7EB] mb-4" />
                    <h3 className="text-lg font-semibold text-[#364153] mb-2">No Orders Found</h3>
                    <p className="text-sm text-[#6A7282] text-center">
                      {orderFilter ? `No orders with status "${orderFilter}".` : "You haven't placed any orders yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(orders ?? []).map((order) => (
                      <div key={order._id} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        {/* Order Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-[#F9FAFB] cursor-pointer hover:bg-[#EDF2EE] transition-colors"
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-[#00B207]" />
                            <div>
                              <p className="text-sm font-semibold text-[#101828]">
                                Order #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-[#6A7282]">
                                {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="text-sm font-bold text-[#101828]">
                              {order.totalAmount.toLocaleString('vi-VN')}₫
                            </span>
                            {expandedOrder === order._id
                              ? <ChevronUp className="w-4 h-4 text-[#6A7282]" />
                              : <ChevronDown className="w-4 h-4 text-[#6A7282]" />}
                          </div>
                        </div>

                        {/* Order Details */}
                        {expandedOrder === order._id && (
                          <div className="p-4 space-y-3">
                            {/* Items */}
                            <div className="space-y-2">
                              {(order.items ?? []).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-[#EDF2EE] text-[#00B207] px-2 py-0.5 rounded font-medium">x{item.quantity}</span>
                                    <span className="text-sm text-[#364153]">{(item as any).name || `Product`}</span>
                                  </div>
                                  <span className="text-sm font-medium text-[#101828]">{item.subtotal.toLocaleString('vi-VN')}₫</span>
                                </div>
                              ))}
                            </div>

                            {/* Summary */}
                            <div className="flex justify-between items-center pt-2 text-sm">
                              <span className="text-[#6A7282]">Payment</span>
                              <span className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}
                                {' · '}
                                <span className={`font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus || 'N/A'}
                                </span>
                              </span>
                            </div>
                            {order.shippingCost !== undefined && order.shippingCost > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-[#6A7282]">Shipping</span>
                                <span className="font-medium">{order.shippingCost.toLocaleString('vi-VN')}₫</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                              <span className="font-semibold text-[#101828]">Total</span>
                              <span className="font-bold text-[#00B207]">{order.totalAmount.toLocaleString('vi-VN')}₫</span>
                            </div>

                            {/* Cancel button for pending orders */}
                            {order.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelModal({ open: true, orderId: order._id, cancelling: false });
                                }}
                                className="mt-2 w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination */}
                    {orderTotalPages > 1 && (
                      <div className="flex justify-center gap-2 pt-4">
                        {Array.from({ length: orderTotalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => setOrderPage(p)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              p === orderPage
                                ? 'bg-[#00B207] text-white'
                                : 'bg-[#F3F4F6] text-[#364153] hover:bg-[#EDF2EE]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Cancel Order Confirmation Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !cancelModal.cancelling && setCancelModal({ open: false, orderId: '', cancelling: false })}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#101828] mb-2">Cancel Order</h3>
              <p className="text-sm text-[#6A7282] mb-1">
                Are you sure you want to cancel this order?
              </p>
              <p className="text-xs text-[#9CA3AF] mb-6">
                This action cannot be undone. Your order will be cancelled immediately.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  disabled={cancelModal.cancelling}
                  onClick={() => setCancelModal({ open: false, orderId: '', cancelling: false })}
                  className="flex-1 py-2.5 text-sm font-medium text-[#364153] bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  disabled={cancelModal.cancelling}
                  onClick={async () => {
                    setCancelModal(prev => ({ ...prev, cancelling: true }));
                    try {
                      await orderService.cancelOrder(cancelModal.orderId, 'Cancelled by user');
                      toast.success('Order cancelled successfully');
                      setCancelModal({ open: false, orderId: '', cancelling: false });
                      fetchOrders();
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to cancel order');
                      setCancelModal(prev => ({ ...prev, cancelling: false }));
                    }
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelModal.cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
