import { useState, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Snowflake, Sun, Heart, ShoppingCart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Product } from '../services/productService';
import { formatVND } from '../utils/formatCurrency';
import { useCart } from '../context/CartContext';
import { useGroup } from '../context/GroupContext';
import { groupService } from '../services/groupService';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RatingDisplay } from './RatingDisplay';

// ──────────────────────────────────────────────────────────────────────────────
// 3 themed spreads – each has its own keyword list for product filtering
// ──────────────────────────────────────────────────────────────────────────────
const SEASON_SPREADS = [
  // ── PAGE 1: 🌞 Trái cây mùa hè ──────────────────────────────────────────
  {
    season: 'hot' as const,
    pageNum: 1,
    image: 'https://i.pinimg.com/736x/42/30/f9/4230f9c0ef9b76027f8fbeb1896957a3.jpg',
    label: 'SUMMER',
    title: 'Summer Fruits',
    subtitle: 'Cooling · hydrating · rich in vitamin C',
    gradient: 'from-orange-600/70 to-rose-700/70',
    pageColor: '#fff7ed',
    accentColor: '#f97316',
    icons: ['☀', '🍊', '🍇'],
    keywords: [
      'mango', 'xoài', 'hoa lộc', 'grape', 'nho', 'orange', 'king orange',
      'strawberry', 'dâu', 'kiwi', 'blueberr', 'việt quất', 'cantaloupe',
      'dưa lưới', 'coconut', 'dừa', 'banana', 'chuối',
    ],
  },
  // ── PAGE 2: 🥗 Rau xanh & rau củ ────────────────────────────────────────
  {
    season: 'hot' as const,
    pageNum: 2,
    image: 'https://images.fineartamerica.com/images-medium-large-5/huge-group-of-fresh-green-fruit-and-vegetables--concept-of-heal-aleksandar-mijatovic.jpg',
    label: 'FRESH GREENS',
    title: 'Fresh Greens & Vegetables',
    subtitle: 'Salads · detox · soups · stews',
    gradient: 'from-emerald-700/65 to-teal-800/70',
    pageColor: '#ecfdf5',
    accentColor: '#10b981',
    icons: ['🥗', '🥦', '🥕'],
    keywords: [
      'lettuce', 'xà lách', 'hydroponic', 'cherry tomato', 'cà chua',
      'bell pepper', 'ớt chuông', 'bok choy', 'cải', 'broccoli', 'súp lơ',
      'carrot', 'cà rốt', 'cabbage', 'bắp cải', 'potato', 'khoai',
      'asparagus', 'măng tây',
    ],
  },
  // ── PAGE 3: ❄️ Ngũ cốc & Sữa mùa đông ───────────────────────────────────
  {
    season: 'cold' as const,
    pageNum: 3,
    image: 'https://img.freepik.com/premium-photo/shavuot-kosher-food-fresh-dairy-products-milk-cottage-cheese-wheat-harvest-festival_926199-1191944.jpg',
    label: 'WINTER',
    title: 'Grains & Dairy',
    subtitle: 'Warming · nourishing · energy-boosting',
    gradient: 'from-blue-900/70 to-indigo-900/70',
    pageColor: '#eff6ff',
    accentColor: '#3b82f6',
    icons: ['❄', '🌾', '🥛'],
    keywords: [
      'rice', 'gạo', 'brown rice', 'gạo lứt', 'quinoa', 'oat', 'yến mạch',
      'glutinous', 'nếp', 'corn flour', 'bột ngô', 'milk', 'sữa',
      'yogurt', 'sữa chua', 'cream cheese', 'mozzarella', 'goat milk',
    ],
  },
] as const;

const TOTAL_SPREADS = SEASON_SPREADS.length; // always 3
const PRODUCTS_PER_PAGE = 4;

