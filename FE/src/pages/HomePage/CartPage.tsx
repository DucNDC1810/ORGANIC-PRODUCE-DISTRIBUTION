import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingCart, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import Header from '../../components/Header';
import { formatVND } from '../../utils/formatCurrency';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCart();

  const subtotal = getTotalPrice();
  const shipping = subtotal > 0 ? (subtotal >= 50 ? 0 : 5.99) : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cart.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Your cart is empty</h2>
            <p className="text-xl text-muted-foreground mb-8">Let's add some fresh products!</p>
            <Link
              to="/"
              className="px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg transition-all"
            >
              Shop Now
            </Link>
          </motion.div>
        ) : (
          /* Cart Content */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
                <p className="text-muted-foreground">{cart.length} items in your cart</p>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <Link 
                        to={`/product/${item.id}`} 
                        className="w-32 h-32 bg-muted rounded-xl overflow-hidden flex-shrink-0 block relative z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Link 
                              to={`/product/${item.id}`} 
                              className="block relative z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="text-lg font-semibold text-foreground mb-1 hover:text-primary transition-colors cursor-pointer">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="mt-2 inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
                              {item.category}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Quantity:</span>
                            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                              >
                                <Minus className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <span className="w-12 text-center font-semibold text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {formatVND(item.price * item.quantity)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-sm text-muted-foreground">
                                {formatVND(item.price)} / sản phẩm
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Summary - Right Column (1/3) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

                  {/* Price Breakdown */}
                  <div className="space-y-3 py-4 border-y border-border">
                    <div className="flex justify-between text-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatVND(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-primary">Miễn phí</span>
                        ) : (
                          formatVND(shipping)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Thuế</span>
                      <span className="font-medium">{formatVND(tax)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-3xl font-bold text-primary">{formatVND(total)}</span>
                  </div>

                  {/* Free Shipping Message */}
                  {subtotal < 50 && subtotal > 0 && (
                    <div className="p-4 bg-secondary rounded-xl">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium text-secondary-foreground">
                            Thêm {formatVND(50 - subtotal)} nữa để được miễn phí vận chuyển!
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <Link
                    to="/checkout"
                    className="block w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold text-center hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Proceed to Checkout →
                  </Link>

                  {/* Trust Badges */}
                  <div className="pt-6 space-y-3 border-t border-border">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Shield className="w-5 h-5 text-primary" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Truck className="w-5 h-5 text-primary" />
                      <span>Fast delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}