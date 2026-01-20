import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage/Home';
import CartPage from './pages/HomePage/CartPage';
import CheckoutPage from './pages/HomePage/CheckoutPage';
import OrderSuccessPage from './pages/HomePage/OrderSuccessPage';
import LoginPage from './pages/HomePage/LoginPage';
import SignUpPage from './pages/HomePage/SignUpPage';
import ForgotPasswordPage from './pages/HomePage/ForgotPasswordPage';
import RecipesCooking from './pages/HomePage/RecipesCooking';
import FarmStories from './pages/HomePage/FarmStories';
import MarketNewsTips from './pages/HomePage/MarketNewsTips';
import AboutUs from './pages/HomePage/AboutUs';
import Profile from './pages/Customer/Profile';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/blogs/cooking-tips" element={<RecipesCooking />} />
            <Route path="/blogs/green-living" element={<FarmStories />} />
            <Route path="/blogs/news-offers" element={<MarketNewsTips />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}