// ──────────────────────────────────────────────────────────────────────────────
// Mini product card — matches ProductCard behaviour (cart, wishlist, rating)
// ──────────────────────────────────────────────────────────────────────────────
function BookProductCard({ product }: { product: Product }) {
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
        toast.success('Added to group cart!', { description: product.name, icon: '🛒' });
      } catch {
        toast.error('Could not add item. Please try again.');
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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">

        {/* Image – flex-1 so it fills the card without forcing an aspect ratio */}
        <div className="relative flex-1 min-h-0 bg-gray-50 overflow-hidden">
          <Link to={`/product/${product._id}`} className="absolute inset-0">
            <ImageWithFallback
              src={product.images?.[0] || product.thumbnail || ''}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Out-of-stock veil */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Out of stock
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(w => !w); }}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200
              ${ wishlisted
                ? 'bg-red-500 text-white opacity-100'
                : 'bg-white/90 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
              }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Add to Cart – slides up on hover */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`absolute bottom-0 inset-x-0 py-2 text-xs font-semibold text-white
                flex items-center justify-center gap-1
                translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out
                disabled:opacity-70
                ${ isGroupMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700' }`}
            >
              {isGroupMode ? <Users className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
              {adding ? 'Adding…' : isGroupMode ? 'Add to Group' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="px-2.5 py-2 flex flex-col gap-0.5">
          <Link to={`/product/${product._id}`}>
            <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <RatingDisplay
            rating={product.rating || 0}
            reviewCount={product.reviewCount || 0}
            size="sm"
          />
          <p className={`text-sm font-bold pt-0.5 ${ isOutOfStock ? 'text-gray-400' : 'text-emerald-600' }`}>
            {formatVND(product.price)}
          </p>
        </div>

      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main BookProductSection
// ──────────────────────────────────────────────────────────────────────────────
interface BookProductSectionProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export default function BookProductSection({
  products,
  loading,
  error,
  onRetry,
}: BookProductSectionProps) {
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [showFlip, setShowFlip] = useState(false);
  const flipRef = useRef<HTMLDivElement>(null);
  const isFlippingRef = useRef(false);
  const flipDirRef = useRef<'forward' | 'backward'>('forward');
  const flipColorRef = useRef<string>('#10b981');

  // ── Per-spread product pools ─────────────────────────────────────────────
  // Each spread filters all products by its own keyword list.
  // Fallback: evenly partition when nothing matches.
  const spreadProducts = useMemo(() => {
    const match = (p: Product, kws: readonly string[]) =>
      kws.some((k) => p.name.toLowerCase().includes(k.toLowerCase()));

    const pools = SEASON_SPREADS.map((s) =>
      products.filter((p) => match(p, s.keywords)).slice(0, PRODUCTS_PER_PAGE)
    );

    const allEmpty = pools.every((pool) => pool.length === 0);
    if (allEmpty) {
      const chunk = Math.ceil(products.length / TOTAL_SPREADS);
      return SEASON_SPREADS.map((_, i) =>
        products.slice(i * chunk, (i + 1) * chunk).slice(0, PRODUCTS_PER_PAGE)
      );
    }
    return pools;
  }, [products]);

  const canNext = spreadIdx < TOTAL_SPREADS - 1;
  const canPrev = spreadIdx > 0;

  // ── Core flip engine ───────────────────────────────────────────────────────
  const performFlip = (targetIdx: number) => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    // Determine direction and snapshot the current page's accent colour
    flipDirRef.current = targetIdx > spreadIdx ? 'forward' : 'backward';
    flipColorRef.current = SEASON_SPREADS[spreadIdx].accentColor;

    // 1. Mount overlay at rotateY(0) – no transition yet
    setShowFlip(true);

    // 2. After two animation frames (initial paint), add the CSS transition.
    //    Forward: right-page flips left  → rotateY(-180deg)
    //    Backward: left-page flips right → rotateY(+180deg)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = flipRef.current;
        if (el) {
          el.style.transition = 'transform 0.85s cubic-bezier(0.645, 0.045, 0.355, 1.000)';
          el.style.transform =
            flipDirRef.current === 'forward' ? 'rotateY(-180deg)' : 'rotateY(180deg)';
        }
      });
    });

    // 3. At ~50% of animation (page is "edge-on"), swap the underlying content.
    //    Users won't see the swap because the overlay covers both sides at ~90°.
    setTimeout(() => {
      setSpreadIdx(targetIdx);
    }, 430);

    // 4. After animation completes, remove the overlay and reset flip state.
    setTimeout(() => {
      setShowFlip(false);
      const el = flipRef.current;
      if (el) {
        el.style.transition = 'none';
        el.style.transform = 'rotateY(0deg)';
      }
      isFlippingRef.current = false;
    }, 900);
  };

  const goNext = () => {
    if (!canNext) return;
    performFlip(spreadIdx + 1);
  };

  const goPrev = () => {
    if (!canPrev) return;
    performFlip(spreadIdx - 1);
  };

  const jumpTo = (idx: number) => {
    if (isFlippingRef.current || idx === spreadIdx) return;
    performFlip(idx);
  };

  const spread = SEASON_SPREADS[spreadIdx];
  const currentProducts = spreadProducts[spreadIdx] || [];
  const isCold = spread.season === 'cold';

  return (
    <section className="pt-10 pb-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
      {/* Ambient blobs – match home page emerald theme */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Header ──────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Seasonal Products</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Products by Season
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Flip through fresh picks curated for every season
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full mt-4" />
        </div>

        {/* ── Navigation + Book ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Previous page"
            className="w-12 h-12 flex-shrink-0 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* ════════════ THE BOOK ════════════ */}
          <div
            className="flex-1 relative rounded-2xl shadow-2xl overflow-hidden"
            style={{
              height: '520px',
              perspective: '1600px',
              perspectiveOrigin: '50% 50%',
            }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-black/10 z-40 pointer-events-none" />

            {/* ── LEFT PAGE: Season image ── */}
            <div
              className="absolute left-0 top-0 h-full overflow-hidden"
              style={{ width: '44%', borderRadius: '12px 0 0 12px' }}
            >
              <img
                src={spread.image}
                alt={spread.title}
                className="w-full h-full object-cover"
                style={{ transition: 'none' }}
              />
              {/* Floating season icons */}
              <div className="absolute top-5 right-5 flex flex-col items-center gap-1 opacity-65">
                {spread.icons.map((icon, i) => (
                  <span key={i} className="text-xl select-none">{icon}</span>
                ))}
              </div>

              {/* Text overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-7 text-white">
                {/* Season badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 self-start"
                  style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)' }}
                >
                  {isCold ? (
                    <Snowflake className="w-3 h-3" />
                  ) : (
                    <Sun className="w-3 h-3" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">{spread.label}</span>
                </div>

                <h3 className="text-2xl font-extrabold drop-shadow-lg leading-tight mb-1">
                  {spread.title}
                </h3>
                <p className="text-sm text-white/80">{spread.subtitle}</p>

                {/* Page X / 3 */}
                <div className="flex items-center gap-2 mt-5">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Page</span>
                  <span className="text-lg font-bold">{spread.pageNum}</span>
                  <span className="text-sm text-white/40">/ {TOTAL_SPREADS}</span>
                </div>
              </div>

              {/* Right-edge page curl shadow */}
              <div
                className="absolute top-0 right-0 h-full w-4 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.22), transparent)' }}
              />
            </div>

            {/* ── SPINE ── */}
            <div
              className="absolute top-0 h-full z-10 pointer-events-none"
              style={{
                left: '44%',
                width: '12px',
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.28) 100%)',
                boxShadow:
                  '-3px 0 8px rgba(0,0,0,0.18), 3px 0 8px rgba(0,0,0,0.14)',
              }}
            />

            {/* ── RIGHT PAGE: Products ── */}
            <div
              className="absolute top-0 h-full overflow-hidden transition-colors duration-500"
              style={{
                left: 'calc(44% + 12px)',
                right: 0,
                background: spread.pageColor,
                borderRadius: '0 12px 12px 0',
              }}
            >
              {/* Subtle page lines decoration */}
              <div className="absolute inset-0 flex flex-col justify-start pt-6 gap-[26px] px-5 pointer-events-none opacity-[0.04]">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-gray-600" />
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div
                    className="animate-spin rounded-full h-10 w-10 border-b-2"
                    style={{ borderColor: spread.accentColor }}
                  />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="px-4 py-2 text-white text-sm rounded-lg transition-colors"
                      style={{ background: spread.accentColor }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : currentProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                  <BookOpen className="w-12 h-12 text-gray-200" />
                  <p className="text-sm text-gray-400">No products available for this page</p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-3 h-full p-5"
                  style={{ gridTemplateRows: 'repeat(2, 1fr)' }}
                >
                  {currentProducts.map((product) => (
                    <BookProductCard
                      key={product._id}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── PAGE FLIP OVERLAY ─────────────────────────────────────── */}
            {/* Forward : covers right page, hinges at spine (left edge)         */}
            {/* Backward: covers left  page, hinges at spine (right edge)        */}
            {showFlip && (() => {
              const isForward = flipDirRef.current === 'forward';
              const snapColor = flipColorRef.current;
              return (
                <div
                  ref={flipRef}
                  style={{
                    position: 'absolute',
                    ...(isForward
                      ? { left: 'calc(44% + 12px)', right: 0 }
                      : { left: 0, width: '44%' }),
                    top: 0,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transformOrigin: isForward ? '0% 50%' : '100% 50%',
                    transform: 'rotateY(0deg)',
                    zIndex: 25,
                    pointerEvents: 'none',
                    borderRadius: isForward ? '0 12px 12px 0' : '12px 0 0 12px',
                  }}
                >
                  {/* FRONT FACE – what's visible as the page begins to turn */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      background: isForward
                        ? 'linear-gradient(105deg, #fdfdf8 0%, #f9f8f0 60%, #f3f2ea 100%)'
                        : `linear-gradient(135deg, ${snapColor}cc 0%, ${snapColor}88 100%)`,
                      borderRadius: isForward ? '0 12px 12px 0' : '12px 0 0 12px',
                      boxShadow: isForward
                        ? '-6px 0 24px rgba(0,0,0,0.12) inset, 0 0 0 1px rgba(0,0,0,0.04)'
                        : '6px 0 24px rgba(0,0,0,0.12) inset, 0 0 0 1px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col justify-start pt-6 gap-[26px] px-5 opacity-[0.06]">
                      {[...Array(14)].map((_, i) => (
                        <div key={i} className="w-full h-px bg-gray-700" />
                      ))}
                    </div>
                  </div>

                  {/* BACK FACE – revealed once the page has fully turned */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: isForward ? 'rotateY(180deg)' : 'rotateY(-180deg)',
                      background: isForward
                        ? (isCold
                            ? 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'
                            : 'linear-gradient(135deg, #fed7aa 0%, #fbbf24 100%)')
                        : 'linear-gradient(105deg, #fdfdf8 0%, #f9f8f0 60%, #f3f2ea 100%)',
                      borderRadius: isForward ? '12px 0 0 12px' : '0 12px 12px 0',
                      boxShadow: isForward
                        ? '6px 0 24px rgba(0,0,0,0.10) inset'
                        : '-6px 0 24px rgba(0,0,0,0.10) inset',
                    }}
                  />
                </div>
              );
            })()}
          </div>
          {/* ════════════ END BOOK ════════════ */}

          {/* Next */}
          <button
            onClick={goNext}
            disabled={!canNext}
            aria-label="Next page"
            className="w-12 h-12 flex-shrink-0 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* ── Page Indicator Dots: 3 dots ──────────────────────────────── */}
        <div className="flex justify-center items-center gap-2 mt-7">
          {SEASON_SPREADS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => jumpTo(idx)}
              aria-label={s.title}
              className="rounded-full transition-all duration-300"
              style={{
                width: spreadIdx === idx ? '28px' : '10px',
                height: '10px',
                background: spreadIdx === idx ? s.accentColor : '#d1d5db',
              }}
            />
          ))}
        </div>

        {/* ── View All CTA ─────────────────────────────────────────────────── */}
        <div className="text-center mt-9">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-emerald-500/20 transition-all duration-200"
          >
            View all products
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
