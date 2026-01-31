import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, error, fetchProducts, pagination } = useProducts();
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync state with URL params when navigating from Header dropdown
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
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
  }, [searchParams]);

  // Fetch products when filters change
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 12,
      sortBy,
      sortOrder,
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
    const category = newCategory ?? selectedCategory;
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
              Discover fresh organic products, carefully selected from local farms
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
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
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="seafood">Seafood</SelectItem>
                  <SelectItem value="herbs">Herbs</SelectItem>
                  <SelectItem value="nuts">Nuts</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                  <SelectItem value="processed">Processed Foods</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(currentPage - 1)}
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
                        className={currentPage === page ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
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
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">© 2026 FreshMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
