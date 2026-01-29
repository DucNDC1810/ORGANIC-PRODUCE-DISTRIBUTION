import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product, useCart } from '../context/CartContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-all duration-300 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square bg-white overflow-hidden p-6">
          {/* Action Buttons - Show on Hover */}
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
            className="absolute top-4 right-4 z-10 px-4 py-2 bg-emerald-500 text-white rounded-full font-semibold text-sm hover:bg-emerald-600 transition-all shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100"
          >
            Add To Cart
          </motion.button>

          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow border-t border-gray-100">
          <h3 className="font-bold text-sm text-gray-800 mb-3 uppercase tracking-wide line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto">
            <span className="text-xl font-bold text-emerald-600">
              ${product.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
