import { Link } from 'react-router-dom';
import { CheckCircle, Package, Home, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: 'spring', 
              stiffness: 200, 
              damping: 15 
            }}
            className="inline-flex mb-6"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Order Confirmed!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </motion.div>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm mb-8 text-left"
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-lg font-semibold text-foreground">FMK-123456789</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="text-lg font-semibold text-foreground">October 10, 2023</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Estimated Delivery
                  </h3>
                  <p className="text-muted-foreground">
                    Your order will arrive by <span className="font-medium text-primary">October 12, 2023</span>
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  A confirmation email has been sent to your email address with order details and tracking information.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Continue Shopping
              <Home className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white border-2 border-border text-foreground rounded-xl font-semibold hover:border-primary hover:text-primary hover:shadow-md transition-all">
              View Order Details
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}