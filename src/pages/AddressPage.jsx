import { useState } from 'react';

export default function AddressPage({ showToast }) {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: 'John Doe',
      phone: '+91 98765 43210',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setAddresses(addresses.map(addr => 
        addr.id === editingId ? { ...formData, id: editingId, isDefault: addr.isDefault } : addr
      ));
      if (showToast) showToast('Address updated successfully!');
    } else {
      setAddresses([...addresses, { ...formData, id: Date.now(), isDefault: false }]);
      if (showToast) showToast('Address added successfully!');
    }
    setFormData({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (addresses.length === 1) {
      if (showToast) showToast('You must have at least one address!');
      return;
    }
    setAddresses(addresses.filter(addr => addr.id !== id));
    if (showToast) showToast('Address deleted successfully!');
  };

  const handleSetDefault = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
    if (showToast) showToast('Default address updated!');
  };

  return (
    <div className="page-view active">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-4xl font-bold text-slate-800 mb-2">Saved Addresses</h1>
            <p className="text-slate-600">Manage your delivery addresses</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
            }}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add New Address
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-800 mb-6">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors resize-none"
                  placeholder="House no., Building name, Street"
                ></textarea>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="400001"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update Address' : 'Add Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
                  }}
                  className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        <div className="space-y-6">
          {addresses.map(address => (
            <div key={address.id} className="bg-white rounded-2xl shadow-lg p-6 relative">
              {address.isDefault && (
                <span className="absolute top-6 right-6 px-3 py-1 bg-gradient-to-r from-amber-500 to-teal-500 text-white text-xs font-bold rounded-full">
                  DEFAULT
                </span>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-800 mb-1">{address.name}</h3>
                <p className="text-slate-600">{address.phone}</p>
              </div>
              <div className="text-slate-600 mb-4">
                <p>{address.address}</p>
                <p>{address.city}, {address.state} - {address.pincode}</p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(address)}
                  className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="px-6 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="px-6 py-2 bg-amber-50 text-amber-600 font-semibold rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📍</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">No Addresses Saved</h2>
            <p className="text-slate-600 mb-8">Add a delivery address to get started!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Add Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
