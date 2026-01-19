import { Calendar, User, ArrowRight } from 'lucide-react';
import Header from '../../components/Header';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface Story {
  id: number;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  image: string;
  readTime: string;
}

const stories: Story[] = [
  {
    id: 1,
    title: 'The Journey of Our Organic Tomatoes: From Seed to Table',
    author: 'Maria Johnson',
    date: 'January 12, 2026',
    excerpt: 'Meet the Martinez family, who have been growing organic tomatoes on their sustainable farm for three generations. Their story begins each spring with carefully selected heirloom seeds, nurtured in rich, chemical-free soil...',
    image: 'https://images.unsplash.com/photo-1624668430039-0175a0fbf006?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBoYXJ2ZXN0fGVufDF8fHx8MTc2ODQ1MzY0OHww&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '8 min read'
  },
  {
    id: 2,
    title: 'Hands in the Soil: The Healing Power of Organic Farming',
    author: 'David Chen',
    date: 'January 10, 2026',
    excerpt: 'There\'s something profoundly therapeutic about working with soil. For farmer John Peterson, transitioning from corporate life to organic farming wasn\'t just a career change—it was a return to roots, both literally and figuratively...',
    image: 'https://images.unsplash.com/photo-1595149417506-8651d6f7aeb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGhvbGRpbmclMjBzb2lsfGVufDF8fHx8MTc2ODQ2ODc4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '10 min read'
  },
  {
    id: 3,
    title: 'A Day in the Life: Following Sarah Through Her Organic Farm',
    author: 'Emma Rodriguez',
    date: 'January 8, 2026',
    excerpt: 'The sun rises over Green Valley Farm as Sarah begins her daily routine. With a warm smile and muddy boots, she walks through rows of vibrant vegetables, checking each plant with the care of a mother tending to her children...',
    image: 'https://images.unsplash.com/photo-1570966087241-20278ac27b2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhcm1lciUyMGZpZWxkfGVufDF8fHx8MTc2ODQ2ODc4N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '12 min read'
  },
  {
    id: 4,
    title: 'From Farm to Market: Building Community Through Fresh Produce',
    author: 'Michael Thompson',
    date: 'January 5, 2026',
    excerpt: 'Every Saturday morning, the town square transforms into a vibrant marketplace where farmers and community members connect. It\'s more than just buying and selling—it\'s about building relationships and trust...',
    image: 'https://images.unsplash.com/photo-1752401984784-74bb3b095745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBtYXJrZXQlMjBzdGFsbHxlbnwxfHx8fDE3Njg0Njg3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '7 min read'
  },
  {
    id: 5,
    title: 'Sustainable Futures: How Modern Technology Meets Traditional Farming',
    author: 'Lisa Anderson',
    date: 'January 3, 2026',
    excerpt: 'In the heart of the countryside, a revolution is quietly taking place. Greenhouses equipped with smart sensors work alongside time-honored farming techniques, creating a perfect harmony between innovation and tradition...',
    image: 'https://images.unsplash.com/photo-1598954560251-b2e906ae271b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZ3JlZW5ob3VzZXxlbnwxfHx8fDE3Njg0Njg3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '9 min read'
  },
  {
    id: 6,
    title: 'Legacy of the Land: Three Generations of Organic Farming',
    author: 'Robert Williams',
    date: 'December 30, 2025',
    excerpt: 'The Thompson farm has witnessed the passage of time, seasons, and generations. From grandfather to father to son, each generation has added their wisdom while preserving the core values of sustainable, organic agriculture...',
    image: 'https://images.unsplash.com/photo-1760372057378-e8d6bda295eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZmFybSUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3Njg0Njg3ODd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '11 min read'
  }
];

export default function FarmStories() {
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
        <div className="space-y-20">
          {stories.map((story, index) => (
            <article key={story.id} className="group">
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
                    <span className="font-medium">{story.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{story.date}</span>
                  </div>
                  <div>
                    <span>{story.readTime}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-4xl font-serif font-bold text-[#2C2416] leading-tight group-hover:text-primary transition-colors">
                  {story.title}
                </h2>

                {/* Excerpt */}
                <p className="text-lg text-[#5C5041] leading-relaxed font-light">
                  {story.excerpt}
                </p>

                {/* Read More Link */}
                <button className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold group/button transition-colors">
                  <span>Read Full Story</span>
                  <ArrowRight className="w-5 h-5 group-hover/button:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Divider (except for last item) */}
              {index < stories.length - 1 && (
                <div className="mt-20 pt-20 border-t border-[#E6DED1]" />
              )}
            </article>
          ))}
        </div>

        {/* Load More Section */}
        <div className="mt-20 text-center">
          <button className="px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
            Load More Stories
          </button>
        </div>
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
