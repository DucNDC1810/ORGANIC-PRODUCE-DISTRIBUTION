import { Leaf, Truck, Shield, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import { useProducts } from '../../hooks/useProducts';

// External banner image URLs (replace with your actual CDN/hosting URLs)
const banner1 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863222/banner_oywsgi.png';
const banner2 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863219/Broccoli_qewlkz.png';
const banner3 = 'https://res.cloudinary.com/dbtjki0vq/image/upload/v1769863218/Banner2_tlwsht.png';

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
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [productScrollIndex, setProductScrollIndex] = useState(0);
  
  // Use products hook to fetch real data
  const { products, loading, error, fetchProducts } = useProducts();
  
  // Filter only featured products for display
  const featuredProducts = products.filter(product => product.isFeatured);
  
  const productsPerView = 5;
  const maxIndex = Math.max(0, featuredProducts.length - productsPerView);

  useEffect(() => {
    // Fetch featured products when component mounts
    fetchProducts({ isFeatured: true });
  }, [fetchProducts]);

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
      
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative h-[400px] md:h-[490px]">
          {/* Banner Slides */}
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

          {/* Navigation Arrows */}
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

          {/* Dots Indicator */}
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
                  <p>Lỗi khi tải sản phẩm: {error}</p>
                  <button 
                    onClick={() => fetchProducts({ isFeatured: true })} 
                    className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="flex justify-center py-12">
                <p className="text-gray-500">Không có sản phẩm nổi bật nào</p>
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
          
          <div className="text-center mt-8">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"></div>
            <Link to="/products" className="inline-block px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 hover:shadow-lg transition-all duration-300">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Fresh Ingredients</h3>
              <p className="text-muted-foreground leading-relaxed">
                100% organic produce sourced directly from local farms. Quality you can trust.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Fast Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Same-day delivery available. Your fresh groceries delivered within hours.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Trusted Quality</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every product is carefully selected and quality-checked before delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-20 bg-gradient-to-r from-green-500 via-emerald-600 to-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Limited Time Offer</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Get 20% off your first order
              </h2>
              <p className="text-xl text-white/90">
                Use code FRESH20 at checkout. Valid for new customers only.
              </p>
            </div>
            <button className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
              Shop Now →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
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