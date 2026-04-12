import { useState } from 'react';
import { getWhatsAppUrl, CONFIG } from '../utils/config';
import { placeOrder } from '../utils/orderService';

export default function CheckoutModals({ step, onClose, onStepChange, cartItems, userId, onComplete, showToast }) {
  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home'
  });
  const [placingOrder, setPlacingOrder] = useState(false);

  const getUnitPrice = (item) => item.product?.discount_price || item.product?.original_price || item.product?.price || 0;
  const total = cartItems.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const formatAddress = () => {
    const addressLines = [
      addressData.line1,
      addressData.line2,
      `${addressData.city}, ${addressData.state} - ${addressData.pincode}`
    ].filter(Boolean);

    return addressLines.join(', ');
  };

  const formatCustomization = (customization) => {
    if (!customization || typeof customization !== 'object' || Array.isArray(customization)) {
      return null;
    }

    const entries = Object.entries(customization).filter(([, value]) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    });

    if (entries.length === 0) return null;

    return entries
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]+/g, ' ')
          .replace(/^./, (char) => char.toUpperCase());

        const normalizedValue = Array.isArray(value)
          ? value.join(', ')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : value;

        return `${label}: ${normalizedValue}`;
      })
      .join(', ');
  };

  const buildWhatsAppMessage = (order) => {
    const itemLines = cartItems.flatMap((item, index) => {
      const quantity = item.quantity || 1;
      const unitPrice = getUnitPrice(item);
      const customization = formatCustomization(item.customization);
      const lines = [
        `${index + 1}. ${item.product?.name || 'Unknown Product'}`,
        `   Qty: ${quantity}`,
        `   Price: ${formatCurrency(unitPrice)} x ${quantity} = ${formatCurrency(unitPrice * quantity)}`
      ];

      if (customization) {
        lines.push(`   Customization: ${customization}`);
      }

      return lines;
    });

    const lines = [
      `Hi ${CONFIG.businessName}, I want to place this order:`,
      '',
      order?.invoice_number ? `Order ID: ${order.invoice_number}` : '',
      'Customer Details:',
      `Name: ${addressData.name}`,
      `Phone: ${addressData.phone}`,
      `Address: ${formatAddress()}`,
      '',
      'Order Items:',
      ...itemLines,
      '',
      `Total: ${formatCurrency(total)}`,
      'Payment: Order confirmation on WhatsApp',
      '',
      'Please confirm this order.'
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!addressData.name || !addressData.phone || !addressData.line1 || !addressData.city || !addressData.state || !addressData.pincode) {
      showToast('Please fill in all required fields');
      return;
    }

    if (typeof onStepChange === 'function') {
      onStepChange('payment');
      return;
    }

    showToast('Unable to continue to payment. Please try again.');
  };

  const handlePaymentComplete = async () => {
    setPlacingOrder(true);
    let order = null;

    if (userId) {
      const result = await placeOrder(userId, {
        addressData,
        paymentMethod: 'whatsapp',
        cartItems
      });

      if (result.error) {
        console.error('Order placement error:', result.error);
        showToast('Could not save the order, but opening WhatsApp with the order details.');
      } else {
        order = result.data;
      }
    }

    const whatsappUrl = getWhatsAppUrl(buildWhatsAppMessage(order));

    if (typeof onComplete === 'function') {
      await onComplete(order);
    }

    setPlacingOrder(false);
    window.location.assign(whatsappUrl);
  };

  if (!step) return null;

  return (
    <>
      {step === 'address' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
          <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-slate-800">Delivery Address</h2>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={addressData.name}
                        onChange={(e) => setAddressData({ ...addressData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={addressData.phone}
                        onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 1 *</label>
                    <input
                      type="text"
                      value={addressData.line1}
                      onChange={(e) => setAddressData({ ...addressData, line1: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="House No., Building Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={addressData.line2}
                      onChange={(e) => setAddressData({ ...addressData, line2: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Street, Area, Locality"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Mumbai"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                      <input
                        type="text"
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Maharashtra"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={addressData.pincode}
                        onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="400001"
                        pattern="[0-9]{6}"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-xl hover:shadow-lg transition-all mt-6"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div id="payment-modal" className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
          <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-slate-800">Review Order</h2>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium text-slate-800">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Shipping</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-slate-800">Total</span>
                      <span className="font-bold text-xl text-blue-700">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Delivery Details</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-800">Name:</span> {addressData.name}</p>
                    <p><span className="font-medium text-slate-800">Phone:</span> {addressData.phone}</p>
                    <p><span className="font-medium text-slate-800">Address:</span> {formatAddress()}</p>
                    <p><span className="font-medium text-slate-800">Order Confirmation:</span> WhatsApp to +91 {CONFIG.whatsappNumber}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 mt-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Items</h3>
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const customization = formatCustomization(item.customization);
                      const unitPrice = getUnitPrice(item);

                      return (
                        <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                          <div>
                            <p className="font-medium text-slate-800">{item.product?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                            {customization ? <p className="text-sm text-slate-500">{customization}</p> : null}
                          </div>
                          <p className="font-semibold text-slate-800">{formatCurrency(unitPrice * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handlePaymentComplete}
                  disabled={placingOrder}
                  className="w-full py-4 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-xl hover:shadow-lg transition-all mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {placingOrder ? 'Preparing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
