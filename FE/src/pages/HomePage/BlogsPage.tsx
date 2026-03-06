import { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Loader2,
  Leaf,
  Hash,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '../../components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useAuth } from '../../context/AuthContext';
import blogService, { BlogPost, BlogPagination } from '../../services/blogService';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Create Post Card ───────────────────────────────────────────────────────
function CreatePostCard({
  onPostCreated,
  user,
}: {
  onPostCreated: () => void;
  user: any;
}) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (images.length >= 4) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => {
          if (prev.length >= 4) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please write something before posting');
      return;
    }
    setSubmitting(true);
    try {
      await blogService.createPost({ content: content.trim(), images, tags });
      setContent('');
      setImages([]);
      setTags([]);
      setShowImageInput(false);
      toast.success('Your post has been submitted and is pending review!');
      onPostCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border-2 border-emerald-200">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-semibold">
            {user?.name ? getInitials(user.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about organic living..."
            className="w-full resize-none border-0 focus:outline-none text-[15px] text-gray-800 placeholder:text-gray-400 min-h-[80px]"
            maxLength={3000}
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full"
                >
                  #{tag}
                  <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <button
            onClick={() => {
              setShowImageInput(!showImageInput);
              if (!showImageInput) fileInputRef.current?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Tag Input */}
          <div className="flex items-center gap-1">
            <Hash className="w-4 h-4 text-emerald-500" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag"
              className="w-20 text-sm border-0 focus:outline-none text-gray-600 placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </div>
  );
}

// ─── Blog Post Card ─────────────────────────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  currentUser,
  onUpdated,
}: {
  post: BlogPost;
  currentUserId?: string;
  currentUser?: { name: string; avatar?: string };
  onUpdated: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState<string[]>(post.likes || []);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [updatingPost, setUpdatingPost] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [showAllImages, setShowAllImages] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLiked = currentUserId ? localLikes.includes(currentUserId) : false;
  const isAuthor = currentUserId === post.author._id;

  useEffect(() => {
    setLocalLikes(post.likes || []);
    setLocalComments(post.comments || []);
  }, [post]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error('Please login to like posts');
      return;
    }
    setLiking(true);
    try {
      const result = await blogService.toggleLike(post._id);
      if (result.liked) {
        setLocalLikes((prev) => [...prev, currentUserId]);
      } else {
        setLocalLikes((prev) => prev.filter((id) => id !== currentUserId));
      }
    } catch {
      toast.error('Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentUserId) {
      toast.error('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const updated = await blogService.addComment(post._id, commentText.trim());
      setLocalComments(updated.comments || []);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const updated = await blogService.deleteComment(post._id, commentId);
      setLocalComments(updated.comments || []);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setUpdatingPost(true);
    try {
      await blogService.updatePost(post._id, { content: editContent.trim() });
      setEditing(false);
      toast.success('Cập nhật bài viết thành công');
      onUpdated();
    } catch {
      toast.error('Cập nhật bài viết thất bại');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blogService.deletePost(post._id);
      toast.success('Post deleted');
      setConfirmDelete(false);
      onUpdated();
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const displayedImages = showAllImages ? (post.images || []) : (post.images || []).slice(0, 3);
  const extraImageCount = (post.images || []).length - 3;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-emerald-200">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-semibold">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
              {isAuthor && post.status === 'pending' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </span>
              )}
              {isAuthor && post.status === 'rejected' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  <XCircle className="w-3 h-3" />
                  Rejected
                </span>
              )}
            </div>
          </div>
        </div>

        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none border border-gray-200 rounded-lg p-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
              maxLength={3000}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent(post.content);
                }}
                className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updatingPost}
                className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {updatingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        )}

        {/* Tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Rejection reason — only visible to author */}
        {isAuthor && post.status === 'rejected' && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-xs text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>
              <span className="font-semibold">Rejection reason: </span>
              {post.rejectedReason || 'Your post did not meet community guidelines.'}
            </span>
          </div>
        )}
      </div>

      {/* Images */}
      {(post.images || []).length > 0 && (
        <div className={`grid gap-0.5 ${displayedImages.length === 1 ? 'grid-cols-1' : displayedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {displayedImages.map((img, i) => (
            <div
              key={i}
              className={`relative ${displayedImages.length === 1 ? 'max-h-[400px]' : 'h-48'} overflow-hidden cursor-pointer`}
              onClick={() => setShowAllImages(true)}
            >
              <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {i === 2 && extraImageCount > 0 && !showAllImages && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{extraImageCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Like & Comment Counts */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
        <span>
          {localLikes.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              </span>
              {localLikes.length} {localLikes.length === 1 ? 'like' : 'likes'}
            </span>
          )}
        </span>
        <button
          onClick={() => setShowComments(!showComments)}
          className="hover:underline"
        >
          {localComments.length > 0 && `${localComments.length} ${localComments.length === 1 ? 'comment' : 'comments'}`}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-100 flex">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            isLiked
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500' : ''}`} />
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
          {/* Comment List */}
          {localComments.map((c: any) => (
            <div key={c._id} className="flex gap-2.5 group">
              <Avatar className="w-8 h-8">
                <AvatarImage src={c.user?.avatar} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {c.user?.name ? getInitials(c.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-white rounded-xl px-3 py-2 inline-block">
                  <p className="text-xs font-semibold text-gray-900">{c.user?.name || 'User'}</p>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 px-1">
                  <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                  {(currentUserId === c.user?._id || currentUserId === post.author._id) && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="text-[11px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Comment Input */}
          {currentUserId && (
            <div className="flex gap-2 items-center">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  {currentUser?.name ? getInitials(currentUser.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-full px-3 py-1.5">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 text-sm border-0 focus:outline-none bg-transparent"
                />
                <button
                  onClick={handleComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="p-1 text-emerald-500 hover:text-emerald-600 disabled:text-gray-300"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Delete post?</p>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Blogs Page ─────────────────────────────────────────────────────────
export default function BlogsPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<BlogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [myPendingPosts, setMyPendingPosts] = useState<BlogPost[]>([]);

  const loadTags = async () => {
    try {
      const tags = await blogService.getTags();
      setAvailableTags(tags);
    } catch {
      // silently fail
    }
  };

  const loadPosts = async (page: number = 1, append: boolean = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await blogService.getFeed(page, 10, selectedTag);
      if (append) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMyPendingPosts = async () => {
    try {
      const result = await blogService.getMyPosts(1, 50);
      setMyPendingPosts(result.posts.filter((p) => p.status === 'pending' || p.status === 'rejected'));
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [selectedTag]);

  useEffect(() => {
    if (isAuthenticated && user?._id) loadMyPendingPosts();
  }, [isAuthenticated, user?._id]);

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.pages) {
      loadPosts(pagination.page + 1, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full mb-3">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Green Living Community</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Community Blog</h1>
          <p className="text-gray-500 mt-1">Share tips, recipes & stories about organic living</p>
        </div>

        {/* Tags Filter - only show when tags exist */}
        {availableTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(undefined)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                !selectedTag
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              All Posts
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? undefined : tag)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Create Post (only for logged-in users) */}
        {isAuthenticated && user && (
          <div className="mb-5">
            <CreatePostCard user={user} onPostCreated={() => { loadPosts(1); loadTags(); loadMyPendingPosts(); }} />
          </div>
        )}

        {/* My Pending / Rejected Posts */}
        {myPendingPosts.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Your pending / rejected posts</p>
            <div className="space-y-3">
              {myPendingPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id}
                  currentUser={user ? { name: user.name, avatar: user.avatar } : undefined}
                  onUpdated={() => { loadMyPendingPosts(); loadPosts(1); }}
                />
              ))}
            </div>
            <hr className="my-5 border-gray-200" />
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Leaf className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No posts yet</h3>
            <p className="text-gray-400 mt-1">Be the first to share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                currentUser={user ? { name: user.name, avatar: user.avatar } : undefined}
                onUpdated={() => loadPosts(1)}
              />
            ))}

            {/* Load More */}
            {pagination && pagination.page < pagination.pages && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        FreshMarket Community &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
