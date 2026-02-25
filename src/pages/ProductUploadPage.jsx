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
  findSubdepartmentId,
  updateCatalogItem,
  getNextProductLookupCode
} from '../utils/catalogService';
import * as XLSX from 'xlsx';

export default function ProductUploadPage({ showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'departments'
  
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
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentIconFile, setDepartmentIconFile] = useState(null);
  const [uploadingDeptIcon, setUploadingDeptIcon] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    subdepartments: [''],
    icon: '',
    imageUrl: '',
    color: 'from-blue-400 to-cyan-500'
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
    subdepartment: '',
    // Specifications (structured) - these keys will be saved under item_details_data.specifications
    spec_material: '',
    spec_printingTechnology: '',
    spec_finish: '',
    spec_base: '',
    spec_textEngraving: '',
    spec_size: '',
    spec_weight: '',
    // Customization options (seller toggles)
    custom_names: false,
    change_outfits: false,
    modify_hairstyles: false,
    extra_members: false,
    personal_message: false,
    // Why choose text
    why_choose: ''
  });

  // Dynamic specification and customization fields
  const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);
  const [customFields, setCustomFields] = useState([{ key: '', available: true }]);

  const addSpecField = () => setSpecFields(prev => [...prev, { key: '', value: '' }]);
  const updateSpecField = (index, field, value) => setSpecFields(prev => prev.map((f,i) => i===index ? { ...f, [field]: value } : f));
  const removeSpecField = (index) => setSpecFields(prev => prev.filter((_,i) => i!==index));

  const addCustomField = () => setCustomFields(prev => [...prev, { key: '', available: true }]);
  const updateCustomField = (index, field, value) => setCustomFields(prev => prev.map((f,i) => i===index ? { ...f, [field]: value } : f));
  const removeCustomField = (index) => setCustomFields(prev => prev.filter((_,i) => i!==index));

  // Load existing products
  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        setIsLoadingData(true);
        await Promise.all([loadProducts(), loadDepartments()]);
        setIsLoadingData(false);
      };
      fetchData();
    } else {
      setIsLoadingData(false);
    }
  }, [user?.id]);

  const loadProducts = async () => {
    try {
      const { data, error } = await getUserCatalogItems(user.id);
      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        return;
      }
      // Ensure products is always an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await getDepartmentHierarchy(user.id);
    if (!error && data) {
      setDepartments(data);
    }
  };

  const handleEditDepartment = (dept) => {
    setDepartmentFormData({
      name: dept.name,
      subdepartments: dept.subdepartments.length > 0 
        ? dept.subdepartments.map(s => s.name) 
        : [''],
      icon: dept.item_details_data?.icon || '',
      imageUrl: dept.image_url || '',
      color: dept.item_details_data?.color || 'from-blue-400 to-cyan-500'
    });
    setEditingDepartment(dept);
    setShowDepartmentForm(true);
  };

  const handleAddDepartment = async () => {
    if (!departmentFormData.name.trim()) {
      showToast('Department name is required');
      return;
    }

    setLoading(true);

    try {
      if (editingDepartment) {
        // Update existing department name, icon, image, and color
        const { error: updateError } = await supabase
          .from('catalog_entities')
          .update({ 
            name: departmentFormData.name, 
            image_url: departmentFormData.imageUrl || null,
            item_details_data: { 
              icon: departmentFormData.icon || null, 
              color: departmentFormData.color || 'from-blue-400 to-cyan-500' 
            },
            updated_at: new Date().toISOString() 
          })
          .eq('id', editingDepartment.id)
          .eq('user_id', user.id);

        if (updateError) {
          showToast('Failed to update department');
          setLoading(false);
          return;
        }

        // Get existing subdepartment names
        const existingSubdepNames = editingDepartment.subdepartments.map(s => s.name);
        const newSubdeps = departmentFormData.subdepartments.filter(s => s.trim() !== '');

        // Delete subdepartments that were removed
        for (const existingSub of editingDepartment.subdepartments) {
          if (!newSubdeps.includes(existingSub.name)) {
            await supabase
              .from('catalog_entities')
              .delete()
              .eq('id', existingSub.id)
              .eq('user_id', user.id);
          }
        }

        // Add new subdepartments
        for (let i = 0; i < newSubdeps.length; i++) {
          if (!existingSubdepNames.includes(newSubdeps[i])) {
            const subLookupCode = `SUBDEPT-${Date.now()}-${i}`;
            await createSubdepartment(user.id, newSubdeps[i], subLookupCode, editingDepartment.id);
          }
        }

        showToast('Department updated successfully!');
      } else {
        // Create the department
        const deptLookupCode = `DEPT-${Date.now()}`;
        const { data: deptData, error: deptError } = await createDepartment(
          user.id,
          departmentFormData.name,
          deptLookupCode,
          departmentFormData.icon || null,
          departmentFormData.imageUrl || null,
          departmentFormData.color || 'from-blue-400 to-cyan-500'
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

        showToast('Department added successfully!');
      }

      // Reload departments
      await loadDepartments();
      setDepartmentFormData({ name: '', subdepartments: [''], icon: '', imageUrl: '', color: 'from-blue-400 to-cyan-500' });
      setDepartmentIconFile(null);
      setShowDepartmentForm(false);
      setEditingDepartment(null);
    } catch (error) {
      console.error('Error saving department:', error);
      showToast('Error saving department');
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

  // Helper to check if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const handleDepartmentIconUpload = async (file) => {
    if (!file) return;
    
    // Validate file type (including video)
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a valid file (PNG, JPG, GIF, WebP, SVG, MP4)');
      return;
    }
    
    // Validate file size (max 10MB for animated/video files)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be less than 10MB');
      return;
    }
    
    setUploadingDeptIcon(true);
    try {
      const { url, error } = await uploadImage(user.id, file);
      if (error) {
        showToast('Failed to upload image');
        return;
      }
      setDepartmentFormData(prev => ({ ...prev, imageUrl: url }));
      setDepartmentIconFile(file);
      showToast('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Error uploading image');
    } finally {
      setUploadingDeptIcon(false);
    }
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
      ,
      department: '',
      subdepartment: '',
      spec_material: '',
      spec_printingTechnology: '',
      spec_finish: '',
      spec_base: '',
      spec_textEngraving: '',
      spec_size: '',
      spec_weight: '',
      custom_names: false,
      change_outfits: false,
      modify_hairstyles: false,
      extra_members: false,
      personal_message: false,
      why_choose: ''
    });
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    // Populate form with product data
    const itemDetails = product.item_details_data || {};
    const specs = itemDetails.specifications || {};
    const customs = itemDetails.customizationOptions || {};
    
    setFormData({
      name: product.name || '',
      lookup_code: product.lookup_code || '',
      description: product.description || '',
      type: product.type || 'Item',
      original_price: product.original_price || '',
      discount_price: product.discount_price || '',
      stock_quantity: product.stock_quantity || '',
      printing_time: product.printing_time || '',
      is_active: product.is_active ?? true,
      department: itemDetails.department || '',
      subdepartment: itemDetails.subcategory || '',
      spec_material: specs.material || '',
      spec_printingTechnology: specs.printingTechnology || '',
      spec_finish: specs.finish || '',
      spec_base: specs.base || '',
      spec_textEngraving: specs.textEngraving || '',
      spec_size: specs.size || '',
      spec_weight: specs.weight || '',
      custom_names: customs.customNames || false,
      change_outfits: customs.changeOutfits || false,
      modify_hairstyles: customs.modifyHairstyles || false,
      extra_members: customs.extraMembers || false,
      personal_message: customs.personalMessage || false,
      why_choose: itemDetails.whyChoose || ''
    });
    
    // Set spec fields from specifications
    const specEntries = Object.entries(specs).filter(([k]) => 
      !['material', 'printingTechnology', 'finish', 'base', 'textEngraving', 'size', 'weight'].includes(k)
    );
    if (specEntries.length > 0) {
      setSpecFields(specEntries.map(([key, value]) => ({ key, value })));
    } else {
      setSpecFields([{ key: '', value: '' }]);
    }
    
    // Set custom fields from customization options
    const customEntries = Object.entries(customs).filter(([k]) => 
      !['customNames', 'changeOutfits', 'modifyHairstyles', 'extraMembers', 'personalMessage'].includes(k)
    );
    if (customEntries.length > 0) {
      setCustomFields(customEntries.map(([key, available]) => ({ key, available })));
    } else {
      setCustomFields([{ key: '', available: true }]);
    }
    
    // Set image previews - include main image and all additional images
    const allImages = [];
    if (product.image_url) {
      allImages.push(product.image_url);
    }
    if (itemDetails.additionalImages && itemDetails.additionalImages.length > 0) {
      allImages.push(...itemDetails.additionalImages);
    }
    setImagePreviews(allImages);
    setImageFiles([]); // Clear file inputs since we're showing existing URLs
    
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handle adding a new product with auto-generated lookup code
  const handleAddNewProduct = async () => {
    // Generate lookup code first
    let generatedCode = `PROD-${Date.now()}`;
    try {
      const result = await getNextProductLookupCode();
      if (result && result.data) {
        generatedCode = result.data;
      }
    } catch (err) {
      console.error('Error generating lookup code:', err);
    }
    
    setFormData({
      name: '',
      lookup_code: generatedCode,
      description: '',
      type: 'Item',
      original_price: '',
      discount_price: '',
      stock_quantity: '',
      printing_time: '',
      is_active: true,
      department: '',
      subdepartment: '',
      spec_material: '',
      spec_printingTechnology: '',
      spec_finish: '',
      spec_base: '',
      spec_textEngraving: '',
      spec_size: '',
      spec_weight: '',
      custom_names: false,
      change_outfits: false,
      modify_hairstyles: false,
      extra_members: false,
      personal_message: false,
      why_choose: ''
    });
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
    setSpecFields([{ key: '', value: '' }]);
    setCustomFields([{ key: '', available: true }]);
    setShowForm(true);
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

      // Build specifications object from dynamic fields (fallback to flat fields)
      const specifications = {};
      specFields.forEach(f => {
        if (f.key && f.key.trim()) specifications[f.key.trim()] = f.value || '';
      });
      // fallback to older flat spec fields if no dynamic specs provided
      if (Object.keys(specifications).length === 0 && formData.spec_material) {
        specifications.material = formData.spec_material;
        specifications.printingTechnology = formData.spec_printingTechnology;
        specifications.finish = formData.spec_finish;
        specifications.base = formData.spec_base;
        specifications.textEngraving = formData.spec_textEngraving;
        specifications.size = formData.spec_size;
        specifications.weight = formData.spec_weight;
      }

      // Build customization options from dynamic fields (fallback to flat toggles)
      const customizationOptions = {};
      customFields.forEach(c => {
        if (c.key && c.key.trim()) customizationOptions[c.key.trim()] = !!c.available;
      });
      if (Object.keys(customizationOptions).length === 0) {
        customizationOptions.customNames = !!formData.custom_names;
        customizationOptions.changeOutfits = !!formData.change_outfits;
        customizationOptions.modifyHairstyles = !!formData.modify_hairstyles;
        customizationOptions.extraMembers = !!formData.extra_members;
        customizationOptions.personalMessage = !!formData.personal_message;
      }

      // Prepare item data
      const itemData = {
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
        image_url: imageUrl || (editingProduct?.image_url || null),
        item_details_data: {
          department: formData.department,
          subcategory: formData.subdepartment,
          additionalImages: additionalImages.length > 0 ? additionalImages : (editingProduct?.item_details_data?.additionalImages || []),
          specifications,
          customizationOptions,
          whyChoose: formData.why_choose
        }
      };

      let data, error;
      
      if (editingProduct) {
        // Update existing product
        const result = await updateCatalogItem(editingProduct.id, user.id, itemData);
        data = result.data;
        error = result.error;
      } else {
        // Create new product with retry logic for duplicate key errors
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          const result = await createCatalogItem(user.id, itemData);
          data = result.data;
          error = result.error;
          
          // Check for duplicate key error (code 23505)
          if (error?.code === '23505' && error?.details?.includes('lookup_code')) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // Get a new lookup code and retry
              const { data: newCode } = await getNextProductLookupCode();
              itemData.lookup_code = newCode || `PROD-${Date.now()}`;
              continue;
            }
          }
          break;
        }
      }

      if (error) {
        showToast(editingProduct ? 'Failed to update product' : 'Failed to create product');
        console.error(error);
        setLoading(false);
        return;
      }

      showToast(editingProduct ? 'Product updated successfully!' : 'Product uploaded successfully!');
      
      // Reset form (including new spec/custom fields)
      setEditingProduct(null);
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
        subdepartment: '',
        spec_material: '',
        spec_printingTechnology: '',
        spec_finish: '',
        spec_base: '',
        spec_textEngraving: '',
        spec_size: '',
        spec_weight: '',
        custom_names: false,
        change_outfits: false,
        modify_hairstyles: false,
        extra_members: false,
        personal_message: false,
        why_choose: ''
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Product Management</h1>
          <p className="text-slate-600">Manage your products and departments</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-8 py-3 font-bold text-lg rounded-xl transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Products
            </span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-8 py-3 font-bold text-lg rounded-xl transition-all ${
              activeTab === 'departments'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-purple-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Departments
            </span>
          </button>
        </div>

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <>
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
              onClick={handleAddNewProduct}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          )}
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Upload New Product'}
            </h2>
            
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
                    Product Code <span className="text-xs font-normal text-slate-500">(auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    name="lookup_code"
                    value={formData.lookup_code}
                    readOnly
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
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

                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Specifications</h3>
                  <div className="space-y-3">
                    {specFields.map((field, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Specification name (e.g., Material)"
                          value={field.key}
                          onChange={(e) => updateSpecField(idx, 'key', e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g., PLA / Resin)"
                          value={field.value}
                          onChange={(e) => updateSpecField(idx, 'value', e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <button type="button" onClick={() => removeSpecField(idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded mt-2 sm:mt-0">Remove</button>
                      </div>
                    ))}
                    <div>
                      <button type="button" onClick={addSpecField} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">+ Add specification</button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Customization Options</h3>
                  <div className="space-y-3">
                    {customFields.map((c, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Option name (e.g., Custom Names)"
                          value={c.key}
                          onChange={(e) => updateCustomField(idx, 'key', e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!c.available} onChange={(e) => updateCustomField(idx, 'available', e.target.checked)} />
                          <span className="whitespace-nowrap">Available</span>
                        </label>
                        <button type="button" onClick={() => removeCustomField(idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded mt-2 sm:mt-0">Remove</button>
                      </div>
                    ))}
                    <div>
                      <button type="button" onClick={addCustomField} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">+ Add customization option</button>
                    </div>
                  </div>
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
                          PNG, JPG, GIF, WebP up to 10MB • {5 - imageFiles.length} slots remaining
                        </p>
                        <p className="text-xs text-purple-500 mt-1">
                          ✨ Animated GIF/WebP supported!
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
                  {loading ? (editingProduct ? 'Updating...' : 'Uploading...') : (editingProduct ? 'Update Product' : 'Upload Product')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        {!isLoadingData && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {products.filter(p => p.type?.toLowerCase() === 'item').length > 0 && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 w-16">Image</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 max-w-[200px]">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Original Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Discount Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Discount %</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Stock</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.type?.toLowerCase() === 'item').map(product => {
                    const discountPercent = product.original_price > 0 && product.discount_price > 0
                      ? Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)
                      : 0;
                    return (
                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 w-16">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <div>
                          <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                          <p className="text-sm text-slate-500 line-clamp-1">{product.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">₹{product.original_price}</span>
                      </td>
                      <td className="py-3 px-4">
                        {product.discount_price > 0 ? (
                          <span className="font-semibold text-green-600">₹{product.discount_price}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {discountPercent > 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            {discountPercent}% OFF
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}

        {/* Loading State */}
        {isLoadingData && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading products...</p>
          </div>
        )}

        {!isLoadingData && products.filter(p => p.type?.toLowerCase() === 'item').length === 0 && !showForm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Products Yet</h2>
            <p className="text-slate-600 mb-6">Start by adding your first product</p>
            <button
              onClick={handleAddNewProduct}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg"
            >
              Add First Product
            </button>
          </div>
        )}
          </>
        )}

        {/* Departments Tab Content */}
        {activeTab === 'departments' && (
          <>
            {/* Department Management Section */}
            <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Department Management</h2>
                <button
                  onClick={() => setShowDepartmentForm(!showDepartmentForm)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Department
                </button>
              </div>

              {/* Add Department Form */}
              {showDepartmentForm && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    {editingDepartment ? 'Edit Department' : 'New Department'}
                  </h3>
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

                    {/* Icon/Emoji and Image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Icon/Emoji
                        </label>
                        <input
                          type="text"
                          value={departmentFormData.icon}
                          onChange={(e) => setDepartmentFormData(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="e.g., 🎁, ⚡, 🏠"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Enter an emoji or symbol to display</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Department Image (optional)
                        </label>
                        
                        {/* File Upload */}
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center gap-1 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                            {uploadingDeptIcon ? (
                              <>
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-slate-600">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-slate-600">Upload Image</span>
                                </div>
                                <span className="text-xs text-purple-500">✨ Animated GIF/MP4/WebP supported!</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm"
                              onChange={(e) => handleDepartmentIconUpload(e.target.files[0])}
                              className="hidden"
                              disabled={uploadingDeptIcon}
                            />
                          </label>
                          
                          {/* OR Divider */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-xs text-slate-400">OR paste URL</span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                          </div>
                          
                          {/* URL Input */}
                          <input
                            type="text"
                            value={departmentFormData.imageUrl}
                            onChange={(e) => setDepartmentFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="Paste direct image URL here"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                          />
                          <p className="text-xs text-slate-500">Use direct image URL (ending in .png, .jpg, .gif)</p>
                          
                          {/* Clear Image Button */}
                          {departmentFormData.imageUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setDepartmentFormData(prev => ({ ...prev, imageUrl: '' }));
                                setDepartmentIconFile(null);
                              }}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Clear image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Color Gradient */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Background Color
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {[
                          { value: 'from-pink-400 to-red-500', label: 'Pink-Red' },
                          { value: 'from-yellow-400 to-orange-500', label: 'Yellow-Orange' },
                          { value: 'from-green-400 to-emerald-500', label: 'Green' },
                          { value: 'from-purple-400 to-pink-500', label: 'Purple-Pink' },
                          { value: 'from-blue-400 to-cyan-500', label: 'Blue-Cyan' },
                          { value: 'from-indigo-400 to-blue-500', label: 'Indigo-Blue' },
                          { value: 'from-amber-400 to-yellow-500', label: 'Amber' },
                          { value: 'from-rose-400 to-pink-500', label: 'Rose' },
                          { value: 'from-slate-400 to-gray-500', label: 'Slate' },
                          { value: 'from-teal-400 to-emerald-500', label: 'Teal' },
                          { value: 'from-orange-400 to-red-500', label: 'Orange-Red' },
                          { value: 'from-violet-400 to-purple-500', label: 'Violet' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setDepartmentFormData(prev => ({ ...prev, color: color.value }))}
                            className={`w-full h-10 rounded-lg bg-gradient-to-br ${color.value} ${departmentFormData.color === color.value ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Preview</label>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${departmentFormData.color} p-1 shadow-lg`}>
                          <div className="w-full h-full rounded-lg overflow-hidden bg-white flex items-center justify-center">
                            {departmentFormData.imageUrl ? (
                              isVideoUrl(departmentFormData.imageUrl) ? (
                                <video 
                                  src={departmentFormData.imageUrl} 
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img 
                                  src={departmentFormData.imageUrl} 
                                  alt="Department" 
                                  className="w-10 h-10 object-contain"
                                />
                              )
                            ) : (
                              <span className="text-3xl">{departmentFormData.icon || '📁'}</span>
                            )}
                          </div>
                        </div>
                        {departmentFormData.imageUrl && (
                          <div className="text-xs text-slate-500">
                            {isVideoUrl(departmentFormData.imageUrl) ? (
                              <p className="text-green-600 font-medium">✓ Animated icon loaded</p>
                            ) : (
                              <>
                                <p>If media doesn't load, check:</p>
                                <ul className="list-disc ml-4 mt-1">
                                  <li>URL must be direct file link</li>
                                  <li>For Flaticon: download the file first</li>
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
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
                          setDepartmentFormData({ name: '', subdepartments: [''], icon: '', imageUrl: '', color: 'from-blue-400 to-cyan-500' });
                          setDepartmentIconFile(null);
                          setEditingDepartment(null);
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
                        {editingDepartment ? 'Update Department' : 'Save Department'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Departments Table */}
              <div className="overflow-x-auto">
                {isLoadingData ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading departments...</p>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📁</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Departments Yet</h2>
                    <p className="text-slate-600 mb-6">Create departments to organize your products</p>
                    <button
                      onClick={() => setShowDepartmentForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
                    >
                      Add First Department
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Department</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Subdepartments</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) => (
                        <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dept.item_details_data?.color || 'from-blue-400 to-cyan-500'} p-0.5 shadow-sm`}>
                                <div className="w-full h-full rounded-md overflow-hidden bg-white flex items-center justify-center">
                                  {dept.image_url ? (
                                    isVideoUrl(dept.image_url) ? (
                                      <video src={dept.image_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                    ) : (
                                      <img src={dept.image_url} alt={dept.name} className="w-7 h-7 object-contain" />
                                    )
                                  ) : (
                                    <span className="text-xl">{dept.item_details_data?.icon || '📁'}</span>
                                  )}
                                </div>
                              </div>
                              <span className="font-semibold text-slate-900">{dept.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {dept.subdepartments.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {dept.subdepartments.map((subdep) => (
                                  <span
                                    key={subdep.id}
                                    className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-sm rounded-full"
                                  >
                                    {subdep.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">No subdepartments</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditDepartment(dept)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Department"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
