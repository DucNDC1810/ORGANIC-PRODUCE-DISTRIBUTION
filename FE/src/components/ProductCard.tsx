import { useState } from 'react';
import { Heart, ShoppingCart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useGroup } from '../context/GroupContext';
import { groupService } from '../services/groupService';
import { Product as APIProduct } from '../services/productService';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { RatingDisplay } from './RatingDisplay';
import { formatVND } from '../utils/formatCurrency';

interface ProductCardProps {
  product: APIProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { groupSession } = useGroup();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isGroupMode  = !!(groupSession?.groupId && groupSession?.memberId);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

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
        toast.success('Đã thêm vào giỏ hàng của nhóm!', {
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

    addToCart({
      id:          product._id,
      name:        product.name,
      description: product.description,
      price:       product.price,
      image:       product.images?.[0] || product.thumbnail || '',
      category:    product.category,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group h-full"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">

        {/* ── Image ── */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link to={`/product/${product._id}`} className="block w-full h-full">
            <ImageWithFallback
              src={product.images?.[0] || product.thumbnail || ''}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Out-of-stock veil */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(w => !w); }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200
              ${wishlisted
                ? 'bg-red-500 text-white opacity-100'
                : 'bg-white/90 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
              }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Add to Cart — slides up from bottom */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`absolute bottom-0 inset-x-0 py-2.5 text-xs font-semibold text-white
                flex items-center justify-center gap-1.5
                translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out
                disabled:opacity-70
                ${isGroupMode
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
              {isGroupMode
                ? <Users className="w-3.5 h-3.5" />
                : <ShoppingCart className="w-3.5 h-3.5" />
              }
              {adding ? 'Adding…' : isGroupMode ? 'Add to Group' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* ── Info ── */}
        <div className="px-4 py-3 flex flex-col gap-1 flex-grow">
          <Link to={`/product/${product._id}`}>
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          <RatingDisplay
            rating={product.rating || 0}
            reviewCount={product.reviewCount || 0}
            size="sm"
          />

          <p className={`text-base font-bold mt-auto pt-1 ${isOutOfStock ? 'text-gray-400' : 'text-emerald-600'}`}>
            {formatVND(product.price)}
          </p>
        </div>

      </div>
    </motion.div>
  );
}
