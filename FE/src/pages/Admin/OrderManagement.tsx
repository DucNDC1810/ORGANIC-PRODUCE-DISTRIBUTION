import { Clock, Truck, CheckCircle2, XCircle, Eye, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Mock data
const mockOrders = [
  { id: '#ORD-001', customer: 'Nguyễn Văn A', date: '2025-01-26', total: 45.90, status: 'Đang giao', items: 3, payment: 'Đã thanh toán' },
  { id: '#ORD-002', customer: 'Trần Thị B', date: '2025-01-26', total: 32.50, status: 'Đang xử lý', items: 2, payment: 'Đã thanh toán' },
  { id: '#ORD-003', customer: 'Lê Văn C', date: '2025-01-25', total: 78.30, status: 'Hoàn thành', items: 5, payment: 'Đã thanh toán' },
  { id: '#ORD-004', customer: 'Phạm Thị D', date: '2025-01-25', total: 55.20, status: 'Đang giao', items: 4, payment: 'Đã thanh toán' },
  { id: '#ORD-005', customer: 'Hoàng Văn E', date: '2025-01-24', total: 29.90, status: 'Đã hủy', items: 2, payment: 'Đã hoàn tiền' },
];

const getStatusBadge = (status: string) => {
  const statusConfig: any = {
    'Đang giao': { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
    'Đang xử lý': { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    'Hoàn thành': { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
    'Đã hủy': { variant: 'destructive', className: '' },
  };
  return statusConfig[status] || { variant: 'default', className: '' };
};

export default function OrderManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Order Management</h2>
        <p className="text-muted-foreground">View and process customer orders</p>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipping</p>
                <p className="text-2xl font-bold text-foreground">18</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">342</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-foreground">9</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order List</CardTitle>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-semibold">${order.total}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadge(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details {order.id}</DialogTitle>
                            <DialogDescription>Detailed order information</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <p className="font-medium">{order.customer}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                <p className="font-medium">{order.date}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-medium">${order.total}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge {...getStatusBadge(order.status)} className="mt-1">
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder={order.status} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipping">Shipping</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline">Close</Button>
                            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                              Update
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
