import { Calendar, User, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import newsService, { NewsArticle } from '../../services/newsService';
import { toast } from 'sonner';

export default function FarmStories() {
  const [stories, setStories] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const news = await newsService.fetchAgricultureNews(20);
      setStories(news || []);
    } catch (error: any) {
      console.error('Error loading news:', error);
      setStories([]);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const visibleStories = stories.slice(0, visibleCount);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-white">
      <Header />
      
      {/* Hero Section - Cinematic */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1570966087241-20278ac27b2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMGZpZWxkfGVufDF8fHx8MTc2ODQ2ODc4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Farmer in field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium mb-6 border border-white/20">
              Farm Stories
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              Stories From The Heart of Our Farms
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Discover the people, passion, and dedication behind every organic product we deliver to your table
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Editorial Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : visibleStories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No news articles available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {visibleStories.map((story, index) => (
              <article key={index} className="group">
                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl mb-8 shadow-lg">
                  <ImageWithFallback
                    src={story.image}
                    alt={story.title}
                    className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-[#8B7355]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{story.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(story.publishedAt)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-4xl font-serif font-bold text-[#2C2416] leading-tight group-hover:text-primary transition-colors">
                    {story.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-lg text-[#5C5041] leading-relaxed font-light">
                    {story.description}
                  </p>

                  {/* Read More Link */}
                  <a 
                    href={story.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold group/button transition-colors"
                  >
                    <span>Read Full Story</span>
                    <ArrowRight className="w-5 h-5 group-hover/button:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Divider (except for last item) */}
                {index < visibleStories.length - 1 && (
                  <div className="mt-20 pt-20 border-t border-[#E6DED1]" />
                )}
              </article>
            ))}
          </div>
        )}

        {/* Load More Section */}
        {!loading && visibleCount < stories.length && (
          <div className="mt-20 text-center">
            <button 
              onClick={loadMore}
              className="px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Load More Stories
            </button>
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-20 mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Subscribe to Our Farm Stories
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get the latest stories from our farmers delivered to your inbox every week
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
