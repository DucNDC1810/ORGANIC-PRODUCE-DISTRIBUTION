import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'milk & dairy': 'milk-dairy',
  'milk and dairy': 'milk-dairy',
  dairy: 'milk-dairy',
  'milk-dairy': 'milk-dairy',
  'milk_dairy': 'milk-dairy',
};

const normalizeCategoryToken = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const resolveCategoryValue = (
  rawValue: string | null,
  categories: Array<{ slug: string; name: string }>,
): string => {
  if (!rawValue) return 'all';

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') {
    return 'all';
  }

  const aliased = LEGACY_CATEGORY_ALIASES[trimmed.toLowerCase()] || trimmed;

  if (!categories.length) {
    return aliased;
  }

  const exactSlug = categories.find(
    (category) => category.slug.toLowerCase() === aliased.toLowerCase(),
  );
  if (exactSlug) {
    return exactSlug.slug;
  }

  const exactName = categories.find(
    (category) => category.name.toLowerCase() === aliased.toLowerCase(),
  );
  if (exactName) {
    return exactName.slug;
  }

  const normalizedInput = normalizeCategoryToken(aliased);
  if (!normalizedInput) {
    return aliased;
  }

  const fuzzyMatch = categories.find((category) => {
    const normalizedSlug = normalizeCategoryToken(category.slug);
    const normalizedName = normalizeCategoryToken(category.name);

    return (
      normalizedSlug === normalizedInput ||
      normalizedName === normalizedInput ||
      normalizedSlug.includes(normalizedInput) ||
      normalizedName.includes(normalizedInput) ||
      normalizedInput.includes(normalizedSlug) ||
      normalizedInput.includes(normalizedName)
    );
  });

  return fuzzyMatch?.slug || aliased;
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, error, fetchProducts, pagination } = useProducts();
  const { categories, fetchCategories } = useCategories();

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((category) => ({
        value: category.slug,
        label: category.name,
      }));
    }

    return [
      { value: 'vegetables', label: 'Vegetables' },
      { value: 'fruits', label: 'Fruits' },
      { value: 'grains', label: 'Grains' },
      { value: 'milk-dairy', label: 'Milk & Dairy' },
    ];
  }, [categories]);
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    resolveCategoryValue(searchParams.get('category'), categories),
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Load active categories for filter dropdown and slug resolution
  useEffect(() => {
    fetchCategories({ isActive: true, limit: 100 });
  }, [fetchCategories]);

  // Sync state with URL params when navigating from Header dropdown
  useEffect(() => {
    const categoryFromUrl = resolveCategoryValue(searchParams.get('category'), categories);
    const searchFromUrl = searchParams.get('search') || '';
    const sortByFromUrl = searchParams.get('sortBy') || 'createdAt';
    const sortOrderFromUrl = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const pageFromUrl = Number(searchParams.get('page')) || 1;
    
    // Only update if values are different to prevent loops
    let hasChanges = false;
    
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
      hasChanges = true;
    }
    if (searchFromUrl !== searchTerm) {
      setSearchTerm(searchFromUrl);
      hasChanges = true;
    }
    if (sortByFromUrl !== sortBy) {
      setSortBy(sortByFromUrl);
      hasChanges = true;
    }
    if (sortOrderFromUrl !== sortOrder) {
      setSortOrder(sortOrderFromUrl);
      hasChanges = true;
    }
    if (pageFromUrl !== currentPage && !hasChanges) {
      setCurrentPage(pageFromUrl);
    } else if (hasChanges) {
      setCurrentPage(1);
    }
  }, [searchParams, categories]);

  // Fetch products when filters change
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 12,
      sortBy,
      sortOrder,
      isActive: true,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedCategory && selectedCategory !== 'all') {
      params.category = selectedCategory;
    }

    fetchProducts(params);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, currentPage, fetchProducts]);

  // Update URL when filters change (separate from fetch to prevent loops)
  const updateUrlParams = (newCategory?: string, newSearch?: string, newSortBy?: string, newSortOrder?: string, newPage?: number) => {
    const newSearchParams = new URLSearchParams();
    const category = resolveCategoryValue(newCategory ?? selectedCategory, categories);
    const search = newSearch ?? searchTerm;
    const sort = newSortBy ?? sortBy;
    const order = newSortOrder ?? sortOrder;
    const page = newPage ?? currentPage;
    
    if (search) newSearchParams.set('search', search);
    if (category && category !== 'all') newSearchParams.set('category', category);
    if (sort !== 'createdAt') newSearchParams.set('sortBy', sort);
    if (order !== 'desc') newSearchParams.set('sortOrder', order);
    if (page > 1) newSearchParams.set('page', page.toString());
    
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateUrlParams(value, undefined, undefined, undefined, 1);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
    updateUrlParams(undefined, undefined, value, undefined, 1);
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
    setCurrentPage(1);
    updateUrlParams(undefined, undefined, undefined, value, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(undefined, undefined, undefined, undefined, page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrlParams(undefined, searchTerm, undefined, undefined, 1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = searchTerm || (selectedCategory && selectedCategory !== 'all') || sortBy !== 'createdAt' || sortOrder !== 'desc';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-500 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-6">
              Discover fresh organic products, carefully selected from local farms
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-emerald-50">
              <span>Fresh daily</span>
              <span className="text-white/60">•</span>
              <span>Safe sourcing</span>
              <span className="text-white/60">•</span>
              <span>Fast delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-emerald-100 p-4 md:p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-9 w-full border-emerald-100 focus-visible:ring-emerald-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                      updateUrlParams(undefined, '', undefined, undefined, 1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Search
              </Button>
            </form>

            {/* Filter Toggle for Mobile */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Filters - Desktop */}
            <div className={`flex flex-col lg:flex-row gap-4 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="soldCount">Best Selling</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
                  Search: {searchTerm}
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
                  Category: {categoryOptions.find((item) => item.value === selectedCategory)?.label || selectedCategory}
                </span>
              )}
              {sortBy !== 'createdAt' && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
                  Sort: {sortBy}
                </span>
              )}
              {sortOrder !== 'desc' && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
                  Order: Ascending
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {pagination ? (
              <>
                Showing <span className="font-semibold">{products.length}</span> of{' '}
                <span className="font-semibold">{pagination.totalProducts}</span> products
              </>
            ) : (
              <>Loading...</>
            )}
          </p>
          <div className="hidden md:block text-sm text-gray-500">
            {sortBy === 'createdAt' ? 'Newest first' : `Sorted by ${sortBy}`} ({sortOrder})
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-500 mb-4">Error loading products: {error}</p>
            <Button onClick={() => fetchProducts()}>Try Again</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try changing filters or search keywords</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl px-3 py-2 shadow-sm">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(currentPage - 1)}
                className="border-emerald-100"
              >
                Previous
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and pages around current
                  return page === 1 || 
                         page === pagination.totalPages || 
                         (page >= currentPage - 2 && page <= currentPage + 2);
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-100'}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
              
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
                className="border-emerald-100"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
            <div>
              <h3 className="text-lg font-semibold mb-3">FreshMarket</h3>
              <p className="text-sm text-gray-400 leading-6">
                Organic produce from trusted local farms, delivered fresh every day.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold tracking-wide uppercase text-emerald-300 mb-3">
                Shop
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/products?category=vegetables" className="hover:text-white">Vegetables</a></li>
                <li><a href="/products?category=fruits" className="hover:text-white">Fruits</a></li>
                <li><a href="/products?category=grains" className="hover:text-white">Grains</a></li>
                <li><a href="/products?category=milk-dairy" className="hover:text-white">Milk & Dairy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold tracking-wide uppercase text-emerald-300 mb-3">
                Customer Care
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/products" className="hover:text-white">How to Order</a></li>
                <li><a href="/products" className="hover:text-white">Delivery Policy</a></li>
                <li><a href="/products" className="hover:text-white">Returns & Refunds</a></li>
                <li><a href="/products" className="hover:text-white">FAQs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold tracking-wide uppercase text-emerald-300 mb-3">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: support@freshmarket.vn</li>
                <li>Phone: 1900 1234</li>
                <li>Hours: 08:00 - 21:00</li>
                <li>Address: Ho Chi Minh City, Vietnam</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>© 2026 FreshMarket. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/products" className="hover:text-gray-300">Privacy</a>
              <a href="/products" className="hover:text-gray-300">Terms</a>
              <a href="/products" className="hover:text-gray-300">Support</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
