import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, Calendar, Truck, Store, Users } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header';

export default function CheckoutPage() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup');
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [isRecurringOrder, setIsRecurringOrder] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    paymentMethod: 'Chuyển khoản',
    notes: '',
    promoCode: '',
    groupName: '',
    groupMembers: '',
    groupAddress: '',
    groupNotes: '',
    recurringFrequency: 'weekly',
    recurringDay: 'monday',
    recurringStartDate: '',
    recurringDuration: '3',
  });

  const subtotal = getTotalPrice();
  const shipping = isGroupOrder ? 0 : 0; // Miễn phí ship khi đặt nhóm
  const recurringDiscount = isRecurringOrder ? subtotal * 0.05 : 0; // Giảm 5% cho đơn định kỳ
  const vat = subtotal * 0.0476; // 4.76% VAT
  const total = subtotal + shipping - recurringDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart();
    navigate('/order-success');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng trống</h2>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Organica</h1>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Đăng nhập banner */}
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Đăng nhập để mua hàng tiện lợi và nhận nhiều ưu đãi hơn nữa
              </p>
              <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Đăng nhập
              </button>
            </div>

            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    deliveryType === 'delivery'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Giao tận nơi
                </button>
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    deliveryType === 'pickup'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Nhận tại cửa hàng
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />
                
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full px-3 py-2.5 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🇻🇳</span>
                </div>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email (không bắt buộc)"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />

                {deliveryType === 'pickup' && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors">
                    <Calendar className="w-4 h-4" />
                    Chọn cửa hàng
                  </button>
                )}
              </div>
            </div>

            {/* Đặt theo nhóm */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-800">Đặt theo nhóm</h2>
                  {isGroupOrder && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      🎉 Ưu đãi nhóm
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGroupOrder}
                    onChange={(e) => setIsGroupOrder(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Bật đặt nhóm</span>
                </label>
              </div>

              {isGroupOrder && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Đặt theo nhóm để được miễn phí ship và nhiều ưu đãi khác!
                    </p>
                  </div>

                  <input
                    type="text"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleInputChange}
                    placeholder="Tên nhóm/cộng đồng (VD: Chung cư Vinhomes, Công ty ABC)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />

                  <input
                    type="number"
                    name="groupMembers"
                    value={formData.groupMembers}
                    onChange={handleInputChange}
                    placeholder="Số thành viên trong nhóm"
                    min="2"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />

                  <input
                    type="text"
                    name="groupAddress"
                    value={formData.groupAddress}
                    onChange={handleInputChange}
                    placeholder="Địa chỉ giao hàng chung"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />

                  <textarea
                    name="groupNotes"
                    value={formData.groupNotes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú cho đơn hàng nhóm (VD: Phân phối cho từng người, liên hệ trưởng nhóm...)"
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none"
                  />
                </div>
              )}
            </div>

            {/* Đặt hẹn giao định kỳ */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-800">Đặt hẹn giao định kỳ</h2>
                  {isRecurringOrder && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      ⏰ Giao tự động
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurringOrder}
                    onChange={(e) => setIsRecurringOrder(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Bật giao định kỳ</span>
                </label>
              </div>

              {isRecurringOrder && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Đặt giao định kỳ để tiết kiệm thời gian và được giảm 5% cho mỗi đơn!
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tần suất giao hàng
                    </label>
                    <select
                      name="recurringFrequency"
                      value={formData.recurringFrequency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="weekly">Hàng tuần</option>
                      <option value="biweekly">2 tuần/lần</option>
                      <option value="monthly">Hàng tháng</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Ngày giao hàng
                      </label>
                      <select
                        name="recurringDay"
                        value={formData.recurringDay}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      >
                        <option value="monday">Thứ 2</option>
                        <option value="tuesday">Thứ 3</option>
                        <option value="wednesday">Thứ 4</option>
                        <option value="thursday">Thứ 5</option>
                        <option value="friday">Thứ 6</option>
                        <option value="saturday">Thứ 7</option>
                        <option value="sunday">Chủ nhật</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Thời gian duy trì
                      </label>
                      <select
                        name="recurringDuration"
                        value={formData.recurringDuration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      >
                        <option value="1">1 tháng</option>
                        <option value="3">3 tháng</option>
                        <option value="6">6 tháng</option>
                        <option value="12">12 tháng</option>
                        <option value="unlimited">Không giới hạn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Bắt đầu từ ngày
                    </label>
                    <input
                      type="date"
                      name="recurringStartDate"
                      value={formData.recurringStartDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">Tóm tắt lịch giao hàng:</p>
                    <p className="text-xs text-gray-600">
                      Giao hàng mỗi{' '}
                      <span className="font-medium text-gray-800">
                        {formData.recurringFrequency === 'weekly' 
                          ? 'tuần' 
                          : formData.recurringFrequency === 'biweekly' 
                          ? '2 tuần' 
                          : 'tháng'}
                      </span>
                      {' '}vào{' '}
                      <span className="font-medium text-gray-800">
                        {formData.recurringDay === 'monday' ? 'Thứ 2' :
                         formData.recurringDay === 'tuesday' ? 'Thứ 3' :
                         formData.recurringDay === 'wednesday' ? 'Thứ 4' :
                         formData.recurringDay === 'thursday' ? 'Thứ 5' :
                         formData.recurringDay === 'friday' ? 'Thứ 6' :
                         formData.recurringDay === 'saturday' ? 'Thứ 7' : 'Chủ nhật'}
                      </span>
                      {', '}trong{' '}
                      <span className="font-medium text-gray-800">
                        {formData.recurringDuration === 'unlimited' 
                          ? 'thời gian không giới hạn' 
                          : `${formData.recurringDuration} tháng`}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
              
              <div className="space-y-2">
                {[
                  { value: 'Chuyển khoản', icon: '💳' },
                  { value: 'Tiền mặt', icon: '💵' },
                  { value: 'Visa/Master', icon: '💳' },
                  { value: 'Cần trợ công nợ', icon: '💰' },
                  { value: 'ZaloPay', icon: '💳' },
                  { value: 'Thanh toán online qua ví MoMo', icon: '🏦' },
                  { value: 'Ví Trả Sau - MoMo', icon: '💳' },
                  { value: 'Momo', icon: '🏦' },
                  { value: 'Chuyển khoản qua QR - BIDV', icon: '📱' },
                  { value: 'Thanh toán khi giao hàng (COD)', icon: '📦' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm text-gray-700">{method.value}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hoá đơn điện tử */}
            {/* <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">Hoá đơn điện tử</h2>
                <button className="text-sm text-primary hover:underline">
                  Yêu cầu xuất →
                </button>
              </div>
            </div> */}

            {/* Ghi chú đơn hàng */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Ghi chú đơn hàng</h2>
              
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Ghi chú..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-5 shadow-sm sticky top-6 space-y-5">
              {/* Giỏ hàng */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4">Giỏ hàng</h3>
                
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs text-gray-500">Ổi</p>
                          <button className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span>Default Title</span>
                          <span>›</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">{item.price.toLocaleString('vi-VN')}₫</p>
                          <div className="flex items-center gap-1 border border-gray-300 rounded">
                            <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-50">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium px-2">{item.quantity}</span>
                            <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-50">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">invoice : no</p>
                </div>
              </div>

              {/* Mã khuyến mãi */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Mã khuyến mãi</h3>
                
                <button className="w-full flex items-center justify-between p-3 mb-3 border border-gray-300 rounded-lg text-left hover:border-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎫</span>
                    <span className="text-sm text-gray-600">Chọn mã</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleInputChange}
                    placeholder="Nhập mã khuyến mãi"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                  <button className="px-5 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm whitespace-nowrap">
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng tiền hàng</span>
                    <span className="font-medium text-gray-800">{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    {isGroupOrder ? (
                      <span className="font-medium text-green-600">Miễn phí</span>
                    ) : (
                      <span className="font-medium text-gray-800">-</span>
                    )}
                  </div>
                  {isGroupOrder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Giảm giá đặt nhóm</span>
                      <span className="font-medium text-green-600">-0₫</span>
                    </div>
                  )}
                  {isRecurringOrder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Giảm giá đơn định kỳ (5%)</span>
                      <span className="font-medium text-blue-600">-{recurringDiscount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base font-semibold text-gray-800">Tổng thanh toán</span>
                      <span className="text-lg font-bold text-gray-800">{total.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <p className="text-xs text-gray-400 text-right">
                      Giá tiền đã bao gồm VAT {vat.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full px-5 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                >
                  Đặt hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}