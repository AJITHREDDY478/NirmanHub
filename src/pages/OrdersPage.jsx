import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../utils/adminAccess';
import { getUserOrders, getAllOrders, updateOrderStatus } from '../utils/orderService';
import { getCustomOrders } from '../utils/customOrderService';

const STATUS_FLOW = ['pending', 'accepted', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-700 border-blue-300' },
  processing: { label: 'Processing', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700 border-green-300' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 border-red-300' }
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.pending;
  return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${s.color}`}>{s.label}</span>;
}

function OrderCard({ order, isAdmin, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(order.admin_notes || '');
  const [estDelivery, setEstDelivery] = useState(order.estimated_delivery || '');
  const addr = order.delivery_address || {};
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    await onStatusChange(order.id, nextStatus, notes || null, estDelivery || null);
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    await onStatusChange(order.id, 'cancelled', notes || null, null);
    setUpdating(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-slate-800">{order.invoice_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {isAdmin && <p className="text-xs text-slate-400 mt-0.5">Customer: {addr.name} · {addr.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#0A78D1]">₹{Number(order.total_sale).toLocaleString()}</p>
          <p className="text-xs text-slate-500">{order.total_quantity} item{order.total_quantity !== 1 ? 's' : ''} · {order.payment_method?.toUpperCase()}</p>
        </div>
      </div>

      <button onClick={() => setExpanded(v => !v)} className="w-full px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors text-left flex justify-between">
        <span>{expanded ? 'Hide Details ▲' : 'View Details ▼'}</span>
        {order.estimated_delivery && <span className="text-green-600">Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</span>}
      </button>

      {expanded && (
        <div className="p-5 border-t border-slate-100 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Items</h4>
            <div className="space-y-2">
              {(order.order_items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.product_name}</p>
                    {item.department && <p className="text-xs text-slate-500">{item.department}{item.subcategory ? ` › ${item.subcategory}` : ''}</p>}
                    {item.customization && Object.keys(item.customization).length > 0 && (
                      <p className="text-xs text-purple-600 mt-0.5">{Object.entries(item.customization).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-800 text-sm">₹{Number(item.total_price || item.unit_price * item.quantity).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">₹{item.unit_price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Delivery Address</h4>
            <p className="text-sm text-slate-600">
              {addr.name}, {addr.phone}<br />
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
          </div>

          {isAdmin && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="pt-2 space-y-3 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700">Admin Actions</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Admin Note</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Printing started" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Estimated Delivery</label>
                  <input type="date" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="flex gap-3">
                {nextStatus && (
                  <button onClick={handleAdvance} disabled={updating} className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-md transition-all disabled:opacity-50">
                    {updating ? 'Updating...' : `Mark as ${STATUS_LABELS[nextStatus]?.label}`}
                  </button>
                )}
                <button onClick={handleCancel} disabled={updating} className="py-2 px-4 bg-red-100 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50">
                  Cancel Order
                </button>
              </div>
            </div>
          )}
          {order.admin_notes && <p className="text-xs text-slate-500 italic">Note: {order.admin_notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && isAdminEmail(user.email);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'custom'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customOrders, setCustomOrders] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    if (isAdmin) loadCustomOrdersData();
  }, [user]);

  const loadCustomOrdersData = async () => {
    setLoadingCustom(true);
    const { data } = await getCustomOrders();
    setCustomOrders(data || []);
    setLoadingCustom(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = isAdmin ? await getAllOrders() : await getUserOrders(user.id);
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const handleStatusChange = async (orderId, status, notes, estDelivery) => {
    const { error } = await updateOrderStatus(orderId, status, notes, estDelivery);
    if (error) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, admin_notes: notes ?? o.admin_notes, estimated_delivery: estDelivery ?? o.estimated_delivery } : o));
  };

  if (!user) {
    return (
      <div className="page-view active">
        <div className="max-w-2xl mx-auto px-6 py-32 text-center">
          <div className="text-7xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to view your orders.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-xl">Go Home</button>
        </div>
      </div>
    );
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !searchQuery || o.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) || o.delivery_address?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="page-view active">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 mb-1">{isAdmin ? 'Manage Orders' : 'My Orders'}</h1>
            <p className="text-slate-500 text-sm">{isAdmin ? 'Accept, process and deliver customer orders' : 'Track and view your order history'}</p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => navigate('/custom-order')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200/60 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Custom Order
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('orders')} className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-[#0A78D1] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'}`}>
              Orders ({orders.length})
            </button>
            <button onClick={() => setActiveTab('custom')} className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'custom' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400'}`}>
              Customized Orders ({customOrders.length})
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {['pending', 'accepted', 'processing', 'delivered'].map(s => (
              <div key={s} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === s).length}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="text" placeholder="Search by invoice or customer name…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex flex-wrap gap-2">
              {['all', ...STATUS_FLOW, 'cancelled'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${statusFilter === s ? 'bg-[#0A78D1] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {isAdmin && activeTab === 'custom' ? (
          loadingCustom ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading customized orders…</p>
            </div>
          ) : customOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-5">📋</div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">No Customized Orders Yet</h2>
            </div>
          ) : (
            <div className="space-y-4">
              {customOrders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <p className="font-bold text-slate-900">{order.id}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <p><span className="font-semibold text-slate-700">Name:</span> {order.formData?.name || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Email:</span> {order.formData?.email || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Phone:</span> {order.formData?.phone || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Category:</span> {order.formData?.category || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Quantity:</span> {order.formData?.quantity || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Budget:</span> {order.formData?.budget || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Deadline:</span> {order.formData?.deadline || '—'}</p>
                    <p><span className="font-semibold text-slate-700">Ref Images:</span> {order.files?.length || 0}</p>
                  </div>
                  {order.sourceProduct?.name && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">Source Product: {order.sourceProduct.name}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Description</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{order.formData?.description || '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Additional Notes</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{order.formData?.notes || '—'}</p>
                    </div>
                    {order.files?.length > 0 && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-1">Reference Files</p>
                        <div className="flex flex-wrap gap-2">
                          {order.files.map((file, i) => (
                            <a key={i} href={file.url || '#'} target="_blank" rel="noreferrer"
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                file.url ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
                              }`}
                              onClick={e => { if (!file.url) e.preventDefault(); }}
                            >{file.name || `File ${i + 1}`}</a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-5">📦</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{orders.length === 0 ? 'No Orders Yet' : 'No orders match this filter'}</h2>
            {orders.length === 0 && !isAdmin && (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold rounded-xl">Start Shopping</button>
                <button onClick={() => navigate('/custom-order')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl">Custom Order</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} isAdmin={isAdmin} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}