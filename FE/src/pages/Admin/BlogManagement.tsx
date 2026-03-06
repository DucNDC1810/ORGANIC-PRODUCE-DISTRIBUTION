import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  Heart,
  AlertCircle,
  User,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { toast } from "sonner";
import blogService, { BlogPost, BlogStatus } from "../../services/blogService";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = BlogStatus | "all";

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BlogStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconClass: string;
}) => (
  <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <Card className="border border-gray-100 overflow-hidden">
    <div className="h-1 bg-gray-100 w-full" />
    <CardContent className="p-5 space-y-3 pt-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </div>
      <Separator />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// ─── Blog Card ────────────────────────────────────────────────────────────────

interface BlogCardProps {
  post: BlogPost;
  onView: (post: BlogPost) => void;
  onApprove: (post: BlogPost) => void;
  onReject: (post: BlogPost) => void;
  actionLoading: string | null;
}

const BlogCard = ({
  post,
  onView,
  onApprove,
  onReject,
  actionLoading,
}: BlogCardProps) => {
  const status = (post.status ?? "approved") as BlogStatus;
  const cfg = STATUS_CONFIG[status];
  const isLoading = actionLoading === post._id;

  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Status accent bar */}
      <div
        className={`h-1 w-full ${
          status === "approved"
            ? "bg-emerald-400"
            : status === "rejected"
            ? "bg-red-400"
            : "bg-amber-400"
        }`}
      />

      <CardContent className="p-5 space-y-3">
        {/* Header: author + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                <User className="w-4 h-4 text-green-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {post.author?.name ?? "Anonymous"}
              </p>
              <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${cfg.color}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
        </div>

        {/* Content preview */}
        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
          {post.content}
        </p>

        {/* Rejected reason */}
        {status === "rejected" && post.rejectedReason && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Rejection reason: {post.rejectedReason}</span>
          </div>
        )}

        {/* Meta: tags, images, likes, comments */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {post.images?.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              {post.images.length} image(s)
            </span>
          )}
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {post.likes?.length ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comments?.length ?? 0}
          </span>
          {post.tags?.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="w-3.5 h-3.5" />
              {post.tags.slice(0, 3).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-4"
                >
                  {t}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <span className="text-gray-400">+{post.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => onView(post)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Button>
              </TooltipTrigger>
              <TooltipContent>View full content</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {status === "pending" && (
            <>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => onApprove(post)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onReject(post)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Reject
              </Button>
            </>
          )}

          {status === "rejected" && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => onApprove(post)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Re-approve
            </Button>
          )}

          {status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onReject(post)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Revoke
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });

  // View dialog
  const [viewPost, setViewPost] = useState<BlogPost | null>(null);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<BlogPost | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (p: number, status: FilterStatus) => {
      setLoading(true);
      try {
        const statusParam = status === "all" ? undefined : (status as BlogStatus);
        const res = await blogService.getAllBlogsAdmin(p, LIMIT, statusParam);
        setPosts(res.posts);
        setTotalPages(res.pagination?.pages ?? 1);
        if (res.counts) setCounts(res.counts);
      } catch {
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [] // stable reference — no stale closure; params always passed explicitly
  );

  useEffect(() => {
    fetchPosts(page, filterStatus);
  }, [page, filterStatus, fetchPosts]);

  const handleTabChange = (val: string) => {
    setFilterStatus(val as FilterStatus);
    setPage(1);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApprove = async (post: BlogPost) => {
    setActionLoading(post._id);
    try {
      await blogService.approveBlog(post._id);
      toast.success("Post approved successfully");
      fetchPosts(page, filterStatus);
    } catch {
      toast.error("Failed to approve post");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOpen = (post: BlogPost) => {
    setRejectTarget(post);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await blogService.rejectBlog(rejectTarget._id, rejectReason.trim() || undefined);
      toast.success("Post rejected");
      setRejectTarget(null);
      fetchPosts(page, filterStatus);
    } catch {
      toast.error("Failed to reject post");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await blogService.deletePost(deleteTarget._id);
      toast.success("Post deleted");
      setDeleteTarget(null);
      fetchPosts(page, filterStatus);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filtered list (client-side search on loaded page) ─────────────────────

  const filtered = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.content?.toLowerCase().includes(q) ||
      p.author?.name?.toLowerCase().includes(q) ||
      p.author?.email?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.includes(q))
    );
  });

  const totalAll = counts.pending + counts.approved + counts.rejected;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            Blog Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Approve and manage user posts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          onClick={() => fetchPosts(page, filterStatus)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={totalAll}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={counts.pending}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={counts.approved}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={counts.rejected}
          iconClass="bg-red-50 text-red-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Status filter tabs */}
        <Tabs value={filterStatus} onValueChange={handleTabChange}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3 gap-1.5">
              <Clock className="w-3 h-3" />
              Pending
              {counts.pending > 0 && (
                <span className="ml-1 bg-amber-500 text-white rounded-full text-[10px] px-1.5 py-0 leading-4">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs px-3 gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs px-3 gap-1.5">
              <XCircle className="w-3 h-3" />
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search by content, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText className="w-14 h-14 mb-3 opacity-30" />
          <p className="text-base font-medium">No posts found</p>
          <p className="text-sm">
            {search ? "Try different keywords" : "No posts in this filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <BlogCard
              key={post._id}
              post={post}
              onView={setViewPost}
              onApprove={handleApprove}
              onReject={handleRejectOpen}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── View Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!viewPost} onOpenChange={(o) => !o && setViewPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-600" />
              Post Details
            </DialogTitle>
            <DialogDescription>
              {viewPost && (
                <span>
                  Posted by{" "}
                  <strong className="text-gray-700">{viewPost.author?.name}</strong>{" "}
                  at {formatDate(viewPost.createdAt)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewPost && (
            <div className="space-y-4 pt-1">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    STATUS_CONFIG[(viewPost.status ?? "approved") as BlogStatus].color
                  }`}
                >
                  {STATUS_CONFIG[(viewPost.status ?? "approved") as BlogStatus].icon}
                  {STATUS_CONFIG[(viewPost.status ?? "approved") as BlogStatus].label}
                </span>
                {viewPost.rejectedReason && (
                  <span className="text-xs text-red-500">— {viewPost.rejectedReason}</span>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
                {viewPost.author?.avatar ? (
                  <img
                    src={viewPost.author.avatar}
                    alt={viewPost.author.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border border-gray-200">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {viewPost.author?.name}
                  </p>
                  <p className="text-xs text-gray-500">{viewPost.author?.email}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {viewPost.content}
              </div>

              {/* Images */}
              {viewPost.images?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Images ({viewPost.images.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {viewPost.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Image ${i + 1}`}
                        className="w-full h-36 object-cover rounded-lg border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/400x200?text=Image+Error";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewPost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewPost.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 text-sm text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" /> {viewPost.likes?.length ?? 0} like(s)
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" /> {viewPost.comments?.length ?? 0} comment(s)
                </span>
              </div>

              {/* Comments list */}
              {viewPost.comments?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Comments ({viewPost.comments.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {viewPost.comments.map((c) => (
                      <div key={c._id} className="flex gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                        {c.user?.avatar ? (
                          <img
                            src={c.user.avatar}
                            alt={c.user.name}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            <User className="w-3.5 h-3.5 text-green-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{c.user?.name ?? "Anonymous"}</p>
                          <p className="text-xs text-gray-600 mt-0.5 break-words">{c.content}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            {viewPost && (viewPost.status ?? "approved") !== "approved" && (
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
                onClick={() => {
                  if (viewPost) {
                    handleApprove(viewPost);
                    setViewPost(null);
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {(viewPost.status ?? "approved") === "rejected" ? "Re-approve" : "Approve"}
              </Button>
            )}
            {viewPost && (viewPost.status ?? "approved") !== "rejected" && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                onClick={() => {
                  if (viewPost) {
                    handleRejectOpen(viewPost);
                    setViewPost(null);
                  }
                }}
              >
                <XCircle className="w-4 h-4" />
                {(viewPost.status ?? "approved") === "approved" ? "Revoke" : "Reject"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setViewPost(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Post
            </DialogTitle>
            <DialogDescription>
              You can provide a reason so the author understands why their post was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Rejection reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="E.g. Inappropriate content, missing information..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={300}
              className="resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {rejectReason.length}/300
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setRejectTarget(null)}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white gap-1.5"
              onClick={handleRejectConfirm}
              disabled={rejectLoading}
            >
              {rejectLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post by{" "}
              <strong>{deleteTarget?.author?.name}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

