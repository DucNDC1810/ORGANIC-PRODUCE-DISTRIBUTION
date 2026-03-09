import { useState, useEffect, useCallback } from 'react';
import { 
  Percent,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  Copy,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { voucherService, Voucher, CreateVoucherPayload, UpdateVoucherPayload } from '../../services/voucherService';

const emptyForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  minSpend: '',
  usageLimit: '',
  perCustomerLimit: '1',
  startDate: '',
  endDate: '',
  isActive: true,
};

const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '-';

const getVoucherStatus = (v: Voucher): 'Active' | 'Scheduled' | 'Expired' => {
  const now = new Date();
  if (new Date(v.expiryDate) <= now) return 'Expired';
  if (new Date(v.startDate) > now) return 'Scheduled';
  return 'Active';
};

export default function ManagerVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState({ totalVouchers: 0, activeVouchers: 0, scheduledVouchers: 0, expiredVouchers: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const vouchersRes = await voucherService.getAllVouchers(1, 100);
      setVouchers(vouchersRes.data ?? []);
    } catch {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
    try {
      const statsRes = await voucherService.getVoucherStats();
      const s = statsRes.data;
      if (s) setStats(s);
    } catch {
      // stats not critical, silently skip
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm(emptyForm); setIsAddOpen(true); };

  const openEdit = (v: Voucher) => {
    setEditVoucher(v);
    setForm({
      code: v.code,
      discountType: v.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: String(v.discountType === 'fixed' ? (v.discountAmount ?? '') : (v.discountPercentage ?? '')),
      minSpend: String(v.minPurchaseAmount ?? ''),
      usageLimit: String(v.usageLimit ?? ''),
      perCustomerLimit: String(v.perCustomerLimit ?? 1),
      startDate: v.startDate ? v.startDate.slice(0, 10) : '',
      endDate: v.expiryDate ? v.expiryDate.slice(0, 10) : '',
      isActive: v.isActive,
    });
  };

  const handleSubmit = async () => {
    if (!form.code || !form.discountType || !form.discountValue || !form.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      if (editVoucher) {
        const payload: UpdateVoucherPayload = {
          startDate: form.startDate || undefined,
          expiryDate: form.endDate,
          minPurchaseAmount: form.minSpend ? Number(form.minSpend) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
          isActive: form.isActive,
        };
        if (form.discountType === 'fixed') payload.discountAmount = Number(form.discountValue);
        else payload.discountPercentage = Number(form.discountValue);

        await voucherService.updateVoucher(editVoucher._id, payload);
        toast.success('Voucher updated');
        setEditVoucher(null);
      } else {
        const payload: CreateVoucherPayload = {
          code: form.code,
          discountType: form.discountType,
          expiryDate: form.endDate,
          startDate: form.startDate || undefined,
          minPurchaseAmount: form.minSpend ? Number(form.minSpend) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : 1,
          isActive: form.isActive,
        };
        if (form.discountType === 'fixed') payload.discountAmount = Number(form.discountValue);
        else payload.discountPercentage = Number(form.discountValue);

        await voucherService.createVoucher(payload);
        toast.success('Voucher created');
        setIsAddOpen(false);
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await voucherService.deleteVoucher(deleteTarget._id);
      toast.success('Voucher deleted');
      setDeleteTarget(null);
      await fetchData();
    } catch {
      toast.error('Failed to delete voucher');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const getVoucherStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      Active: 'bg-green-100 text-green-800 hover:bg-green-100',
      Scheduled: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      Expired: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const VoucherFormContent = (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Voucher Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="e.g., ORGANIC20"
                className="uppercase"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editVoucher}
              />
              <Button variant="outline" size="icon" onClick={() => copyCode(form.code)} type="button">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Discount Type *</Label>
            <Select
              value={form.discountType}
              onValueChange={v => setForm(f => ({ ...f, discountType: v as 'percentage' | 'fixed' }))}
              disabled={!!editVoucher}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (VND)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value">Discount Value *</Label>
            <Input
              id="value"
              type="number"
              placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50000'}
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minSpend">Minimum Spend (VND)</Label>
            <Input
              id="minSpend"
              type="number"
              placeholder="0"
              value={form.minSpend}
              onChange={e => setForm(f => ({ ...f, minSpend: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usageLimit">Usage Limit (total)</Label>
            <Input
              id="usageLimit"
              type="number"
              placeholder="Unlimited"
              value={form.usageLimit}
              onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perCustomer">Per Customer Limit</Label>
            <Input
              id="perCustomer"
              type="number"
              placeholder="1"
              value={form.perCustomerLimit}
              onChange={e => setForm(f => ({ ...f, perCustomerLimit: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={form.isActive}
            onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
          />
          <Label htmlFor="active">Active</Label>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditVoucher(null); }} disabled={submitting}>Cancel</Button>
        <Button
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : editVoucher ? 'Update Voucher' : 'Create Voucher'}
        </Button>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Discount Vouchers</h2>
          <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Discount Voucher</DialogTitle>
              <DialogDescription>Set up a discount code for customers</DialogDescription>
            </DialogHeader>
            {VoucherFormContent}
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editVoucher} onOpenChange={v => { if (!v) setEditVoucher(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Discount Voucher</DialogTitle>
            <DialogDescription>Set up a discount code for customers</DialogDescription>
          </DialogHeader>
          {VoucherFormContent}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Voucher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vouchers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVouchers}</p>
              </div>
              <Percent className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeVouchers}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduledVouchers}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-400 mt-1">{stats.expiredVouchers}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">All Vouchers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min. Spend</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No vouchers found</TableCell>
                  </TableRow>
                ) : vouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  const usagePercent = voucher.usageLimit ? Math.min((voucher.usageCount / voucher.usageLimit) * 100, 100) : 0;
                  return (
                    <TableRow key={voucher._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-semibold text-gray-900">
                            {voucher.code}
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyCode(voucher.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {voucher.discountType === 'percentage' ? 'Percentage' : 'Fixed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {voucher.discountType === 'percentage'
                          ? `${voucher.discountPercentage}%`
                          : `${(voucher.discountAmount ?? 0).toLocaleString('vi-VN')}₫`}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {voucher.minPurchaseAmount ? `${(voucher.minPurchaseAmount).toLocaleString('vi-VN')}₫` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {voucher.usageCount} / {voucher.usageLimit ?? '∞'}
                          </p>
                          {voucher.usageLimit && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(voucher.startDate)} → {formatDate(voucher.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getVoucherStatusBadge(status)}>{status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100" onClick={() => openEdit(voucher)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(voucher)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
