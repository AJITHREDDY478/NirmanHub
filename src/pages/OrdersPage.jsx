export default function OrdersPage() {
  const sampleOrders = [
    {
      id: 'ORD-2024-001',
      date: '2024-01-15',
      status: 'Delivered',
      total: 2499,
      items: 3,
      color: 'green'
    },
    {
      id: 'ORD-2024-002',
      date: '2024-01-20',
      status: 'In Transit',
      total: 1899,
      items: 2,
      color: 'blue'
    },
    {
      id: 'ORD-2024-003',
      date: '2024-01-22',
      status: 'Processing',
      total: 3499,
      items: 1,
      color: 'amber'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="page-view active">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold text-slate-800 mb-2">My Orders</h1>
          <p className="text-slate-600">Track and manage your orders</p>
        </div>

        <div className="space-y-6">
          {sampleOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-800">{order.id}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Ordered on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600">₹{order.total.toLocaleString()}</p>
                  <p className="text-sm text-slate-600">{order.items} {order.items === 1 ? 'item' : 'items'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                  View Details
                </button>
                {order.status === 'Delivered' && (
                  <button className="flex-1 py-2 px-4 bg-amber-100 text-amber-700 font-semibold rounded-lg hover:bg-amber-200 transition-colors">
                    Reorder
                  </button>
                )}
                {order.status === 'In Transit' && (
                  <button className="flex-1 py-2 px-4 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors">
                    Track Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {sampleOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">No Orders Yet</h2>
            <p className="text-slate-600 mb-8">Start shopping to see your orders here!</p>
            <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105">
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
