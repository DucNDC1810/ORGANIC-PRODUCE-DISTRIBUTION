import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function MiniCart() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();
  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Mini Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Shopping Cart</h2>
                  <p className="text-sm text-muted-foreground">{getTotalItems()} items</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-6">Add some products to get started</p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4 p-4 bg-muted rounded-xl"
                    >
                      {/* Product Image */}
                      <Link 
                        to={`/product/${item.id}`}
                        onClick={closeCart}
                        className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 block relative z-10"
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Link 
                              to={`/product/${item.id}`}
                              onClick={closeCart}
                              className="block relative z-10"
                            >
                              <h4 className="font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer">{item.name}</h4>
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-white rounded transition-colors ml-2"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <span className="w-8 text-center font-medium text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {fmt(item.price * item.quantity)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {fmt(item.price)} / sản phẩm
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">{fmt(getTotalPrice())}</span>
                </div>

                {/* Note */}
                <p className="text-sm text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="block w-full px-6 py-4 bg-white border-2 border-primary text-primary rounded-xl font-semibold text-center hover:bg-primary/5 transition-colors"
                  >
                    View Cart
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="block w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold text-center hover:bg-primary-dark hover:shadow-lg transition-all"
                  >
                    Checkout →
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
