import { Leaf, TrendingUp, Truck, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import MiniCart from '../../components/MiniCart';
import Header from '../../components/Header';

const products = [
  {
    id: '1',
    name: 'Organic Avocados',
    description: 'Fresh, ripe, and ready to eat',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',
    category: 'Fruits',
  },
  {
    id: '2',
    name: 'Mixed Greens',
    description: 'Premium salad blend',
    price: 4.49,
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600',
    category: 'Vegetables',
  },
  {
    id: '3',
    name: 'Fresh Strawberries',
    description: 'Sweet and juicy berries',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600',
    category: 'Fruits',
  },
  {
    id: '4',
    name: 'Organic Tomatoes',
    description: 'Vine-ripened perfection',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=600',
    category: 'Vegetables',
  },
  {
    id: '5',
    name: 'Fresh Blueberries',
    description: 'Antioxidant-rich superfood',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600',
    category: 'Fruits',
  },
  {
    id: '6',
    name: 'Bell Peppers',
    description: 'Colorful and crunchy',
    price: 5.49,
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600',
    category: 'Vegetables',
  },
  {
    id: '7',
    name: 'Organic Carrots',
    description: 'Sweet and nutritious',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600',
    category: 'Vegetables',
  },
  {
    id: '8',
    name: 'Fresh Apples',
    description: 'Crisp and delicious',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
    category: 'Fruits',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Trending Now</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Fresh. Clean. <br />
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  Delivered.
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                A modern way to shop for healthy products. Fresh produce delivered to your door in hours, not days.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  Shop Now
                </button>
                <button className="px-8 py-4 bg-white border-2 border-border text-foreground rounded-xl font-semibold hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all duration-200">
                  View Products
                </button>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-foreground">10k+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800"
                  alt="Fresh organic produce"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-white/90">Organic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Popular Products</h2>
            <p className="text-xl text-muted-foreground">Handpicked fresh produce from local farms</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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

      {/* Mini Cart */}
      <MiniCart />
    </div>
  );
}