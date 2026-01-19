import { Leaf, Sprout, ShieldCheck, Truck, Heart, Users, Target } from 'lucide-react';
import Header from '../../components/Header';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

const journeySteps = [
  {
    id: 1,
    title: 'Selecting Seeds',
    description: 'We carefully select heirloom and organic seeds from trusted sources, ensuring the best start for our produce.',
    image: 'https://images.unsplash.com/photo-1657554878025-8bf114453e52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwc2VlZHMlMjBzZWxlY3Rpb258ZW58MXx8fHwxNzY4NDY5NjMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Sprout
  },
  {
    id: 2,
    title: 'Organic Farming',
    description: 'Our partner farms practice sustainable agriculture, using natural fertilizers and traditional methods.',
    image: 'https://images.unsplash.com/photo-1768271524613-a6f4d7f40fc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZmFybWluZyUyMGZpZWxkfGVufDF8fHx8MTc2ODM5NTY0NXww&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Leaf
  },
  {
    id: 3,
    title: 'Quality Check',
    description: 'Every harvest undergoes rigorous quality inspection to ensure only the freshest produce reaches you.',
    image: 'https://images.unsplash.com/photo-1614483179075-86c41e549ae5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWdldGFibGUlMjBxdWFsaXR5JTIwaW5zcGVjdGlvbnxlbnwxfHx8fDE3Njg0Njk2MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: ShieldCheck
  },
  {
    id: 4,
    title: 'Delivery',
    description: 'Fresh from farm to your door within 24 hours, maintaining optimal freshness and nutritional value.',
    image: 'https://images.unsplash.com/photo-1641132561783-2a3f0326f56f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGZvb2QlMjBkZWxpdmVyeSUyMGJveHxlbnwxfHx8fDE3Njg0Njk2MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Truck
  }
];

const values = [
  {
    icon: Heart,
    title: 'Health First',
    description: 'We prioritize your wellbeing by providing chemical-free, nutrient-rich organic produce.'
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Our practices protect the environment and support regenerative agriculture for future generations.'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We build strong relationships with local farmers and support their sustainable livelihoods.'
  },
  {
    icon: Target,
    title: 'Transparency',
    description: 'Full traceability from seed to table, so you know exactly where your food comes from.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - Cinematic */}
      <section className="relative h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1590682680943-8230dff71857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBoYW5kcyUyMHNvaWwlMjBzcHJvdXR8ZW58MXx8fHwxNzY4NDY5NjMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Farmer's hands holding organic soil with sprout"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium mb-8 border border-white/20">
              <Leaf className="w-4 h-4" />
              <span>Our Story</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Cultivating Health,<br />Delivered to Your Door
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
              From soil to soul, we nurture organic produce with care, bringing nature's bounty directly to your table
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#2C2416] mb-6">Who We Are</h2>
          <p className="text-lg text-[#5C5041] leading-relaxed">
            FreshMarket was born from a simple belief: everyone deserves access to fresh, organic produce that's 
            good for both people and the planet. What started as a small family farm has grown into a thriving 
            community of passionate farmers, dedicated to sustainable agriculture and delivering the highest quality 
            organic products to your doorstep.
          </p>
        </div>
      </section>

      {/* The Journey Section - Zigzag Layout */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C2416] mb-4">Our Journey: From Seed to Table</h2>
            <p className="text-lg text-[#5C5041] max-w-2xl mx-auto">
              Every product follows a carefully crafted path to ensure maximum freshness and quality
            </p>
          </div>

          <div className="space-y-24">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
                >
                  {/* Image */}
                  <div className="flex-1 relative group">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                      <ImageWithFallback
                        src={step.image}
                        alt={step.title}
                        className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    {/* Step Number */}
                    <div className="absolute -top-6 -left-6 w-16 h-16 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                      {step.id}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#6B8E23]/10 rounded-2xl">
                      <Icon className="w-8 h-8 text-[#6B8E23]" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#2C2416]">{step.title}</h3>
                    <p className="text-lg text-[#5C5041] leading-relaxed">
                      {step.description}
                    </p>
                    {/* Connector Line for visual flow */}
                    {index < journeySteps.length - 1 && (
                      <div className="hidden lg:block">
                        <div className={`w-24 h-1 bg-gradient-to-r ${isEven ? 'from-[#6B8E23] to-transparent' : 'from-transparent to-[#6B8E23]'}`} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Philosophy Section */}
      <section className="py-24 bg-[#F5EFE6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1589923188900-85dae523342b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZmFybSUyMHN1c3RhaW5hYmxlfGVufDF8fHx8MTc2ODQ2OTYzNXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Sustainable organic farm"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#8B7355] rounded-2xl -z-10" />
            </div>

            {/* Quote */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="w-12 h-1 bg-[#6B8E23]" />
                <h2 className="text-4xl font-bold text-[#2C2416]">Our Philosophy</h2>
              </div>
              
              <blockquote className="space-y-6">
                <p className="text-2xl font-serif italic text-[#2C2416] leading-relaxed">
                  "We believe that organic farming is not just about avoiding chemicals—it's about 
                  nurturing the soil, respecting nature's rhythms, and creating a sustainable future 
                  for generations to come."
                </p>
                <footer className="space-y-2">
                  <cite className="not-italic">
                    <div className="font-bold text-[#2C2416]">Sarah Thompson</div>
                    <div className="text-[#8B7355]">Founder & CEO, FreshMarket</div>
                  </cite>
                </footer>
              </blockquote>

              <div className="pt-6">
                <p className="text-lg text-[#5C5041] leading-relaxed">
                  Since 2015, we've been committed to building a food system that's healthier for 
                  people and kinder to the planet. Every decision we make is guided by our core 
                  values of sustainability, transparency, and community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#2C2416] mb-4">Our Core Values</h2>
            <p className="text-lg text-[#5C5041] max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div 
                  key={index}
                  className="bg-[#FAF7F2] rounded-2xl p-8 text-center hover:shadow-xl transition-shadow group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#6B8E23] rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2C2416] mb-3">{value.title}</h3>
                  <p className="text-[#5C5041] leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Join Our Community CTA */}
      <section className="relative py-24 overflow-hidden bg-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 backdrop-blur-md rounded-full mb-8">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">Join Our Green Community</h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Be part of a movement that's changing the way we grow, distribute, and enjoy food. 
            Together, we can build a healthier, more sustainable future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-4 bg-primary text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all">
              Start Shopping
            </button>
            <button className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}