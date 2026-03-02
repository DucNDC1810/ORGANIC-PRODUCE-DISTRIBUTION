import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useGroup } from '../context/GroupContext';
import { groupService } from '../services/groupService';
import { Product as APIProduct } from '../services/productService';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { RatingDisplay } from './RatingDisplay';

interface ProductCardProps {
  product: APIProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { groupSession } = useGroup();
  const [adding, setAdding] = useState(false);

  const isOutOfStock  = product.stock <= 0;
  const isGroupMode   = !!(groupSession?.groupId && groupSession?.memberId);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    // ── Group mode: thêm món vào giỏ nhóm ──
    if (isGroupMode) {
      setAdding(true);
      try {
        await groupService.addGroupItem(
          groupSession!.groupId,
          groupSession!.memberId!,
          {
            productId: product._id,
            name:      product.name,
            price:     product.price,
            image:     product.images?.[0] || product.thumbnail || '',
            qty:       1,
          }
        );
        toast.success(`Đã thêm vào giỏ hàng của nhóm!`, {
          description: product.name,
          icon: '🛒',
        });
      } catch {
        toast.error('Không thể thêm món. Vui lòng thử lại.');
      } finally {
        setAdding(false);
      }
      return;
    }

    // ── Normal mode: thêm vào giỏ cá nhân ──
    const cartProduct = {
      id:          product._id,
      name:        product.name,
      description: product.description,
      price:       product.price,
      image:       product.images?.[0] || product.thumbnail || '',
      category:    product.category,
    };
    addToCart(cartProduct);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <div className={`bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-all duration-300 h-full flex flex-col`}>
        {/* Product Image */}
        <div className="relative aspect-square bg-white overflow-hidden p-6">
          {/* Action Buttons - Show on Hover (only if in stock) */}
          {!isOutOfStock && (
            <>
              {/* Heart Icon - Left */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 left-4 z-10 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100"
              >
                <Heart className="w-5 h-5 text-white fill-white" />
              </motion.button>

              {/* Add Button - Right */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={adding}
                className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 disabled:opacity-70 ${
                  isGroupMode
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {adding ? '...' : isGroupMode ? '+ Nhóm' : 'Add To Cart'}
              </motion.button>
            </>
          )}

          <Link to={`/product/${product._id}`}>
            <ImageWithFallback
              src={product.images?.[0] || product.thumbnail || ''}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 cursor-pointer"
            />
          </Link>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow border-t border-gray-100">
          <Link to={`/product/${product._id}`}>
            <h3 className="font-bold text-sm text-gray-800 mb-2 uppercase tracking-wide line-clamp-2 min-h-[2.5rem] hover:text-emerald-600 transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-2">
            <RatingDisplay 
              rating={product.rating || 0}
              reviewCount={product.reviewCount || 0}
              size="sm"
            />
          </div>

          {/* Price */}
          <div className="mt-auto flex items-center justify-between">
            <span className={`text-xl font-bold ${isOutOfStock ? 'text-gray-400' : 'text-emerald-600'}`}>
              ${product.price.toFixed(2)}
            </span>
            {isOutOfStock && (
              <span className="text-xs text-red-500 font-medium">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
