import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { departments as seedDepartments } from '../data/products';
import { getDepartmentHierarchy } from '../utils/catalogService';
import { isAdminEmail } from '../utils/adminAccess';

const parseFileJson = (text) => {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of products');
  }
  return data;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveImageSrc = (rawSrc) => {
  const src = String(rawSrc || '').trim();
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (src.startsWith(normalizedBase)) {
    return src;
  }

  if (src.startsWith('/')) {
    const withoutLeadingSlash = src.replace(/^\/+/, '');
    return `${normalizedBase}${withoutLeadingSlash}`;
  }

  return `${normalizedBase}${src.replace(/^\/+/, '')}`;
};

export default function ScrapedProductsReviewPage({ showToast }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [customFieldMode, setCustomFieldMode] = useState({});
  const [catalogDepartments, setCatalogDepartments] = useState([]);

  useEffect(() => {
    const loadCatalogDepartments = async () => {
      if (!user?.id) {
        setCatalogDepartments([]);
        return;
      }

      const { data, error } = await getDepartmentHierarchy(user.id);
      if (error) {
        setCatalogDepartments([]);
        return;
      }

      setCatalogDepartments(Array.isArray(data) ? data : []);
    };

    loadCatalogDepartments();
  }, [user?.id]);

  const departmentOptions = useMemo(() => {
    const options = new Set();

    products
      .map((item) => String(item.item_details_data?.department || '').trim())
      .filter(Boolean)
      .forEach((value) => options.add(value));

    catalogDepartments
      .map((department) => String(department.name || '').trim())
      .filter(Boolean)
      .forEach((value) => options.add(value));

    seedDepartments
      .map((department) => String(department.name || '').trim())
      .filter(Boolean)
      .forEach((value) => options.add(value));

    return [...options].sort((a, b) => a.localeCompare(b));
  }, [catalogDepartments, products]);

  const subcategoryOptionsByDepartment = useMemo(() => {
    const optionsMap = new Map();
    const ensureBucket = (key) => {
      if (!optionsMap.has(key)) {
        optionsMap.set(key, new Set());
      }
      return optionsMap.get(key);
    };

    ensureBucket('__all__');

    catalogDepartments.forEach((department) => {
      const departmentName = String(department.name || '').trim();
      if (!departmentName) return;

      const bucket = ensureBucket(departmentName);
      const subdepartments = Array.isArray(department.subdepartments) ? department.subdepartments : [];

      subdepartments.forEach((subdepartment) => {
        const subdepartmentName = String(subdepartment.name || '').trim();
        if (!subdepartmentName) return;
        bucket.add(subdepartmentName);
        ensureBucket('__all__').add(subdepartmentName);
      });
    });

    seedDepartments.forEach((department) => {
      const departmentName = String(department.name || '').trim();
      if (!departmentName) return;

      const bucket = ensureBucket(departmentName);
      const subdepartments = Array.isArray(department.subcategories) ? department.subcategories : [];

      subdepartments.forEach((subcategory) => {
        const subcategoryName = String(subcategory || '').trim();
        if (!subcategoryName) return;
        bucket.add(subcategoryName);
        ensureBucket('__all__').add(subcategoryName);
      });
    });

    products.forEach((item) => {
      const department = String(item.item_details_data?.department || '').trim() || '__all__';
      const subcategory = String(item.item_details_data?.subcategory || '').trim();

      if (!subcategory) return;

      ensureBucket(department).add(subcategory);
      ensureBucket('__all__').add(subcategory);
    });

    return new Map(
      [...optionsMap.entries()].map(([key, value]) => [key, [...value].sort((a, b) => a.localeCompare(b))])
    );
  }, [catalogDepartments, products]);

  const filteredProducts = useMemo(() => {
    const withIndex = products.map((item, index) => ({ item, index }));
    if (!query.trim()) return withIndex;
    const q = query.toLowerCase();
    return withIndex.filter(({ item }) => {
      const name = String(item.name || '').toLowerCase();
      const category = String(item.item_details_data?.category || '').toLowerCase();
      const subcategory = String(item.item_details_data?.subcategory || '').toLowerCase();
      return name.includes(q) || category.includes(q) || subcategory.includes(q);
    });
  }, [products, query]);

  const stats = useMemo(() => {
    const missingName = products.filter((p) => !String(p.name || '').trim()).length;
    const zeroPrice = products.filter((p) => toNumber(p.original_price, 0) <= 0).length;
    const withMultiImages = products.filter((p) => Array.isArray(p.image_urls) && p.image_urls.length > 1).length;
    return {
      total: products.length,
      missingName,
      zeroPrice,
      withMultiImages
    };
  }, [products]);

  const handleLoadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseFileJson(text);
      setProducts(data);
      setFileName(file.name);
      showToast(`Loaded ${data.length} products for review`);
    } catch (error) {
      showToast(`Invalid JSON file: ${error.message}`);
    }
  };

  const loadDefaultReviewJson = async () => {
    try {
      setIsLoadingDefault(true);
      const baseUrl = import.meta.env.BASE_URL || '/';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const defaultUrl = `${normalizedBase}data/review-products.nirmanhub.json?t=${Date.now()}`;
      const response = await fetch(defaultUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to load default review JSON (${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Default review JSON is not an array');
      }

      setProducts(data);
      setFileName('review-products.nirmanhub.json (default)');
      showToast(`Loaded ${data.length} products from default review file`);
    } catch (error) {
      showToast(error.message || 'Failed to load default review JSON');
    } finally {
      setIsLoadingDefault(false);
    }
  };

  const updateField = (index, key, value) => {
    setProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const updateDetailsField = (index, key, value) => {
    setProducts((prev) => {
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        item_details_data: {
          ...(current.item_details_data || {}),
          [key]: value
        }
      };
      return next;
    });
  };

  const toggleCustomFieldMode = (index, key, enabled) => {
    setCustomFieldMode((prev) => ({
      ...prev,
      [`${index}:${key}`]: enabled
    }));
  };

  const handleSelectDetailsField = (index, key, value) => {
    if (value === '__add_new__') {
      toggleCustomFieldMode(index, key, true);
      return;
    }

    updateDetailsField(index, key, value);
    toggleCustomFieldMode(index, key, false);
  };

  const updateImageUrlsText = (index, text) => {
    const urls = text
      .split(/\r?\n|,/) 
      .map((value) => value.trim())
      .filter(Boolean);

    setProducts((prev) => {
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        image_url: urls[0] || null,
        image_urls: urls,
        item_details_data: {
          ...(current.item_details_data || {}),
          additionalImages: urls.slice(1)
        }
      };
      return next;
    });
  };

  const downloadReviewedJson = () => {
    if (products.length === 0) {
      showToast('Load products first');
      return;
    }

    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'review-products.nirmanhub.updated.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Downloaded updated review JSON');
  };

  const downloadExcelForImport = () => {
    if (products.length === 0) {
      showToast('Load products first');
      return;
    }

    const rows = products.map((item, index) => {
      const imageUrls = Array.isArray(item.image_urls) && item.image_urls.length > 0
        ? item.image_urls
        : (item.image_url ? [item.image_url] : []);

      return {
        name: item.name || '',
        lookup_code: item.lookup_code || `SCRAPE-${String(item.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 24)}-${index + 1}`,
        description: item.description || '',
        type: item.type || 'Item',
        original_price: toNumber(item.original_price, 0),
        discount_price: toNumber(item.discount_price, 0),
        stock_quantity: toNumber(item.stock_quantity, 0),
        printing_time: toNumber(item.printing_time, 24),
        is_active: item.is_active !== false,
        department: item.item_details_data?.department || '',
        subdepartment: item.item_details_data?.subcategory || '',
        image_url: imageUrls[0] || '',
        additional_images: imageUrls.slice(1).join(', ')
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'review-products-import-template.xlsx');
    showToast('Downloaded Excel in import template format');
  };

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Denied</h1>
        <p className="text-slate-600">Only authorized admin accounts can access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Scraped Products Review</h1>
        <p className="text-slate-600 mt-2">Load your scraped JSON, edit products visually, then export before approval/upload.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="file" accept="application/json" className="hidden" onChange={handleLoadFile} />
            <span className="text-sm font-semibold text-slate-700">Choose review JSON</span>
            <span className="text-xs text-slate-500 truncate w-full">{fileName || 'No file selected'}</span>
          </label>

          <button
            onClick={loadDefaultReviewJson}
            disabled={isLoadingDefault}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-60"
          >
            {isLoadingDefault ? 'Loading…' : 'Load Default Review JSON'}
          </button>

          <button
            onClick={downloadReviewedJson}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#0F2740] to-[#0A78D1] text-white font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-cyan-400/30"
          >
            Download Updated JSON
          </button>

          <button
            onClick={downloadExcelForImport}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Download Excel (Import)
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">Total: <span className="font-bold">{stats.total}</span></div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">Missing name: <span className="font-bold">{stats.missingName}</span></div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">Price ≤ 0: <span className="font-bold">{stats.zeroPrice}</span></div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">Multi-image products: <span className="font-bold">{stats.withMultiImages}</span></div>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name/category/subcategory"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {filteredProducts.map(({ item, index }, filteredIndex) => {
          const imageUrls = Array.isArray(item.image_urls) && item.image_urls.length > 0
            ? item.image_urls
            : (item.image_url ? [item.image_url] : []);
          const departmentValue = item.item_details_data?.department || '';
          const subcategoryValue = item.item_details_data?.subcategory || '';
          const departmentCustomKey = `${index}:department`;
          const subcategoryCustomKey = `${index}:subcategory`;
          const departmentSelectValue = customFieldMode[departmentCustomKey]
            ? '__add_new__'
            : (departmentValue && departmentOptions.includes(departmentValue) ? departmentValue : '');
          const availableSubcategories = subcategoryOptionsByDepartment.get(departmentValue)
            || subcategoryOptionsByDepartment.get('__all__')
            || [];
          const subcategorySelectValue = customFieldMode[subcategoryCustomKey]
            ? '__add_new__'
            : (subcategoryValue && availableSubcategories.includes(subcategoryValue) ? subcategoryValue : '');

          return (
            <div key={`${item.name || 'item'}-${filteredIndex}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
              <div className="grid md:grid-cols-12 gap-3">
                <div className="md:col-span-2">
                  <img
                    src={resolveImageSrc(imageUrls[0] || '')}
                    alt={item.name || 'Product'}
                    className="w-full h-28 object-cover rounded-lg border border-slate-200"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  {imageUrls.length > 1 && (
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {imageUrls.slice(1, 5).map((url, imageIndex) => (
                        <img
                          key={`${url}-${imageIndex}`}
                          src={resolveImageSrc(url)}
                          alt="Variant"
                          className="w-full h-8 object-cover rounded border border-slate-200"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-10 grid md:grid-cols-2 gap-3">
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.name || ''} onChange={(e) => updateField(index, 'name', e.target.value)} placeholder="Name" />
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.image_url || ''} onChange={(e) => updateField(index, 'image_url', e.target.value)} placeholder="Image URL" />
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.original_price ?? 0} onChange={(e) => updateField(index, 'original_price', toNumber(e.target.value, 0))} placeholder="Original Price" type="number" />
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.discount_price ?? 0} onChange={(e) => updateField(index, 'discount_price', toNumber(e.target.value, 0))} placeholder="Discount Price" type="number" />
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.stock_quantity ?? 0} onChange={(e) => updateField(index, 'stock_quantity', toNumber(e.target.value, 0))} placeholder="Stock" type="number" />
                  <input className="px-3 py-2 rounded-lg border border-slate-300" value={item.printing_time ?? 24} onChange={(e) => updateField(index, 'printing_time', toNumber(e.target.value, 24))} placeholder="Printing Time" type="number" />
                  <div className="space-y-2">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      value={departmentSelectValue}
                      onChange={(e) => handleSelectDetailsField(index, 'department', e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value="__add_new__">Add New Department</option>
                    </select>
                    {customFieldMode[departmentCustomKey] && (
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        value={departmentValue}
                        onChange={(e) => updateDetailsField(index, 'department', e.target.value)}
                        placeholder="New Department"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      value={subcategorySelectValue}
                      onChange={(e) => handleSelectDetailsField(index, 'subcategory', e.target.value)}
                    >
                      <option value="">Select Subdepartment</option>
                      {availableSubcategories.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                      <option value="__add_new__">Add New Subdepartment</option>
                    </select>
                    {customFieldMode[subcategoryCustomKey] && (
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        value={subcategoryValue}
                        onChange={(e) => updateDetailsField(index, 'subcategory', e.target.value)}
                        placeholder="New Subdepartment"
                      />
                    )}
                  </div>
                  <textarea
                    className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300"
                    rows={3}
                    value={(Array.isArray(item.image_urls) ? item.image_urls : (item.image_url ? [item.image_url] : [])).join('\n')}
                    onChange={(e) => updateImageUrlsText(index, e.target.value)}
                    placeholder="Image URLs (one per line)"
                  />
                  <textarea className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300" rows={2} value={item.description || ''} onChange={(e) => updateField(index, 'description', e.target.value)} placeholder="Description" />
                </div>
              </div>
            </div>
          );
        })}

        {products.length > 0 && filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-600">No products match your search.</div>
        )}
      </div>
    </div>
  );
}
