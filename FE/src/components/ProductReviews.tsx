import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ShoppingBag } from 'lucide-react';
import { Review, RatingStats } from '../types';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Can review state
  const [canReviewData, setCanReviewData] = useState<{ canReview: boolean; reason?: string; hasPurchased: boolean } | null>(null);

  useEffect(() => {
    loadReviews();
    loadStats();
    if (user) {
      loadMyReview();
      loadCanReview();
    }
  }, [productId, page, user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getProductReviews(productId, page, 10);
      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await reviewService.getProductRatingStats(productId);
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMyReview = async () => {
    try {
      const data = await reviewService.getMyProductReview(productId);
      setMyReview(data);
      if (data) {
        setRating(data.rating);
        setComment(data.comment);
      }
    } catch (error: any) {
      // User hasn't reviewed yet
      setMyReview(null);
    }
  };

  const loadCanReview = async () => {
    try {
      const data = await reviewService.canReview(productId);
      setCanReviewData(data);
    } catch (error: any) {
      // Silently fail
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to review this product');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter your review comment');
      return;
    }

    try {
      if (myReview) {
        await reviewService.updateReview(myReview._id, { rating, comment });
        toast.success('Review updated successfully!');
      } else {
        await reviewService.createReview(productId, { rating, comment });
        toast.success('Your review has been submitted!');
      }
      
      setShowForm(false);
      setComment('');
      setRating(5);
      loadReviews();
      loadStats();
      loadMyReview();
      loadCanReview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(myReview._id);
      toast.success('Review deleted successfully');
      setMyReview(null);
      setShowForm(false);
      loadReviews();
      loadStats();
      loadCanReview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markHelpful(reviewId);
      loadReviews();
    } catch (error: any) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (interactive ? (hoveredRating || rating) : count)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Product Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-yellow-400">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center my-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <div className="text-gray-600">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-16">{stars} {stars === 1 ? 'star' : 'stars'}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${stats.totalReviews > 0
                            ? (stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100
                            : 0
                          }%`
                        }}
                      />
                    </div>
                    <span className="text-sm w-12 text-right">
                      {stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            {/* Not purchased yet - show static message */}
            {canReviewData && !canReviewData.hasPurchased && !myReview && (
              <div className="flex items-center gap-3 text-gray-500">
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Purchase this product to leave a review.
                </p>
              </div>
            )}

            {/* Has purchased, not reviewed yet, form not open */}
            {canReviewData && canReviewData.hasPurchased && !myReview && !showForm && (
              <Button onClick={() => setShowForm(true)} className="w-full">
                Write a Review
              </Button>
            )}

            {/* My existing review */}
            {!showForm && myReview && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Your Review</p>
                    {renderStars(myReview.rating)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleDeleteReview}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-gray-700">{myReview.comment}</p>
              </div>
            )}

            {/* Review form */}
            {showForm && (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Rating
                  </label>
                  {renderStars(rating, true)}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comment
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {myReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      if (myReview) {
                        setRating(myReview.rating);
                        setComment(myReview.comment);
                      } else {
                        setRating(5);
                        setComment('');
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          All Reviews ({stats?.totalReviews || 0})
        </h3>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No reviews yet. Be the first to review this product!
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={review.user.avatar} />
                    <AvatarFallback>
                      {review.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          {review.isVerifiedPurchase && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 text-gray-700">{review.comment}</p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Review ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={() => handleMarkHelpful(review._id)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.helpfulCount})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
