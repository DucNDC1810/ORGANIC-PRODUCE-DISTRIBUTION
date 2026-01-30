import { 
  Tag,
  Percent,
  TrendingUp,
  Plus,
  Edit,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

export default function ManagerPromotions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Promotions & Campaigns</h2>
          <p className="text-muted-foreground mt-1">Manage special offers and marketing campaigns</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Promotion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Discount Used</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">$4,280</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Redemption Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">67%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-2">Active</Badge>
                <CardTitle className="text-xl">Spring Fresh Sale</CardTitle>
                <CardDescription className="mt-2">20% off on all fresh vegetables</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-gray-900">20% OFF</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">Jan 15 - Feb 15</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Used:</span>
                <span className="font-semibold text-gray-900">124 times</span>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 mb-2">Scheduled</Badge>
                <CardTitle className="text-xl">Valentine's Special</CardTitle>
                <CardDescription className="mt-2">Buy 2 Get 1 Free on berries</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Offer:</span>
                <span className="font-semibold text-gray-900">BOGO</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">Feb 10 - Feb 14</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Starts in:</span>
                <span className="font-semibold text-blue-600">11 days</span>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
