import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Star,
  Check,
  Leaf
} from 'lucide-react';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { RatingDisplay } from '../../components/RatingDisplay';
import { ProductReviews } from '../../components/ProductReviews';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedProduct, fetchProductById, products, fetchProducts, loading } = useProducts();
  const { addToCart } = useCart();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (id) {
      // Scroll to top with smooth animation when product changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      fetchProductById(id);
      // Fetch related products
      fetchProducts({ limit: 8 });
      
      // Reset states when switching products
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [id, fetchProductById, fetchProducts]);

  const handleAddToCart = () => {
    if (selectedProduct) {
      const cartProduct = {
        id: selectedProduct._id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price,
        image: selectedProduct.images?.[0] || selectedProduct.thumbnail || '',
        category: selectedProduct.category
      };
      for (let i = 0; i < quantity; i++) {
        addToCart(cartProduct);
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const nextImage = () => {
    if (selectedProduct?.images) {
      setSelectedImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
    }
  };

  const prevImage = () => {
    if (selectedProduct?.images) {
      setSelectedImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
    }
  };

  const relatedProducts = products.filter(p => 
    p._id !== selectedProduct?._id && 
    p.category === selectedProduct?.category
  ).slice(0, 4);

  if (loading && !selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col justify-center items-center py-32">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const images = selectedProduct.images?.length > 0 
    ? selectedProduct.images 
    : [selectedProduct.thumbnail || ''];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-emerald-600">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/products" className="text-gray-500 hover:text-emerald-600">Products</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{selectedProduct.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <ImageWithFallback
                  src={images[selectedImageIndex]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain p-4"
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {selectedProduct.isOrganic && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                      <Leaf className="w-3 h-3 mr-1" />
                      Organic
                    </Badge>
                  )}
                  {selectedProduct.isFeatured && (
                    <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
                  )}
                  {selectedProduct.discountPercentage && selectedProduct.discountPercentage > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      -{selectedProduct.discountPercentage}%
                    </Badge>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index 
                          ? 'border-emerald-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-emerald-600 font-medium uppercase tracking-wide">
                    {selectedProduct.category}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {selectedProduct.name}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-4">
                  <RatingDisplay 
                    rating={selectedProduct.rating || 0}
                    reviewCount={selectedProduct.reviewCount || 0}
                    size="md"
                  />
                  {selectedProduct.soldCount && selectedProduct.soldCount > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedProduct.soldCount} sold
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-emerald-600">
                  ${selectedProduct.price.toFixed(2)}
                </span>
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                  <span className="text-xl text-gray-400 line-through">
                    ${selectedProduct.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-gray-500">/ {selectedProduct.unit || 'unit'}</span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {selectedProduct.stock > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">In Stock</span>
                    <span className="text-gray-500">({selectedProduct.stock} available)</span>
                  </>
                ) : (
                  <span className="text-red-500 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-gray-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Origin & Certifications */}
              <div className="space-y-2">
                {selectedProduct.origin && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Origin:</span>
                    <span className="font-medium">{selectedProduct.origin}</span>
                  </div>
                )}
                {selectedProduct.certifications && selectedProduct.certifications.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Certifications:</span>
                    <div className="flex gap-2">
                      {selectedProduct.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                    className="p-3 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= selectedProduct.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  disabled={selectedProduct.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  size="lg"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={selectedProduct.stock <= 0}
                >
                  Buy Now
                </Button>
              </div>

              {/* Share */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="text-gray-500 text-sm">Share:</span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col items-center text-center">
                  <Truck className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-xs text-gray-600">Free Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-xs text-gray-600">Quality Guaranteed</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RotateCcw className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-xs text-gray-600">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mt-8 p-6 lg:p-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition Info</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Product Description</h3>
              <div className="prose max-w-none text-gray-600">
                <p>{selectedProduct.description}</p>
                
                {selectedProduct.isOrganic && (
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                      <Leaf className="w-5 h-5" />
                      100% Organic Product
                    </h4>
                    <p className="text-emerald-700 mt-2 text-sm">
                      This product is certified organic, grown without synthetic pesticides, 
                      herbicides, or GMOs. Our organic farming practices support sustainable 
                      agriculture and protect the environment.
                    </p>
                  </div>
                )}

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Product Details</h4>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li><strong>SKU:</strong> {selectedProduct.sku || 'N/A'}</li>
                      <li><strong>Category:</strong> {selectedProduct.category}</li>
                      <li><strong>Unit:</strong> {selectedProduct.unit || 'unit'}</li>
                      {selectedProduct.weight && (
                        <li><strong>Weight:</strong> {selectedProduct.weight}g</li>
                      )}
                    </ul>
                  </div>
                  
                  {selectedProduct.farmer && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900">Farmer Information</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li><strong>Name:</strong> {selectedProduct.farmer.name}</li>
                        <li><strong>Email:</strong> {selectedProduct.farmer.email}</li>
                        {selectedProduct.farmer.phone && (
                          <li><strong>Phone:</strong> {selectedProduct.farmer.phone}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Nutrition Information</h3>
              {selectedProduct.nutritionInfo ? (
                <div className="grid md:grid-cols-5 gap-4">
                  {selectedProduct.nutritionInfo.calories !== undefined && (
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {selectedProduct.nutritionInfo.calories}
                      </div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                  )}
                  {selectedProduct.nutritionInfo.protein !== undefined && (
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedProduct.nutritionInfo.protein}g
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                  )}
                  {selectedProduct.nutritionInfo.carbs !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedProduct.nutritionInfo.carbs}g
                      </div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                  )}
                  {selectedProduct.nutritionInfo.fat !== undefined && (
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedProduct.nutritionInfo.fat}g
                      </div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  )}
                  {selectedProduct.nutritionInfo.fiber !== undefined && (
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedProduct.nutritionInfo.fiber}g
                      </div>
                      <div className="text-sm text-gray-600">Fiber</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Nutrition information not available for this product.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-4">
              <ProductReviews productId={selectedProduct._id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
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
