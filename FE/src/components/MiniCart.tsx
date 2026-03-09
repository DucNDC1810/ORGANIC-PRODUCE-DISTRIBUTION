import { useState, useRef, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const QTY_MAX = 999;

export default function MiniCart() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // ── Item selection ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(cart.map((i) => i.id)));

  // Keep selection in sync when cart changes (new items auto-selected, removed items cleaned up)
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      cart.forEach((i) => { if (!next.has(i.id)) next.add(i.id); });
      next.forEach((id) => { if (!cart.find((i) => i.id === id)) next.delete(id); });
      return next;
    });
  }, [cart]);

  const allSelected = cart.length > 0 && cart.every((i) => selectedIds.has(i.id));
  const someSelected = cart.some((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map((i) => i.id)));
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedItems = cart.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout', { state: { selectedItemIds: Array.from(selectedIds) } });
  };
  // ─────────────────────────────────────────────────────────────────────

  // ── Inline qty editing ────────────────────────────────────────────────
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (id: string, current: number) => {
    setEditingQtyId(id);
    setEditingQtyValue(String(current));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = async (id: string) => {
    const parsed = parseInt(editingQtyValue, 10);
    const newQty = isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, QTY_MAX);
    setEditingQtyId(null);
    setEditingQtyValue('');
    await updateQuantity(id, newQty);
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) { e.preventDefault(); return; }
    if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); return; }
    if (e.key === 'Escape') { setEditingQtyId(null); setEditingQtyValue(''); return; }
  };
  // ─────────────────────────────────────────────────────────────────────

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
                  <p className="text-sm text-muted-foreground">{cart.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {cart.length > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-muted-foreground">All</span>
                  </label>
                )}
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
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
                      className={`flex gap-3 p-4 bg-muted rounded-xl transition-opacity ${!selectedIds.has(item.id) ? 'opacity-50' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </div>
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
                            {editingQtyId === item.id ? (
                              <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={3}
                                value={editingQtyValue}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setEditingQtyValue(e.target.value.replace(/\D/g, ''))}
                                onBlur={() => commitEdit(item.id)}
                                onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                                className="w-8 text-center font-medium text-foreground bg-transparent outline-none border border-primary rounded text-sm"
                              />
                            ) : (
                              <button
                                onClick={() => startEdit(item.id, item.quantity)}
                                className="w-8 text-center font-medium text-foreground hover:bg-muted rounded transition-colors py-0.5"
                                title="Click to edit quantity"
                              >
                                {item.quantity}
                              </button>
                            )}
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
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-muted-foreground">
                                ${item.price.toFixed(2)} each
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
                  <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {selectedItems.length > 0 && selectedItems.length < cart.length && (
                  <p className="text-xs text-muted-foreground -mt-2">{selectedItems.length} of {cart.length} items selected</p>
                )}

                {/* Note */}
                <p className="text-sm text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Link
                      to="/cart"
                      onClick={closeCart}
                      className="flex-1 px-4 py-3 bg-white border-2 border-primary text-primary rounded-xl font-semibold text-center hover:bg-primary/5 transition-colors text-sm"
                    >
                      View Cart
                    </Link>
                    <button
                      onClick={() => clearCart()}
                      className="px-4 py-3 bg-white border-2 border-destructive text-destructive rounded-xl font-semibold hover:bg-destructive/5 transition-colors text-sm"
                      title="Clear all items"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    className="block w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold text-center hover:bg-primary-dark hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Checkout ({selectedItems.length}) →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
