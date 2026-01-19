import { useState } from 'react';
import { Clock, Flame, ChefHat, Search, Carrot, Apple, Beef, Leaf, Check } from 'lucide-react';
import Header from '../../components/Header';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  calories: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  dietTypes: string[];
}

const recipes: Recipe[] = [
  {
    id: 1,
    title: 'Detox Green Smoothie',
    image: 'https://images.unsplash.com/photo-1642423453782-38590d54a131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHNtb290aGllJTIwYm93bHxlbnwxfHx8fDE3NjgzODQ4NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '5 mins',
    calories: '150 kcal',
    difficulty: 'Easy',
    ingredients: ['vegetables', 'fruits'],
    dietTypes: ['vegan', 'keto']
  },
  {
    id: 2,
    title: 'Mediterranean Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwcXVpbm9hJTIwYm93bHxlbnwxfHx8fDE3Njg0Njg3MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '25 mins',
    calories: '420 kcal',
    difficulty: 'Medium',
    ingredients: ['vegetables', 'meat'],
    dietTypes: ['gluten-free']
  },
  {
    id: 3,
    title: 'Avocado Toast Delight',
    image: 'https://images.unsplash.com/photo-1609158087148-3bae840bcfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBicmVha2Zhc3R8ZW58MXx8fHwxNzY4MzczNDU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '10 mins',
    calories: '280 kcal',
    difficulty: 'Easy',
    ingredients: ['vegetables', 'fruits'],
    dietTypes: ['vegan', 'vegetarian']
  },
  {
    id: 4,
    title: 'Grilled Veggie Platter',
    image: 'https://images.unsplash.com/photo-1578172397201-efaa902004a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwdmVnZXRhYmxlcyUyMHBsYXRlfGVufDF8fHx8MTc2ODQ2ODczMHww&ixlib=rb-4.1.0&q=80&w=1080',
    time: '35 mins',
    calories: '220 kcal',
    difficulty: 'Medium',
    ingredients: ['vegetables'],
    dietTypes: ['vegan', 'vegetarian', 'keto']
  },
  {
    id: 5,
    title: 'Berry Blast Smoothie',
    image: 'https://images.unsplash.com/photo-1588068403046-169c80c69938?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGZydWl0JTIwc21vb3RoaWV8ZW58MXx8fHwxNzY4NDUxODYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '7 mins',
    calories: '180 kcal',
    difficulty: 'Easy',
    ingredients: ['fruits'],
    dietTypes: ['vegan', 'vegetarian']
  },
  {
    id: 6,
    title: 'Organic Pasta Primavera',
    image: 'https://images.unsplash.com/photo-1676300184847-4ee4030409c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjBmb29kfGVufDF8fHx8MTc2ODQwMTI1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    time: '30 mins',
    calories: '480 kcal',
    difficulty: 'Medium',
    ingredients: ['vegetables', 'meat'],
    dietTypes: ['vegetarian']
  },
  {
    id: 7,
    title: 'Hearty Vegetable Soup',
    image: 'https://images.unsplash.com/photo-1629032355269-bde5c5da4ab2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3VwJTIwYm93bCUyMGhlYWx0aHl8ZW58MXx8fHwxNzY4NDY4NzM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '45 mins',
    calories: '200 kcal',
    difficulty: 'Easy',
    ingredients: ['vegetables'],
    dietTypes: ['vegan', 'vegetarian', 'gluten-free']
  },
  {
    id: 8,
    title: 'Berry Cheesecake Parfait',
    image: 'https://images.unsplash.com/photo-1634719134538-aa1fcf7be10f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwYmVycnklMjBjYWtlfGVufDF8fHx8MTc2ODQ2ODczNHww&ixlib=rb-4.1.0&q=80&w=1080',
    time: '15 mins',
    calories: '320 kcal',
    difficulty: 'Easy',
    ingredients: ['fruits'],
    dietTypes: ['vegetarian']
  },
  {
    id: 9,
    title: 'Fresh Garden Salad',
    image: 'https://images.unsplash.com/photo-1745793652792-dd1624661142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZ3JlZW4lMjBzYWxhZCUyMGJvd2x8ZW58MXx8fHwxNzY4NDY4NzI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    time: '12 mins',
    calories: '160 kcal',
    difficulty: 'Easy',
    ingredients: ['vegetables', 'fruits'],
    dietTypes: ['vegan', 'vegetarian', 'keto', 'gluten-free']
  }
];

export default function RecipesCooking() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFilter = (filterArray: string[], setFilter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIngredients = selectedIngredients.length === 0 || 
      selectedIngredients.some(ing => recipe.ingredients.includes(ing));
    const matchesDiet = selectedDiets.length === 0 || 
      selectedDiets.some(diet => recipe.dietTypes.includes(diet));
    
    return matchesSearch && matchesIngredients && matchesDiet;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F0F9F4]">
      <Header />
      
      {/* Hero Section - Recipe of the Week */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1745793652792-dd1624661142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZ3JlZW4lMjBzYWxhZCUyMGJvd2x8ZW58MXx8fHwxNzY4NDY4NzI5fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Recipe of the Week"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <span className="inline-block px-4 py-1.5 bg-primary/90 rounded-full text-sm font-semibold mb-4">
              Recipe of the Week
            </span>
            <h1 className="text-5xl font-bold mb-4">Fresh Garden Salad Bowl</h1>
            <p className="text-lg text-gray-200 mb-6">
              A vibrant mix of organic greens, seasonal vegetables, and a zesty lemon vinaigrette. 
              Perfect for a light lunch or healthy dinner option.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>12 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span>160 kcal</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                <span>Easy</span>
              </div>
            </div>
            <button className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all">
              Cook Now
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Search Recipes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Main Ingredients Filter */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  Main Ingredients
                </h3>
                <div className="space-y-3">
                  {[
                    { value: 'vegetables', label: 'Vegetables', icon: Carrot },
                    { value: 'fruits', label: 'Fruits', icon: Apple },
                    { value: 'meat', label: 'Meat & Seafood', icon: Beef }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => toggleFilter(selectedIngredients, setSelectedIngredients, value)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        selectedIngredients.includes(value)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left text-sm font-medium">{label}</span>
                      {selectedIngredients.includes(value) && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diet Type Filter */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Diet Type</h3>
                <div className="space-y-2">
                  {['vegan', 'vegetarian', 'keto', 'gluten-free'].map((diet) => (
                    <label
                      key={diet}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedDiets.includes(diet)}
                          onChange={() => toggleFilter(selectedDiets, setSelectedDiets, diet)}
                          className="w-5 h-5 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                        {diet}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedIngredients.length > 0 || selectedDiets.length > 0 || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedIngredients([]);
                    setSelectedDiets([]);
                    setSearchQuery('');
                  }}
                  className="w-full py-2.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Recipe Cards - Masonry Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? 's' : ''} Found
              </h2>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No recipes found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 2, 1200: 3 }}>
                <Masonry gutter="24px">
                  {filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                    >
                      <div className="relative overflow-hidden">
                        <ImageWithFallback
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {recipe.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                          {recipe.title}
                        </h3>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{recipe.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4" />
                            <span>{recipe.calories}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ChefHat className="w-4 h-4" />
                            <span>{recipe.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
