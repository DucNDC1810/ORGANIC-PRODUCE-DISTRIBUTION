import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ProtectedRoute, AdminRoute, ManagerRoute, ShipperRoute } from './components/ProtectedRoute';
import MiniCart from './components/MiniCart';
import HomePage from './pages/HomePage/Home';
import CartPage from './pages/HomePage/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderSuccessPage from './pages/Checkout/OrderSuccessPage';
import OrderFailurePage from './pages/Checkout/OrderFailurePage';
import LoginPage from './pages/HomePage/LoginPage';
import SignUpPage from './pages/HomePage/SignUpPage';
import ForgotPasswordPage from './pages/HomePage/ForgotPasswordPage';
import ResetPasswordPage from './pages/HomePage/ResetPasswordPage';
import AuthCallbackPage from './pages/HomePage/AuthCallbackPage';
import VerifyEmailPage from './pages/HomePage/VerifyEmailPage';
import FarmStories from './pages/HomePage/FarmStories';
import BlogsPage from './pages/HomePage/BlogsPage';
import AboutUs from './pages/HomePage/AboutUs';
import Profile from './pages/Customer/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ShipperDashboard from './pages/Shipper/ShipperDashboard';
import ProductsPage from './pages/HomePage/ProductsPage';
import ProductDetailPage from './pages/HomePage/ProductDetailPage';
import ChatWidget from './components/ChatWidget';
import GroupSessionBar from './components/GroupSessionBar';
import GroupOrderPage from './pages/GroupOrder/GroupOrderPage';
import GroupOrderActivePage from './pages/GroupOrder/GroupOrderActivePage';
import JoinGroupPage from './pages/GroupOrder/JoinGroupPage';
import GroupMemberPage from './pages/GroupOrder/GroupMemberPage';
import GroupOrderSuccess from './pages/GroupOrder/GroupOrderSuccess';
import GroupOwnerSuccessPage from './pages/GroupOrder/GroupOwnerSuccessPage';
import TopupResultPage from './pages/Wallet/TopupResultPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <GroupProvider>
          <BrowserRouter>
            <Toaster position="bottom-right" richColors />
            <MiniCart />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/blogs/green-living" element={<BlogsPage />} />
              <Route path="/blogs/news-offers" element={<FarmStories />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:category" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />

              {/* Protected routes - require authentication */}
              <Route path="/group-order" element={<ProtectedRoute><GroupOrderPage /></ProtectedRoute>} />
              <Route path="/group-order/active" element={<ProtectedRoute><GroupOrderActivePage /></ProtectedRoute>} />
              {/* Public invite link - khong can dang nhap */}
              <Route path="/join-group/:groupId" element={<JoinGroupPage />} />
              {/* Trang xem nhom cho thanh vien - khong can dang nhap */}
              <Route path="/group/members" element={<GroupMemberPage />} />
              {/* Trang xác nhận thành công cho nhóm */}
              <Route path="/group-order/success" element={<ProtectedRoute><GroupOrderSuccess /></ProtectedRoute>} />
              {/* Trang xác nhận thành công cho chủ nhóm */}
              <Route path="/group-order/owner-success" element={<ProtectedRoute><GroupOwnerSuccessPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
              <Route path="/order-failed" element={<ProtectedRoute><OrderFailurePage /></ProtectedRoute>} />
              <Route path="/payment-result" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
              {/* Profile - accessible by all authenticated users */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              {/* /wallet-topup = new redirect URL; /wallet = legacy MoMo redirect — both render the same result page */}
              <Route path="/wallet-topup" element={<ProtectedRoute><TopupResultPage /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><TopupResultPage /></ProtectedRoute>} />
              {/* Customer-only routes */}
              {/* <Route path="/profile" element={<CustomerRoute> <Profile /></CustomerRoute>} /> */}

              {/* Admin-only routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              {/* Manager-only routes */}
              {/* Shipper-only routes */}
              <Route path="/shipper/*" element={<ShipperRoute><ShipperDashboard /></ShipperRoute>} />
              <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
            </Routes>
            <ChatWidget />
            <GroupSessionBar />
          </BrowserRouter>
        </GroupProvider>
      </CartProvider>
    </AuthProvider>
  );
}