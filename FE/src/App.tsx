import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ProtectedRoute, CustomerRoute, AdminRoute, ManagerRoute } from './components/ProtectedRoute';
import MiniCart from './components/MiniCart';
import ChatWidget from './components/ChatWidget';

const HomePage             = lazy(() => import('./pages/HomePage/Home'));
const CartPage             = lazy(() => import('./pages/HomePage/CartPage'));
const CheckoutPage         = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrderSuccessPage     = lazy(() => import('./pages/Checkout/OrderSuccessPage'));
const LoginPage            = lazy(() => import('./pages/HomePage/LoginPage'));
const SignUpPage           = lazy(() => import('./pages/HomePage/SignUpPage'));
const ForgotPasswordPage   = lazy(() => import('./pages/HomePage/ForgotPasswordPage'));
const ResetPasswordPage    = lazy(() => import('./pages/HomePage/ResetPasswordPage'));
const AuthCallbackPage     = lazy(() => import('./pages/HomePage/AuthCallbackPage'));
const VerifyEmailPage      = lazy(() => import('./pages/HomePage/VerifyEmailPage'));
const FarmStories          = lazy(() => import('./pages/HomePage/FarmStories'));
const BlogsPage            = lazy(() => import('./pages/HomePage/BlogsPage'));
const AboutUs              = lazy(() => import('./pages/HomePage/AboutUs'));
const Profile              = lazy(() => import('./pages/Customer/Profile'));
const AdminDashboard       = lazy(() => import('./pages/Admin/AdminDashboard'));
const ManagerDashboard     = lazy(() => import('./pages/Manager/ManagerDashboard'));
const ProductsPage         = lazy(() => import('./pages/HomePage/ProductsPage'));
const ProductDetailPage    = lazy(() => import('./pages/HomePage/ProductDetailPage'));
const GroupOrderPage       = lazy(() => import('./pages/GroupOrder/GroupOrderPage'));
const GroupOrderActivePage = lazy(() => import('./pages/GroupOrder/GroupOrderActivePage'));
const JoinGroupPage        = lazy(() => import('./pages/GroupOrder/JoinGroupPage'));
const GroupMemberPage      = lazy(() => import('./pages/GroupOrder/GroupMemberPage'));

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <GroupProvider>
          <BrowserRouter>
          <Toaster position="bottom-right" richColors />
          <MiniCart />
          <Suspense fallback={null}>
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
            {/* Invite link – requires authentication (handled inside component with sessionStorage redirect) */}
            <Route path="/join-group/:groupId" element={<JoinGroupPage />} />
            {/* Trang xem nhóm cho thành viên */}
            <Route path="/group/members" element={<GroupMemberPage />} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            <Route path="/payment-result" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            {/* Customer-only routes */}
            <Route path="/profile" element={<CustomerRoute> <Profile /></CustomerRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            {/* Manager-only routes */}
            <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
          </Routes>
          </Suspense>
          <ChatWidget />
          </BrowserRouter>
        </GroupProvider>
      </CartProvider>
    </AuthProvider>
  );
}