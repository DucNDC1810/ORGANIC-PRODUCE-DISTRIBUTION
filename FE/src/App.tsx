import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, CustomerRoute, AdminRoute, ManagerRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage/Home';
import CartPage from './pages/HomePage/CartPage';
import CheckoutPage from './pages/HomePage/CheckoutPage';
import OrderSuccessPage from './pages/HomePage/OrderSuccessPage';
import LoginPage from './pages/HomePage/LoginPage';
import SignUpPage from './pages/HomePage/SignUpPage';
import ForgotPasswordPage from './pages/HomePage/ForgotPasswordPage';
import ResetPasswordPage from './pages/HomePage/ResetPasswordPage';
import AuthCallbackPage from './pages/HomePage/AuthCallbackPage';
import VerifyEmailPage from './pages/HomePage/VerifyEmailPage';
import RecipesCooking from './pages/HomePage/RecipesCooking';
import FarmStories from './pages/HomePage/FarmStories';
import MarketNewsTips from './pages/HomePage/MarketNewsTips';
import AboutUs from './pages/HomePage/AboutUs';
import Profile from './pages/Customer/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ProductsPage from './pages/HomePage/ProductsPage';
import ProductDetailPage from './pages/HomePage/ProductDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/blogs/cooking-tips" element={<RecipesCooking />} />
            <Route path="/blogs/green-living" element={<FarmStories />} />
            <Route path="/blogs/news-offers" element={<MarketNewsTips />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:category" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />

            {/* Protected routes - require authentication */}
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            {/* Customer-only routes */}
            <Route path="/profile" element={<CustomerRoute> <Profile /></CustomerRoute>} />

            {/* Admin-only routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            {/* Manager-only routes */}
            <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}