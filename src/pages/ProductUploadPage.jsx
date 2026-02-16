import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { 
  createCatalogItem, 
  uploadImage, 
  getUserCatalogItems,
  createDepartment,
  createSubdepartment,
  getDepartmentHierarchy,
  findSubdepartmentId
} from '../utils/catalogService';
import * as XLSX from 'xlsx';

export default function ProductUploadPage({ showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Excel import states
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  
  // Department management states
  const [departments, setDepartments] = useState([]);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    subdepartments: ['']
  });
  
  const [formData, setFormData] = useState({
    name: '',
    lookup_code: '',
    description: '',
    type: 'Item',
    original_price: '',
    discount_price: '',
    stock_quantity: '',
    printing_time: '',
    is_active: true,
    department: '',
    subdepartment: ''
  });

  // Load existing products
  useEffect(() => {
    if (user?.id) {
      loadProducts();
      loadDepartments();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    const { data } = await getUserCatalogItems(user.id);
    setProducts(data);
  };

  const loadDepartments = async () => {
    const { data, error } = await getDepartmentHierarchy(user.id);
    if (!error && data) {
      setDepartments(data);
    }
  };

  const handleAddDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      showToast('Department name is required');
      return;
    }

    setLoading(true);

    try {
      // Create the department
      const deptLookupCode = `DEPT-${Date.now()}`;
      const { data: deptData, error: deptError } = await createDepartment(
        user.id,
        departmentFormData.name,
        deptLookupCode
      );

      if (deptError) {
        showToast('Failed to create department');
        setLoading(false);
        return;
      }

      // Create subdepartments
      const subdeps = departmentFormData.subdepartments.filter(s => s.trim() !== '');
      for (let i = 0; i < subdeps.length; i++) {
        const subLookupCode = `SUBDEPT-${Date.now()}-${i}`;
        await createSubdepartment(user.id, subdeps[i], subLookupCode, deptData.id);
      }

      // Reload departments
      await loadDepartments();
      setDepartmentFormData({ name: '', subdepartments: [''] });
      setShowDepartmentForm(false);
      showToast('Department added successfully!');
    } catch (error) {
      console.error('Error creating department:', error);
      showToast('Error creating department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      // Deleting department will cascade delete subdepartments and their products
      const { error } = await supabase
        .from('catalog_entities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        showToast('Failed to delete department');
        return;
      }

      await loadDepartments();
      showToast('Department deleted');
    } catch (error) {
      console.error('Error deleting department:', error);
      showToast('Error deleting department');
    }
  };

  const addSubdepartmentField = () => {
    setDepartmentFormData(prev => ({
      ...prev,
      subdepartments: [...prev.subdepartments, '']
    }));
  };

  const removeSubdepartmentField = (index) => {
    setDepartmentFormData(prev => ({
      ...prev,
      subdepartments: prev.subdepartments.filter((_, i) => i !== index)
    }));
  };

  const updateSubdepartmentField = (index, value) => {
    setDepartmentFormData(prev => ({
      ...prev,
      subdepartments: prev.subdepartments.map((s, i) => i === index ? value : s)
    }));
  };


  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 images
      const newFiles = files.slice(0, 5 - imageFiles.length);
      setImageFiles(prev => [...prev, ...newFiles].slice(0, 5));
      
      // Generate previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result].slice(0, 5));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast('Product name is required');
      return false;
    }
    if (!formData.lookup_code.trim()) {
      showToast('Lookup code is required');
      return false;
    }
    if (!formData.original_price || parseFloat(formData.original_price) < 0) {
      showToast('Valid original price is required');
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      lookup_code: '',
      description: '',
      type: 'Item',
      original_price: '',
      discount_price: '',
      stock_quantity: '',
      printing_time: '',
      is_active: true
    });
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) {
      showToast('Please log in to upload products');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let additionalImages = [];

      // Upload images if provided
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const { url, error } = await uploadImage(user.id, imageFiles[i]);
          if (error) {
            showToast(`Failed to upload image ${i + 1}`);
            continue;
          }
          if (i === 0) {
            imageUrl = url; // First image is the main image
          } else {
            additionalImages.push(url);
          }
        }
      }

      // Find subdepartment ID if department and subdepartment are selected
      let parentId = null;
      if (formData.department && formData.subdepartment) {
        const { data: subdeptId, error: findError } = await findSubdepartmentId(
          user.id,
          formData.department,
          formData.subdepartment
        );
        if (!findError && subdeptId) {
          parentId = subdeptId;
        }
      }

      // Create product
      const { data, error } = await createCatalogItem(user.id, {
        name: formData.name,
        lookup_code: formData.lookup_code,
        description: formData.description,
        type: formData.type,
        parent_id: parentId,
        original_price: formData.original_price,
        discount_price: formData.discount_price,
        stock_quantity: formData.stock_quantity,
        printing_time: formData.printing_time,
        is_active: formData.is_active,
        image_url: imageUrl,
        item_details_data: {
          department: formData.department,
          subcategory: formData.subdepartment,
          additionalImages: additionalImages
        }
      });

      if (error) {
        showToast('Failed to create product');
        console.error(error);
        setLoading(false);
        return;
      }

      showToast('Product uploaded successfully!');
      
      // Reset form
      setFormData({
        name: '',
        lookup_code: '',
        description: '',
        type: 'Item',
        original_price: '',
        discount_price: '',
        stock_quantity: '',
        printing_time: '',
        is_active: true,
        department: '',
        subdepartment: ''
      });
      setImageFiles([]);
      setImagePreviews([]);
      setShowForm(false);
      
      // Reload products
      await loadProducts();
    } catch (error) {
      showToast('Error uploading product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Excel Import Functions
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and format the data
        const validated = jsonData.map((row, index) => {
          const errors = [];
          const product = {
            name: row.name || row.Name || row.NAME || '',
            lookup_code: row.lookup_code || row['Lookup Code'] || row.code || '',
            description: row.description || row.Description || '',
            type: row.type || row.Type || 'Item',
            original_price: row.original_price || row['Original Price'] || row.price || '',
            discount_price: row.discount_price || row['Discount Price'] || '',
            stock_quantity: row.stock_quantity || row['Stock Quantity'] || row.stock || '',
            printing_time: row.printing_time || row['Printing Time'] || '',
            is_active: row.is_active !== false && row.is_active !== 'false',
            department: row.department || row.Department || '',
            subdepartment: row.subdepartment || row.Subdepartment || row['Sub Department'] || '',
            rowIndex: index + 2 // +2 because Excel is 1-indexed and has header row
          };

          // Validation
          if (!product.name.trim()) {
            errors.push('Product name is required');
          }
          if (!product.lookup_code.trim()) {
            errors.push('Lookup code is required');
          }
          if (!product.original_price || parseFloat(product.original_price) < 0) {
            errors.push('Valid original price is required');
          }

          return {
            ...product,
            isValid: errors.length === 0,
            errors,
            isEditing: errors.length > 0
          };
        });

        setExcelData(validated);
        setValidationResults(validated);
        setSelectedItems(new Set(validated.map((_, index) => index)));
        setShowExcelImport(true);
        showToast(`Loaded ${validated.length} products from Excel`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        showToast('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateExcelRow = (index, field, value) => {
    const updated = [...validationResults];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // If department changes, clear subdepartment
    if (field === 'department') {
      updated[index].subdepartment = '';
    }

    // Re-validate the row
    const errors = [];
    if (!updated[index].name.trim()) errors.push('Product name is required');
    if (!updated[index].lookup_code.trim()) errors.push('Lookup code is required');
    if (!updated[index].original_price || parseFloat(updated[index].original_price) < 0) {
      errors.push('Valid original price is required');
    }

    updated[index].errors = errors;
    updated[index].isValid = errors.length === 0;

    setValidationResults(updated);
  };

  const handleBulkImport = async () => {
    const validProducts = validationResults
      .map((p, index) => ({ ...p, originalIndex: index }))
      .filter(p => p.isValid && selectedItems.has(p.originalIndex));
    
    if (validProducts.length === 0) {
      showToast('No valid products to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validProducts.length, percentage: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];
      
      try {
        // Find subdepartment ID if department and subdepartment are provided
        let parentId = null;
        if (product.department && product.subdepartment) {
          const { data: subdeptId, error: findError } = await findSubdepartmentId(
            user.id,
            product.department,
            product.subdepartment
          );
          if (!findError && subdeptId) {
            parentId = subdeptId;
          }
        }

        const { error } = await createCatalogItem(user.id, {
          name: product.name,
          lookup_code: product.lookup_code,
          description: product.description,
          type: product.type,
          parent_id: parentId,
          original_price: parseFloat(product.original_price),
          discount_price: product.discount_price ? parseFloat(product.discount_price) : null,
          stock_quantity: product.stock_quantity ? parseInt(product.stock_quantity) : null,
          printing_time: product.printing_time ? parseFloat(product.printing_time) : null,
          is_active: product.is_active,
          image_url: null
        });

        if (!error) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        console.error('Import error:', error);
      }

      // Update progress
      const current = i + 1;
      const percentage = Math.round((current / validProducts.length) * 100);
      setImportProgress({ current, total: validProducts.length, percentage });
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsImporting(false);
    showToast(`Import complete! ${successCount} succeeded, ${failCount} failed`);
    
    // Reload products and close import modal
    await loadProducts();
    setShowExcelImport(false);
    setExcelData([]);
    setValidationResults([]);
    setSelectedItems(new Set());
    setImportProgress({ current: 0, total: 0, percentage: 0 });
  };

  const handleRemoveSelected = () => {
    const remaining = validationResults.filter((_, index) => !selectedItems.has(index));
    setValidationResults(remaining);
    setSelectedItems(new Set());
    showToast(`Removed ${selectedItems.size} items`);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(validationResults.map((_, index) => index)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleToggleItem = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  useEffect(() => {
    if (!isDownloadingTemplate) {
      return;
    }
    const timer = setTimeout(() => {
      setIsDownloadingTemplate(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isDownloadingTemplate]);

  const downloadExcelTemplate = () => {
    if (isDownloadingTemplate) {
      return;
    }
    setIsDownloadingTemplate(true);
    const template = [
      {
        name: 'Sample Product',
        lookup_code: 'PROD-001',
        description: 'Product description here',
        type: 'Item',
        original_price: 99.99,
        discount_price: 79.99,
        stock_quantity: 100,
        printing_time: 2.5,
        is_active: true,
        department: 'Electronics',
        subdepartment: 'Mobile Accessories'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product_upload_template.xlsx');
    showToast('Template downloaded!');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Product Upload</h1>
          <p className="text-lg text-slate-600">Please log in to upload products</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user.email !== 'ajithreddy478@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-lg text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Title - Above Everything */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Product Upload</h1>
          <p className="text-slate-600">Manage your product catalog</p>
        </div>

        {/* Action Buttons - Below Title */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 mb-8">
          {/* Download Excel Template */}
          <button
            onClick={downloadExcelTemplate}
            disabled={isDownloadingTemplate}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Download Excel template with correct format"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isDownloadingTemplate ? (
              <span>Downloading...</span>
            ) : (
              <span className="hidden sm:inline">Download </span>
            )}
            {!isDownloadingTemplate && <span>Template</span>}
          </button>
          
          {/* Excel Import Button */}
          <label className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>
          
          {/* Add Single Product Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          )}
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Product Organization</h3>
              <p className="text-sm text-blue-800 mb-2">
                <span className="font-semibold">Step 1:</span> Create departments and subdepartments below to organize your products hierarchically.
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Step 2:</span> When adding products (manually or via Excel), assign them to departments/subdepartments. 
                Required fields: <span className="font-semibold">name</span>, <span className="font-semibold">lookup_code</span>, and <span className="font-semibold">original_price</span>. 
                Products will be automatically linked to their parent subdepartment for easy management.
              </p>
            </div>
          </div>
        </div>

        {/* Department Management Section */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Department Management</h2>
          
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowDepartmentForm(!showDepartmentForm)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Add
            </button>
          </div>

          {/* Add Department Form */}
          {showDepartmentForm && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <h3 className="font-semibold text-slate-900 mb-4">New Department</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={departmentFormData.name}
                    onChange={(e) => setDepartmentFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Electronics, Fashion, Home Decor"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subdepartments
                  </label>
                  <div className="space-y-2">
                    {departmentFormData.subdepartments.map((subdep, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={subdep}
                          onChange={(e) => updateSubdepartmentField(index, e.target.value)}
                          placeholder="e.g., Mobile Accessories, Laptops"
                          className="flex-1 min-w-0 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        {departmentFormData.subdepartments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubdepartmentField(index)}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSubdepartmentField}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Subdepartment
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepartmentForm(false);
                      setDepartmentFormData({ name: '', subdepartments: [''] });
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Save Department
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Departments List */}
          <div className="space-y-3">
            {departments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No departments created yet. Add your first department above.</p>
              </div>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                        <span className="text-xl">📁</span>
                        {dept.name}
                      </h3>
                      {dept.subdepartments.length > 0 && (
                        <div className="ml-7 flex flex-wrap gap-2">
                          {dept.subdepartments.map((subdep) => (
                            <span
                              key={subdep.id}
                              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-sm rounded-full"
                            >
                              {subdep.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Department"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Excel Import Modal */}
        {showExcelImport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Excel Import Preview</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Review and edit products before importing
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowExcelImport(false);
                    setValidationResults([]);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Import Progress */}
              {isImporting && (
                <div className="p-6 bg-blue-50 border-b border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-blue-900">
                      Importing products... {importProgress.current} / {importProgress.total}
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {importProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Validation Summary */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === validationResults.length && validationResults.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Select All</span>
                  </div>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="px-3 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Selected ({selectedItems.size})
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Total:</span>
                    <span className="px-3 py-1 bg-slate-200 text-slate-900 rounded-full text-sm font-bold">
                      {validationResults.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-700">Valid:</span>
                    <span className="px-3 py-1 bg-green-100 text-green-900 rounded-full text-sm font-bold">
                      {validationResults.filter(p => p.isValid).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-700">Invalid:</span>
                    <span className="px-3 py-1 bg-red-100 text-red-900 rounded-full text-sm font-bold">
                      {validationResults.filter(p => !p.isValid).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  // Group products by department and subdepartment
                  const grouped = {};
                  validationResults.forEach((product, index) => {
                    const dept = product.department || 'Uncategorized';
                    const subdept = product.subdepartment || 'General';
                    if (!grouped[dept]) grouped[dept] = {};
                    if (!grouped[dept][subdept]) grouped[dept][subdept] = [];
                    grouped[dept][subdept].push({ ...product, originalIndex: index });
                  });

                  return Object.keys(grouped).map(department => (
                    <div key={department} className="mb-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📁</span>
                        {department}
                      </h3>
                      {Object.keys(grouped[department]).map(subdepartment => (
                        <div key={subdepartment} className="ml-6 mb-6">
                          <h4 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="text-lg">📂</span>
                            {subdepartment}
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                              {grouped[department][subdepartment].length} items
                            </span>
                          </h4>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                            <table className="min-w-[900px] w-full text-sm">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="p-3 text-left w-12">Select</th>
                                  <th className="p-3 text-left">Name *</th>
                                  <th className="p-3 text-left">Lookup Code *</th>
                                  <th className="p-3 text-left">Original Price *</th>
                                  <th className="p-3 text-left">Discount Price</th>
                                  <th className="p-3 text-left">Department</th>
                                  <th className="p-3 text-left">Subdepartment</th>
                                  <th className="p-3 text-left">Errors</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grouped[department][subdepartment].map((product) => (
                                  <tr
                                    key={product.originalIndex}
                                    className={`border-t ${
                                      product.isValid ? 'bg-green-50/50' : 'bg-red-50/50'
                                    }`}
                                  >
                                    <td className="p-3 align-top">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.has(product.originalIndex)}
                                        onChange={() => handleToggleItem(product.originalIndex)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="text"
                                        value={product.name}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'name', e.target.value)}
                                        className="w-full min-w-[160px] px-3 py-2 border border-slate-300 rounded-lg"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="text"
                                        value={product.lookup_code}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'lookup_code', e.target.value)}
                                        className="w-full min-w-[140px] px-3 py-2 border border-slate-300 rounded-lg"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="number"
                                        value={product.original_price}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'original_price', e.target.value)}
                                        className="w-full min-w-[120px] px-3 py-2 border border-slate-300 rounded-lg"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="number"
                                        value={product.discount_price}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'discount_price', e.target.value)}
                                        className="w-full min-w-[120px] px-3 py-2 border border-slate-300 rounded-lg"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <select
                                        value={product.department || ''}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'department', e.target.value)}
                                        className="w-full min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg"
                                      >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                          <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-3 align-top">
                                      <select
                                        value={product.subdepartment || ''}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'subdepartment', e.target.value)}
                                        className="w-full min-w-[160px] px-3 py-2 border border-slate-300 rounded-lg"
                                        disabled={!product.department}
                                      >
                                        <option value="">Select Subdepartment</option>
                                        {product.department &&
                                          departments
                                            .find((d) => d.name === product.department)
                                            ?.subdepartments.map((subdept) => (
                                              <option key={subdept.id} value={subdept.name}>
                                                {subdept.name}
                                              </option>
                                            ))}
                                      </select>
                                    </td>
                                    <td className="p-3 align-top">
                                      {product.errors.length > 0 ? (
                                        <div className="text-xs text-red-700 space-y-1 min-w-[180px]">
                                          {product.errors.map((error, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                              <span>•</span>
                                              <span>{error}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <button
                  onClick={() => {
                    setShowExcelImport(false);
                    setValidationResults([]);
                    setSelectedItems(new Set());
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isImporting || selectedItems.size === 0 || validationResults.filter((p, i) => p.isValid && selectedItems.has(i)).length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : `Import ${validationResults.filter((p, i) => p.isValid && selectedItems.has(i)).length} `}
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload New Product</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Wireless Earbuds Pro"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Lookup Code */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lookup Code *
                  </label>
                  <input
                    type="text"
                    name="lookup_code"
                    value={formData.lookup_code}
                    onChange={handleInputChange}
                    placeholder="e.g., PROD-001"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="Item">Item</option>
                    <option value="CategoryGroup">Category Group</option>
                    <option value="DepartmentGroup">Department Group</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subdepartment */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subdepartment
                  </label>
                  <select
                    name="subdepartment"
                    value={formData.subdepartment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={!formData.department}
                  >
                    <option value="">Select Subdepartment</option>
                    {formData.department &&
                      departments
                        .find((d) => d.name === formData.department)
                        ?.subdepartments.map((subdept) => (
                          <option key={subdept.id} value={subdept.name}>
                            {subdept.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Original Price *
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Printing Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Printing Time (hours)
                  </label>
                  <input
                    type="number"
                    name="printing_time"
                    value={formData.printing_time}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Product Images <span className="text-slate-500 font-normal">(up to 5 images)</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                  {/* Image Previews Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full aspect-square object-cover rounded-lg border border-slate-200" 
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {imageFiles.length < 5 && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="text-center py-6 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-slate-600">
                          {imagePreviews.length > 0 ? 'Add more images' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-slate-500">
                          PNG, JPG, GIF up to 10MB • {5 - imageFiles.length} slots remaining
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{product.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-semibold">{product.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Original Price:</span>
                    <span className="font-semibold">₹{product.original_price}</span>
                  </div>
                  {product.discount_price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount Price:</span>
                      <span className="font-semibold text-green-600">₹{product.discount_price}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Stock:</span>
                    <span className="font-semibold">{product.stock_quantity}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !showForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Products Yet</h2>
            <p className="text-slate-600 mb-6">Start by adding your first product</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
