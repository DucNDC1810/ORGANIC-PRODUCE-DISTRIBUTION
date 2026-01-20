import { useState } from 'react';
import { User, ShoppingBag, MapPin, LogOut, Phone, Mail, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: 'delivered' | 'processing' | 'shipped';
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#ORD001',
    date: '08/15/2023',
    items: [
      { name: 'Hass Avocado', quantity: 2, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100' },
      { name: 'Cherry Tomatoes', quantity: 1, image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=100' },
    ],
    total: 24.50,
    status: 'delivered'
  },
  {
    id: '2',
    orderNumber: '#ORD002',
    date: '08/14/2023',
    items: [
      { name: 'Fresh Strawberries', quantity: 1, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100' },
    ],
    total: 18.00,
    status: 'delivered'
  },
  {
    id: '3',
    orderNumber: '#ORD003',
    date: '08/12/2023',
    items: [
      { name: 'Hass Avocado', quantity: 1, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100' },
    ],
    total: 31.50,
    status: 'delivered'
  }
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'orders' | 'shipping'>('account');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-[#00B207]';
      case 'processing':
        return 'text-[#F3A123]';
      case 'shipped':
        return 'text-[#2563EB]';
      default:
        return 'text-[#6A7282]';
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
              {/* User Profile Header */}
              <div className="p-6 text-center border-b border-[#E5E7EB]">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00B207] flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#101828]">{user?.name || 'John Anderson'}</h3>
              </div>

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
                  onClick={() => setActiveTab('shipping')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${
                    activeTab === 'shipping'
                      ? 'bg-[#EDF2EE] text-[#00B207]'
                      : 'text-[#364153] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Shipping Address</span>
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
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-2xl font-bold text-[#101828] mb-6">Account Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="w-10 h-10 rounded-full bg-[#EDF2EE] flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#00B207]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#6A7282] mb-1">Phone Number</p>
                      <p className="text-base font-medium text-[#101828]">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="w-10 h-10 rounded-full bg-[#EDF2EE] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#00B207]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#6A7282] mb-1">Email</p>
                      <p className="text-base font-medium text-[#101828]">{user?.email || 'john.anderson@email.com'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="w-10 h-10 rounded-full bg-[#EDF2EE] flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-[#00B207]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#6A7282] mb-1">Address</p>
                      <p className="text-base font-medium text-[#101828]">123 Main Street, New York, NY 10001</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders Section */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-2xl font-bold text-[#101828] mb-6">Recent Orders</h2>
                
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border border-[#E5E7EB] rounded-xl p-5 hover:border-[#00B207] transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-[#101828] mb-1">Order {order.orderNumber}</h3>
                          <p className="text-sm text-[#6A7282]">{order.date}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)} bg-[#EDF2EE]`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover border border-[#E5E7EB]"
                            />
                            <div>
                              <p className="text-sm font-medium text-[#101828]">{item.name}</p>
                              <p className="text-xs text-[#6A7282]">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                        <p className="text-sm text-[#6A7282]">Total</p>
                        <p className="text-xl font-bold text-[#00B207]">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <h2 className="text-2xl font-bold text-[#101828] mb-6">Order History</h2>
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border border-[#E5E7EB] rounded-xl p-5 hover:border-[#00B207] transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-[#101828] mb-1">Order {order.orderNumber}</h3>
                          <p className="text-sm text-[#6A7282]">{order.date}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)} bg-[#EDF2EE]`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover border border-[#E5E7EB]"
                            />
                            <div>
                              <p className="text-sm font-medium text-[#101828]">{item.name}</p>
                              <p className="text-xs text-[#6A7282]">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                        <p className="text-sm text-[#6A7282]">Total</p>
                        <p className="text-xl font-bold text-[#00B207]">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address Tab */}
            {activeTab === 'shipping' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#101828]">Shipping Address</h2>
                  <button className="px-4 py-2 bg-[#00B207] text-white rounded-lg font-medium hover:bg-[#00B207]/90 transition-all">
                    Add New Address
                  </button>
                </div>
                
                <div className="p-6 rounded-xl bg-[#F9FAFB] border-2 border-[#00B207]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-[#101828] mb-1">Home</h3>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-[#00B207] bg-[#EDF2EE]">
                        Default
                      </span>
                    </div>
                    <button className="text-sm text-[#00B207] font-medium hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[#364153]"><span className="font-medium">Name:</span> {user?.name || 'John Anderson'}</p>
                    <p className="text-[#364153]"><span className="font-medium">Phone:</span> +1 (555) 123-4567</p>
                    <p className="text-[#364153]"><span className="font-medium">Address:</span> 123 Main Street, New York, NY 10001</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
