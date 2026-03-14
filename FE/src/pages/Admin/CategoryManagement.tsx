import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Tag,
  LayoutGrid,
  Activity,
  EyeOff,
  BoxSelect,
  Boxes,
  MoreVertical,
  Power,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
import { useCategories } from "../../hooks/useCategories";
import { Category } from "../../services/categoryService";
import { productService, Product as ProductItem } from "../../services/productService";

// --- Category icon + color mapping by slug keywords ----------------------------
interface CategoryStyle {
  emoji: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
}

const SLUG_MAP: Array<{ keywords: string[]; style: CategoryStyle }> = [
  {
    keywords: ["vegetable", "veg", "rau", "salad", "green"],
    style: { emoji: "\uD83E\uDD6C", bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200", accent: "bg-emerald-500" },
  },
  {
    keywords: ["fruit", "apple", "berry", "citrus", "trai"],
    style: { emoji: "\uD83C\uDF4E", bg: "bg-red-100",     text: "text-red-500",     border: "border-red-200",     accent: "bg-red-500"     },
  },
  {
    keywords: ["herb", "spice", "thao", "basil", "mint"],
    style: { emoji: "\uD83C\uDF3F", bg: "bg-teal-100",    text: "text-teal-600",    border: "border-teal-200",    accent: "bg-teal-500"    },
  },
  {
    keywords: ["seafood", "fish", "shrimp", "dried", "ca", "tom"],
    style: { emoji: "\uD83D\uDC1F", bg: "bg-sky-100",     text: "text-sky-600",     border: "border-sky-200",     accent: "bg-sky-500"     },
  },
  {
    keywords: ["dairy", "milk", "cheese", "sua"],
    style: { emoji: "\uD83E\uDD5B", bg: "bg-amber-100",   text: "text-amber-600",   border: "border-amber-200",   accent: "bg-amber-500"   },
  },
  {
    keywords: ["grain", "rice", "wheat", "cereal", "gao"],
    style: { emoji: "\uD83C\uDF3E", bg: "bg-yellow-100",  text: "text-yellow-600",  border: "border-yellow-200",  accent: "bg-yellow-500"  },
  },
  {
    keywords: ["meat", "beef", "pork", "chicken", "thit"],
    style: { emoji: "\uD83E\uDD69", bg: "bg-rose-100",    text: "text-rose-600",    border: "border-rose-200",    accent: "bg-rose-500"    },
  },
  {
    keywords: ["grape", "wine", "nho"],
    style: { emoji: "\uD83C\uDF47", bg: "bg-violet-100",  text: "text-violet-600",  border: "border-violet-200",  accent: "bg-violet-500"  },
  },
  {
    keywords: ["carrot", "root", "cu"],
    style: { emoji: "\uD83E\uDD55", bg: "bg-orange-100",  text: "text-orange-600",  border: "border-orange-200",  accent: "bg-orange-500"  },
  },
];

const DEFAULT_CAT_STYLE: CategoryStyle = {
  emoji: "\uD83D\uDCE6", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", accent: "bg-gray-400",
};

const getCategoryStyle = (slug: string): CategoryStyle => {
  const lower = slug.toLowerCase();
  for (const entry of SLUG_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.style;
  }
  return DEFAULT_CAT_STYLE;
};

// --- Form state -----------------------------------------------------------------
interface FormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
}
const EMPTY_FORM: FormData = { name: "", slug: "", description: "", image: "", sortOrder: "0", isActive: true };

// --- Slug generator -------------------------------------------------------------
const generateSlug = (name: string) =>
  name.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// --- Stat card ------------------------------------------------------------------
const StatCard = ({ icon: Icon, label, value, iconClass }: {
  icon: React.ElementType; label: string; value: number | string; iconClass: string;
}) => (
  <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </CardContent>
  </Card>
);

