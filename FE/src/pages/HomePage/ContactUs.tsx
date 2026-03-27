import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '../../components/Header';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function ContactUs() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    toast.success('Your message has been sent successfully.');
    setForm({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-white">
      <Header />

      <section className="bg-gradient-to-r from-emerald-600 to-green-500 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact With Us</h1>
          <p className="text-emerald-100 max-w-2xl mx-auto">
            We are here to support you. Reach out for orders, partnerships, and any questions.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Get In Touch</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p>Ho Chi Minh City, Vietnam</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>1900 1234</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p>support@freshmarket.vn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Working Hours</p>
                    <p>08:00 - 21:00 (Mon - Sun)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="text-sm text-emerald-800">
                Need quick help? Browse our products or start an order now.
              </p>
              <Link
                to="/products"
                className="inline-block mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Go to Products →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-emerald-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Send Us A Message</h2>
            <p className="text-sm text-gray-500 mb-6">
              Required fields are marked with *
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => onChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => onChange('subject', e.target.value)}
                    placeholder="What is this about?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => onChange('message', e.target.value)}
                  placeholder="Tell us your request..."
                  rows={6}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
