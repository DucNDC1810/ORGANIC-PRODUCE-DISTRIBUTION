import { useState } from 'react';
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
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';

// Mock data
const mockVouchers = [
  { 
    id: '1', 
    code: 'ORGANIC20', 
    type: 'Percentage', 
    value: 20, 
    minSpend: 50, 
    usageLimit: 100, 
    used: 45, 
    startDate: '2025-01-15', 
    endDate: '2025-02-15', 
    status: 'Active' 
  },
  { 
    id: '2', 
    code: 'FRESH10', 
    type: 'Fixed', 
    value: 10, 
    minSpend: 30, 
    usageLimit: 200, 
    used: 156, 
    startDate: '2025-01-01', 
    endDate: '2025-02-28', 
    status: 'Active' 
  },
  { 
    id: '3', 
    code: 'NEWYEAR25', 
    type: 'Percentage', 
    value: 25, 
    minSpend: 100, 
    usageLimit: 50, 
    used: 50, 
    startDate: '2025-01-01', 
    endDate: '2025-01-07', 
    status: 'Expired' 
  },
];

export default function ManagerVouchers() {
  const [isAddVoucherOpen, setIsAddVoucherOpen] = useState(false);

  const getVoucherStatusBadge = (status: string) => {
    const statusConfig: any = {
      'Active': { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Scheduled': { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      'Expired': { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    };
    return statusConfig[status] || { className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Discount Vouchers</h2>
          <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
        </div>
        <Dialog open={isAddVoucherOpen} onOpenChange={setIsAddVoucherOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Discount Voucher</DialogTitle>
              <DialogDescription>Set up a new discount code for customers</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Voucher Code *</Label>
                  <div className="flex gap-2">
                    <Input id="code" placeholder="e.g., ORGANIC20" className="uppercase" />
                    <Button variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Discount Value *</Label>
                  <Input id="value" type="number" placeholder="e.g., 20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSpend">Minimum Spend ($)</Label>
                  <Input id="minSpend" type="number" placeholder="0.00" step="0.01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input id="usageLimit" type="number" placeholder="Unlimited" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perCustomer">Per Customer Limit</Label>
                  <Input id="perCustomer" type="number" placeholder="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Activate immediately</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddVoucherOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                Create Voucher
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Voucher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vouchers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
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
                <p className="text-2xl font-bold text-green-600 mt-1">12</p>
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
                <p className="text-2xl font-bold text-blue-600 mt-1">5</p>
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
                <p className="text-2xl font-bold text-gray-400 mt-1">7</p>
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
              {mockVouchers.map((voucher) => (
                <TableRow key={voucher.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-semibold text-gray-900">
                        {voucher.code}
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {voucher.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {voucher.type === 'Percentage' ? `${voucher.value}%` : `$${voucher.value}`}
                  </TableCell>
                  <TableCell className="text-gray-700">${voucher.minSpend}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{voucher.used} / {voucher.usageLimit}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full" 
                          style={{ width: `${(voucher.used / voucher.usageLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {voucher.startDate} to {voucher.endDate}
                  </TableCell>
                  <TableCell>
                    <Badge {...getVoucherStatusBadge(voucher.status)}>
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