// --- Skeleton card --------------------------------------------------------------
const SkeletonCard = () => (
  <Card className="border border-gray-100 overflow-hidden">
    <div className="h-1 bg-gray-100 w-full" />
    <CardContent className="p-4 space-y-3 pt-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Separator />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// --- Main component -------------------------------------------------------------
export default function AdminCategoryManagement() {
  const {
    categories,
    loading,
    pagination,
    fetchCategories,
    fetchCategoryStats,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    checkSlugExists,
  } = useCategories();

  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCat, setSelectedCat]   = useState<Category | null>(null);
  const [formData, setFormData]         = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState<Partial<Record<keyof FormData, string>>>({});
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugTaken, setSlugTaken]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<ProductItem[]>([]);
  const [categoryProductsTotal, setCategoryProductsTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);
  const ITEMS_PER_PAGE = 9;

  const loadData = useCallback(async (page = 1, search = "", status: "all" | "active" | "inactive" = "all") => {
    const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE };
    if (search.trim()) params.search = search.trim();
    if (status !== "all") params.isActive = status === "active";
    await fetchCategories(params);
  }, [fetchCategories]);

  useEffect(() => {
    loadData(1, searchTerm, statusFilter);
    fetchCategoryStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); loadData(1, searchTerm, statusFilter); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const resetForm = () => { setFormData(EMPTY_FORM); setFormErrors({}); setSlugTaken(false); };

  const validateForm = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.slug.trim()) e.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) e.slug = "Only lowercase letters, numbers and hyphens";
    if (slugTaken) e.slug = "Slug is already taken";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSlugCheck = async (slug: string, editingId?: string) => {
    if (!slug.trim()) return;
    setSlugChecking(true);
    const exists = await checkSlugExists(slug, editingId);
    setSlugTaken(exists);
    setSlugChecking(false);
    setFormErrors(prev => exists
      ? { ...prev, slug: "Slug is already taken" }
      : { ...prev, slug: undefined }
    );
  };

  const handleNameChange = (value: string, isEdit = false) => {
    const slug = generateSlug(value);
    setFormData(p => ({ ...p, name: value, slug }));
    setFormErrors(p => ({ ...p, name: undefined }));
    if (slug) handleSlugCheck(slug, isEdit ? selectedCat?._id : undefined);
  };

  const handleSlugChange = (value: string, isEdit = false) => {
    setFormData(p => ({ ...p, slug: value }));
    if (value.trim()) handleSlugCheck(value, isEdit ? selectedCat?._id : undefined);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    const result = await createCategory({
      name: formData.name.trim(), slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      sortOrder: parseInt(formData.sortOrder) || 0, isActive: formData.isActive,
    });
    setIsSaving(false);
    if (result) { setIsAddOpen(false); resetForm(); fetchCategoryStats(); }
  };

  const handleEditOpen = (cat: Category) => {
    setSelectedCat(cat);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || "",
      image: cat.image || "", sortOrder: String(cat.sortOrder), isActive: cat.isActive });
    setFormErrors({}); setSlugTaken(false); setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedCat || !validateForm()) return;
    setIsSaving(true);
    const result = await updateCategory(selectedCat._id, {
      name: formData.name.trim(), slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      sortOrder: parseInt(formData.sortOrder) || 0, isActive: formData.isActive,
    });
    setIsSaving(false);
    if (result) { setIsEditOpen(false); setSelectedCat(null); resetForm(); fetchCategoryStats(); }
  };

  const handleDeleteOpen = (cat: Category) => { setSelectedCat(cat); setIsDeleteOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedCat || selectedCat.productCount > 0) return;
    setIsDeleting(true);
    const ok = await deleteCategory(selectedCat._id);
    setIsDeleting(false);
    if (ok) { setIsDeleteOpen(false); setSelectedCat(null); fetchCategoryStats(); }
  };

  const handleToggle = async (cat: Category) => { await toggleCategoryStatus(cat._id); fetchCategoryStats(); };
  const handlePageChange = (page: number) => { setCurrentPage(page); loadData(page, searchTerm, statusFilter); };
  const handleRefresh = () => { loadData(currentPage, searchTerm, statusFilter); fetchCategoryStats(); };
  const visibleCategories = categories.filter((cat) => cat.slug !== 'mushrooms');
  const visibleStats = useMemo(() => {
    const total = visibleCategories.length;
    const active = visibleCategories.filter((cat) => cat.isActive).length;
    const inactive = total - active;
    const withProducts = visibleCategories.filter((cat) => (cat.productCount || 0) > 0).length;
    const totalProducts = visibleCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    const empty = total - withProducts;

    return { total, active, inactive, withProducts, totalProducts, empty };
  }, [visibleCategories]);

  const handleOpenProducts = async (cat: Category) => {
    setActiveCategory(cat);
    setIsProductsOpen(true);
    setProductsLoading(true);

    try {
      const response = await productService.getAllProducts({
        category: cat.slug,
        page: 1,
        limit: 100,
      });

      setCategoryProducts(response.data || []);
      setCategoryProductsTotal(response.pagination?.totalProducts || response.data?.length || 0);
    } catch {
      setCategoryProducts([]);
      setCategoryProductsTotal(0);
    } finally {
      setProductsLoading(false);
    }
  };

  // Shared form body
  const FormBody = ({ isEdit = false }) => (
    <div className="space-y-5 py-2">
      <div className="space-y-1.5">
        <Label htmlFor={isEdit ? "e-name" : "name"} className="text-sm font-medium">
          Category Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={isEdit ? "e-name" : "name"}
          placeholder="e.g. Organic Vegetables"
          value={formData.name}
          onChange={e => handleNameChange(e.target.value, isEdit)}
          className={formErrors.name ? "border-red-400 focus-visible:ring-red-300" : ""}
        />
        {formErrors.name && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{formErrors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={isEdit ? "e-slug" : "slug"} className="text-sm font-medium">
          URL Slug <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">/</span>
          <Input
            id={isEdit ? "e-slug" : "slug"}
            placeholder="organic-vegetables"
            value={formData.slug}
            onChange={e => handleSlugChange(e.target.value, isEdit)}
            className={`pl-6 pr-8 font-mono text-sm ${formErrors.slug ? "border-red-400 focus-visible:ring-red-300" : ""}`}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {slugChecking && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            {!slugChecking && formData.slug && !slugTaken && !formErrors.slug && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {!slugChecking && (slugTaken || formErrors.slug === "Slug is already taken") && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {formErrors.slug
          ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.slug}</p>
          : <p className="text-[11px] text-gray-400">Lowercase letters, numbers and hyphens only</p>
        }
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={isEdit ? "e-desc" : "desc"} className="text-sm font-medium">Description</Label>
        <Textarea
          id={isEdit ? "e-desc" : "desc"}
          placeholder="Brief description of this category..."
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          rows={3} maxLength={500} className="resize-none"
        />
        <p className="text-[11px] text-gray-400 text-right">{formData.description.length} / 500</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={isEdit ? "e-img" : "img"} className="text-sm font-medium">Image URL</Label>
        <div className="flex gap-2 items-center">
          <Input
            id={isEdit ? "e-img" : "img"}
            placeholder="https://..."
            value={formData.image}
            onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
            className="flex-1"
          />
          {formData.image ? (
            <img src={formData.image} alt="preview"
              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
              <Tag className="w-4 h-4 text-gray-300" />
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={isEdit ? "e-sort" : "sort"} className="text-sm font-medium">Sort Order</Label>
          <Input
            id={isEdit ? "e-sort" : "sort"}
            type="number" min="0" placeholder="0"
            value={formData.sortOrder}
            onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))}
          />
          <p className="text-[11px] text-gray-400">Lower = higher priority</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Visibility</Label>
          <div
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
              formData.isActive ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}
            onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
          >
            <span className={`text-sm font-medium ${formData.isActive ? "text-green-700" : "text-gray-500"}`}>
              {formData.isActive ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={formData.isActive}
              onCheckedChange={val => setFormData(p => ({ ...p, isActive: val }))}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {formData.isActive ? "Visible in the shop" : "Hidden from customers"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50/60 p-5">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Category Management</h1>
                <p className="text-sm text-gray-500">Organize and manage your product categories</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white h-9 gap-1.5"
                onClick={() => { resetForm(); setIsAddOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={LayoutGrid} label="Total"        value={visibleStats.total} iconClass="bg-blue-50   text-blue-600"   />
            <StatCard icon={Activity}   label="Active"       value={visibleStats.active} iconClass="bg-green-50  text-green-600"  />
            <StatCard icon={EyeOff}     label="Inactive"     value={visibleStats.inactive} iconClass="bg-gray-100  text-gray-500"   />
            <StatCard icon={Boxes}      label="Products" value={visibleStats.totalProducts} iconClass="bg-violet-50 text-violet-600" />
            <StatCard icon={BoxSelect}  label="Empty"        value={visibleStats.empty} iconClass="bg-amber-50  text-amber-600"  />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search by name or slug..."
                className="pl-9 bg-white h-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm("")}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)} className="h-9">
              <TabsList className="h-9 bg-white border border-gray-200">
                <TabsTrigger value="all"      className="text-xs h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white">All</TabsTrigger>
                <TabsTrigger value="active"   className="text-xs h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white">Active</TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs h-7 px-3 data-[state=active]:bg-green-600 data-[state=active]:text-white">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            {pagination && (
              <p className="text-xs text-gray-400 ml-auto hidden sm:block">
                {visibleCategories.length} categor{visibleCategories.length === 1 ? "y" : "ies"}
              </p>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visibleCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCategories.map(cat => {
                const style = getCategoryStyle(cat.slug);
                return (
                  <Card
                    key={cat._id}
                    className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden cursor-pointer"
                    onClick={() => handleOpenProducts(cat)}
                  >
                    <div className={`h-1 w-full ${cat.isActive ? style.accent : "bg-gray-200"}`} />
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex items-start gap-3 mb-3">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-2xl ${style.bg} ${style.border} border-2 flex items-center justify-center flex-shrink-0`}>
                            <span className="text-3xl leading-none select-none">{style.emoji}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{cat.name}</h3>
                            <Badge className={`text-[10px] px-1.5 h-4 font-medium border-0 ${
                              cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {cat.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">/{cat.slug}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEditOpen(cat); }}>
                              <Edit className="w-4 h-4 mr-2 text-gray-500" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleToggle(cat); }}>
                              <Power className="w-4 h-4 mr-2 text-gray-500" />
                              {cat.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handleDeleteOpen(cat); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5rem] mb-3">
                        {cat.description || <span className="italic text-gray-300">No description provided</span>}
                      </p>

                      <Separator className="mb-3" />

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className={`w-6 h-6 rounded-md ${style.bg} flex items-center justify-center`}>
                            <Package className={`w-3.5 h-3.5 ${style.text}`} />
                          </div>
                          <span className="font-semibold text-gray-800">{cat.productCount}</span>
                          <span>products</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm"
                                className="h-7 px-2.5 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => { e.stopPropagation(); handleEditOpen(cat); }}>
                                <Edit className="w-3.5 h-3.5 mr-1" />Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit category</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm"
                                className="h-7 px-2.5 text-xs text-gray-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleDeleteOpen(cat); }}>
                                <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete category</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">No categories found</h3>
                <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
                  {searchTerm
                    ? `No results matching "${searchTerm}". Try a different keyword.`
                    : "Create your first category to start organizing products."}
                </p>
                {!searchTerm && (
                  <Button className="bg-green-600 hover:bg-green-700 gap-1.5" onClick={() => { resetForm(); setIsAddOpen(true); }}>
                    <Plus className="w-4 h-4" />Create Category
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-1">
              <p className="text-sm text-gray-500">
                Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                <span className="text-gray-400 ml-1">({visibleCategories.length} visible)</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => handlePageChange(currentPage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - currentPage) <= 2)
                  .map(p => (
                    <Button key={p} size="icon" className={`h-8 w-8 text-sm ${
                      p === currentPage
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}
                      onClick={() => handlePageChange(p)}>
                      {p}
                    </Button>
                  ))}
                <Button variant="outline" size="icon" className="h-8 w-8"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => handlePageChange(currentPage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Category Products Dialog */}
        <Dialog open={isProductsOpen} onOpenChange={(open) => {
          setIsProductsOpen(open);
          if (!open) {
            setActiveCategory(null);
            setCategoryProducts([]);
            setCategoryProductsTotal(0);
          }
        }}>
          <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Products in {activeCategory?.name || "Category"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {categoryProductsTotal} product(s) in /{activeCategory?.slug || ""}
              </DialogDescription>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-0">Category</Badge>
                <Badge variant="outline" className="text-gray-600">/{activeCategory?.slug || "unknown"}</Badge>
              </div>
            </DialogHeader>

            {productsLoading ? (
              <div className="py-14 flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading products...
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="py-14 text-center text-gray-500">No products found in this category.</div>
            ) : (
              <div className="px-6 py-4 max-h-[58vh] overflow-y-auto bg-gray-50/40">
                <div className="space-y-2">
                {categoryProducts.map((product) => (
                  <div key={product._id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <img
                      src={product.thumbnail || product.images?.[0] || "https://via.placeholder.com/56?text=No+Image"}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/56?text=No+Image";
                      }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 break-words overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                        {product.description || "No description"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs text-gray-600">
                        Stock: {product.stock || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            <DialogFooter className="px-6 py-4 border-t bg-white">
              <Button variant="outline" onClick={() => setIsProductsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={open => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                Create New Category
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Add a new category to organize your products.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            {FormBody({ isEdit: false })}
            <Separator />
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 gap-1.5"
                onClick={handleCreate} disabled={isSaving || slugChecking || !formData.name.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={open => { setIsEditOpen(open); if (!open) { setSelectedCat(null); resetForm(); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-blue-600" />
                </div>
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Updating <span className="font-medium text-gray-700">"{selectedCat?.name}"</span>
              </DialogDescription>
            </DialogHeader>
            <Separator />
            {FormBody({ isEdit: true })}
            <Separator />
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedCat(null); resetForm(); }}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 gap-1.5"
                onClick={handleUpdate} disabled={isSaving || slugChecking || !formData.name.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                Delete Category?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-gray-600 pt-1">
                  <p>
                    You are about to delete <strong className="text-gray-900">"{selectedCat?.name}"</strong>.
                    This action <span className="text-red-600 font-medium">cannot be undone</span>.
                  </p>
                  {selectedCat && selectedCat.productCount > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5">
                      <div className="flex gap-2.5 items-start">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium text-amber-900 text-[13px]">
                            This category has <strong>{selectedCat.productCount}</strong> product(s) linked to it.
                          </p>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            You must remove or move all products before this category can be deleted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel onClick={() => setSelectedCat(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 gap-1.5"
                onClick={handleDeleteConfirm}
                disabled={isDeleting || (selectedCat?.productCount ?? 0) > 0}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {(selectedCat?.productCount ?? 0) > 0 ? 'Cannot Delete' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}