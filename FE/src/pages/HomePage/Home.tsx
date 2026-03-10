import { Leaf, Truck, Shield, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import { useProducts } from '../../hooks/useProducts';
import BookProductSection from '../../components/BookProductSection';

// External banner image URLs (replace with your actual CDN/hosting URLs)
const banner1 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863222/banner_oywsgi.png';
const banner2 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863219/Broccoli_qewlkz.png';
const banner3 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863218/Banner2_tlwsht.png';
const banner4 = '/image/banner sc.jpg';

const banners = [
  {
    id: 1,
    image: banner1,
    title: 'MẮC CA MÙA',
    subtitle: 'Hương vị từ thiên nhiên',
    buttons: [
      { text: 'Hạt Mắc Ca Sấy nứt vỏ', link: '#' },
      { text: 'Nhân Mắc ca', link: '#' },
      { text: 'Nhân hạt Mắc ca cấp đông', link: '#' }
    ]
  },
  {
    id: 2,
    image: banner2,
    title: 'SẢN PHẨM HỮU CƠ',
    subtitle: 'Tươi ngon mỗi ngày',
    buttons: []
  },
  {
    id: 3,
    image: banner3,
    title: 'RAU XANH SẠCH',
    subtitle: 'An toàn cho sức khỏe',
    buttons: []
  },
  {
    id: 4,
    image: banner4,
    title: '',
    subtitle: '',
    buttons: []
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [productScrollIndex, setProductScrollIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Restart the video from the beginning every time the page is visited
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, []);
  
  // Featured products for horizontal scroll
  const { products, loading, error, fetchProducts } = useProducts();

  // All products for the book-flip section
  const {
    products: allProducts,
    loading: allLoading,
    error: allError,
    fetchProducts: fetchAllProducts,
  } = useProducts();
  
  // Filter only featured products for display
  const featuredProducts = products.filter(product => product.isFeatured);
  
  const productsPerView = 5;
  const maxIndex = Math.max(0, featuredProducts.length - productsPerView);

  useEffect(() => {
    // Fetch featured products when component mounts
    fetchProducts({ isFeatured: true });
  }, [fetchProducts]);

  useEffect(() => {
    // Fetch all products for the book-flip catalog
    fetchAllProducts({ limit: 24 });
  }, [fetchAllProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextProducts = () => {
    setProductScrollIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevProducts = () => {
    setProductScrollIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Video */}
      <section className="relative w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/freecompress-Yêu_cầu_Video_Quảng_Cáo_Nông_Sản_FreshMarket.mp4"
          className="w-full block"
          style={{ marginTop: '-6%', marginBottom: '-6%' }}
          autoPlay
          muted
          playsInline
          preload="metadata"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />

        {/* Hero Text */}
        <div className="absolute inset-0 flex flex-col justify-center px-10 sm:px-16 lg:px-24">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 rounded-full mb-5">
              <Leaf className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white tracking-wide uppercase">100% Organic</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
              Fresh From<br />
              <span className="text-emerald-400">Farm to Table</span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-8 max-w-md drop-shadow">
              Premium organic produce sourced directly from local farms — delivered fresh to your door within 2 hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
              >
                Shop Now
                <ChevronRight className="w-4 h-4" />
              </Link>
           
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 mt-8">
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-white/70">Products</div>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white">10k+</div>
                <div className="text-xs text-white/70">Happy Customers</div>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white">2h</div>
                <div className="text-xs text-white/70">Express Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/40 to-transparent rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Featured Products</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Products
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full"></div>
          </div>

          {/* Horizontal Scrollable Products */}
          <div className="relative px-12">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : error ? (
              <div className="flex justify-center py-12">
                <div className="text-red-500 text-center">
                  <p>Error loading product: {error}</p>
                  <button 
                    onClick={() => fetchProducts({ isFeatured: true })} 
                    className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="flex justify-center py-12">
                <p className="text-gray-500">No featured products available</p>
              </div>
            ) : (
              <>
                {/* Previous Button */}
                <button
                  onClick={prevProducts}
                  disabled={productScrollIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>

                {/* Products Container */}
                <div className="overflow-hidden">
                  <div 
                    className="flex gap-4 transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${productScrollIndex * (208 + 16)}px)` }}
                  >
                    {featuredProducts.map((product) => (
                      <div key={product._id} className="w-52 flex-shrink-0">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={nextProducts}
                  disabled={productScrollIndex >= maxIndex}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}
          </div>
          
        </div>
      </section>

      {/* Book-Flip Product Catalog */}
      <BookProductSection
        products={allProducts}
        loading={allLoading}
        error={allError}
        onRetry={() => fetchAllProducts({ limit: 24 })}
      />

      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative w-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Invisible img to drive natural height */}
          <img
            src={banners[currentSlide].image}
            alt=""
            className="w-full opacity-0 pointer-events-none select-none"
          />

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg z-10"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-white to-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Our Commitment</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose FreshMarket?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to bringing you the freshest certified organic produce — quality-verified and delivered right to your door every day.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full mt-5"></div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Organic */}
            <div className="group bg-white p-7 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-1">500+</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Organic Ingredients</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Traceable origins from certified organic farms — no pesticides, no compromise.
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>VietGAP & GlobalGAP certified</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>Harvested at peak freshness</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>Zero artificial preservatives</li>
              </ul>
            </div>

            {/* Card 2: Delivery */}
            <div className="group bg-white p-7 rounded-2xl shadow-sm border border-blue-100 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-500 mb-1">2h</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Express Delivery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Same-day delivery guaranteed — your groceries arrive fresh and on time.
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>2-hour delivery in city areas</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>Real-time order tracking</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>Free shipping on orders 300k+</li>
              </ul>
            </div>

            {/* Card 3: Quality */}
            <div className="group bg-white p-7 rounded-2xl shadow-sm border border-amber-100 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-amber-500 mb-1">100%</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Quality Assured</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Every item is rigorously inspected before delivery. Not satisfied? Full refund.
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>3-layer quality inspection</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>100% money-back guarantee</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>Verified customer reviews</li>
              </ul>
            </div>

            {/* Card 4: Group Buy */}
            <div className="group bg-white p-7 rounded-2xl shadow-sm border border-purple-100 hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-500 mb-1">-10%</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Group Buying Deals</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Join group purchases with the community and unlock exclusive discounts every day.
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>Up to 10% off with group buys</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>Connect with buyer communities</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>Weekly flash deals</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-semibold">FreshMarket</span>
              </div>
              <p className="text-white/70 leading-relaxed">
                Your trusted source for fresh, organic produce delivered right to your door.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Fruits</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Vegetables</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Bundles</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link to="/" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Returns</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="text-center text-white/70">
              © 2026 FreshMarket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}