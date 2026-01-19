import { Calendar, Clock, Tag, TrendingUp, Mail } from 'lucide-react';
import Header from '../../components/Header';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface BlogPost {
  id: number;
  title: string;
  date: string;
  summary: string;
  thumbnail: string;
  category: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: '10 Essential Tips for Storing Organic Produce to Maximize Freshness',
    date: 'January 14, 2026',
    summary: 'Learn the best practices for storing your organic fruits and vegetables to keep them fresh longer and reduce food waste in your kitchen.',
    thumbnail: 'https://images.unsplash.com/photo-1764332688454-2ba82e76d87a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZm9vZCUyMHN0b3JhZ2V8ZW58MXx8fHwxNzY4NDY4ODMwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Tips',
    readTime: '5 min'
  },
  {
    id: 2,
    title: 'This Week\'s Special: 30% Off on All Seasonal Root Vegetables',
    date: 'January 13, 2026',
    summary: 'Don\'t miss our biggest sale of the season! Get premium organic root vegetables at unbeatable prices. Limited time offer.',
    thumbnail: 'https://images.unsplash.com/photo-1761395043514-42bb7fed804a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWFzb25hbCUyMHZlZ2V0YWJsZXMlMjBkaXNwbGF5fGVufDF8fHx8MTc2ODQ2ODgzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Sale',
    readTime: '2 min'
  },
  {
    id: 3,
    title: 'Understanding Organic Certification: What Labels Really Mean',
    date: 'January 12, 2026',
    summary: 'Confused by organic labels? We break down what different certifications mean and how to make informed choices for your family.',
    thumbnail: 'https://images.unsplash.com/photo-1554223745-ad862492c213?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMG1hcmtldHxlbnwxfHx8fDE3Njg0NTQ1ODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Organic',
    readTime: '7 min'
  },
  {
    id: 4,
    title: 'Healthy Meal Prep Ideas Using This Month\'s Produce Box',
    date: 'January 11, 2026',
    summary: 'Get inspired with easy meal prep recipes that make the most of your organic produce delivery. Save time and eat healthier!',
    thumbnail: 'https://images.unsplash.com/photo-1641642400143-6be68f1a0918?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZWF0aW5nJTIwdGlwc3xlbnwxfHx8fDE3Njg0Njg4Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Tips',
    readTime: '6 min'
  },
  {
    id: 5,
    title: 'Smart Shopping: How to Choose the Freshest Organic Produce',
    date: 'January 9, 2026',
    summary: 'Expert tips on selecting the best quality organic fruits and vegetables. Learn what to look for when shopping online or in-store.',
    thumbnail: 'https://images.unsplash.com/photo-1705727209465-b292e4129a37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHByb2R1Y2UlMjBzaG9wcGluZ3xlbnwxfHx8fDE3Njg0Njg4Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Tips',
    readTime: '5 min'
  },
  {
    id: 6,
    title: 'New Arrival: Exotic Organic Fruits Now Available for Delivery',
    date: 'January 7, 2026',
    summary: 'Exciting news! We\'ve expanded our selection to include rare organic tropical fruits. Order now and try something new.',
    thumbnail: 'https://images.unsplash.com/photo-1646836390736-ee0af3b6e9c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc2hvcHBpbmclMjBoZWFsdGh5fGVufDF8fHx8MTc2ODQ2ODgzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'News',
    readTime: '3 min'
  },
  {
    id: 7,
    title: 'The Environmental Impact of Choosing Organic: Facts & Figures',
    date: 'January 5, 2026',
    summary: 'Discover how your choice to buy organic produce contributes to environmental sustainability and a healthier planet.',
    thumbnail: 'https://images.unsplash.com/photo-1554223745-ad862492c213?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMG1hcmtldHxlbnwxfHx8fDE3Njg0NTQ1ODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Organic',
    readTime: '8 min'
  },
  {
    id: 8,
    title: 'Budget-Friendly Tips for Buying Organic Without Breaking the Bank',
    date: 'January 3, 2026',
    summary: 'Eating organic doesn\'t have to be expensive. Learn our money-saving strategies for maintaining a healthy organic diet.',
    thumbnail: 'https://images.unsplash.com/photo-1705727209465-b292e4129a37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHByb2R1Y2UlMjBzaG9wcGluZ3xlbnwxfHx8fDE3Njg0Njg4Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Tips',
    readTime: '6 min'
  }
];

const popularTags = [
  'Organic', 'Sale', 'Tips', 'Seasonal', 'Health', 'Recipe', 
  'Storage', 'Fresh', 'Nutrition', 'Eco-Friendly'
];

const trendingPosts = [
  { title: '10 Tips for Storing Organic Produce', views: '12.5K' },
  { title: 'This Week\'s Special Offers', views: '10.2K' },
  { title: 'Understanding Organic Labels', views: '9.8K' },
  { title: 'Meal Prep with Produce Box', views: '8.3K' }
];

export default function MarketNewsTips() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Market News & Tips</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with the latest organic market news, seasonal tips, and exclusive offers
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Main Column - Blog Posts (70%) */}
          <main className="flex-1 max-w-3xl">
            <div className="space-y-8">
              {blogPosts.map((post, index) => (
                <article 
                  key={post.id}
                  className="flex gap-6 pb-8 border-b border-border last:border-b-0 group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                    <ImageWithFallback
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    {/* Category Badge */}
                    <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                      post.category === 'Sale' ? 'bg-red-100 text-red-700' :
                      post.category === 'Tips' ? 'bg-blue-100 text-blue-700' :
                      post.category === 'Organic' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {post.category}
                    </span>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {post.summary}
                    </p>

                    {/* Read More */}
                    <button className="text-sm font-semibold text-primary hover:text-primary-dark mt-3 self-start">
                      Read More →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === 1
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </main>

          {/* Sidebar (30%) */}
          <aside className="w-80 flex-shrink-0 space-y-6">
            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg sticky top-24">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-6 h-6" />
                <h3 className="font-bold text-lg">Newsletter</h3>
              </div>
              <p className="text-sm text-white/90 mb-4">
                Get weekly tips, exclusive offers, and organic living inspiration delivered to your inbox.
              </p>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2.5 rounded-lg text-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="w-full py-2.5 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors">
                Subscribe Now
              </button>
            </div>

            {/* Popular Tags */}
            <div className="bg-muted rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">Popular Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Now */}
            <div className="bg-muted rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">Trending Now</h3>
              </div>
              <div className="space-y-4">
                {trendingPosts.map((post, index) => (
                  <div
                    key={index}
                    className="flex gap-3 group cursor-pointer"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{post.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">Categories</h3>
              <div className="space-y-2">
                {['All Posts', 'Tips & Tricks', 'Sales & Offers', 'Organic News', 'Recipes'].map((category) => (
                  <button
                    key={category}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white hover:text-primary transition-all"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
