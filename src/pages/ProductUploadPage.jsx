import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { getCustomOrders } from '../utils/customOrderService';
import { 
  createCatalogItem, 
  uploadImage, 
  getUserCatalogItems,
  createDepartment,
  createSubdepartment,
  getDepartmentHierarchy,
  findSubdepartmentId,
  updateCatalogItem,
  getNextProductLookupCode,
  deleteCatalogItem
} from '../utils/catalogService';
import { getDepartmentIcon } from '../utils/departmentIcons';
import { isAdminEmail } from '../utils/adminAccess';
import * as XLSX from 'xlsx';
import SvgGenerator from '../components/SvgGenerator';

const resolveAssetSrc = (rawSrc) => {
  const src = String(rawSrc || '').trim();
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (src.startsWith(normalizedBase)) {
    return src;
  }

  if (src.startsWith('/NirmanHub/')) {
    return `${normalizedBase}${src.replace(/^\/NirmanHub\/+/, '')}`;
  }

  if (src.startsWith('/')) {
    return `${normalizedBase}${src.replace(/^\/+/, '')}`;
  }

  return `${normalizedBase}${src.replace(/^\/+/, '')}`;
};

export default function ProductUploadPage({ showToast }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeptSubdeptEditMode, setIsDeptSubdeptEditMode] = useState(false);
  const [isSavingDeptSubdept, setIsSavingDeptSubdept] = useState(false);
  const [deptSubdeptEdits, setDeptSubdeptEdits] = useState({});
  const [isPriceStockEditMode, setIsPriceStockEditMode] = useState(false);
  const [isSavingPriceStock, setIsSavingPriceStock] = useState(false);
  const [priceStockEdits, setPriceStockEdits] = useState({});
  const [isFeaturedEditMode, setIsFeaturedEditMode] = useState(false);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);
  const [featuredEdits, setFeaturedEdits] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isApplyingBulkUpdate, setIsApplyingBulkUpdate] = useState(false);
  const [bulkUpdateValues, setBulkUpdateValues] = useState({
    is_active: '',
    department: '',
    subdepartment: '',
    original_price: '',
    discount_price: '',
    stock_quantity: ''
  });
  const [activeUpdateLoadingIds, setActiveUpdateLoadingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [productFilters, setProductFilters] = useState({
    search: '',
    department: 'all',
    stock: 'all'
  });
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'departments'
  const [showCustomOrdersModal, setShowCustomOrdersModal] = useState(false);
  const [customOrders, setCustomOrders] = useState([]);
  const [isLoadingCustomOrders, setIsLoadingCustomOrders] = useState(false);
  
  // Excel import states
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showSvgGenerator, setShowSvgGenerator] = useState(false);
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
    featured_model: false,
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

  const loadCustomOrders = async () => {
    setIsLoadingCustomOrders(true);
    const { data, error } = await getCustomOrders();
    if (error) {
      showToast('Failed to load customized orders');
      setCustomOrders([]);
      setIsLoadingCustomOrders(false);
      return;
    }
    setCustomOrders(data || []);
    setIsLoadingCustomOrders(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadCustomOrders();
    }
  }, [user?.id]);

  const handleOpenCustomOrdersModal = async () => {
    await loadCustomOrders();
    setShowCustomOrdersModal(true);
  };

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
      const techAccessoryNames = new Set(['tech accessories', 'tech accessory']);
      const departmentsNeedingBackfill = data.filter((dept) => {
        const normalizedName = String(dept.name || '').trim().toLowerCase();
        const currentIcon = String(dept.item_details_data?.icon || '').trim();
        return techAccessoryNames.has(normalizedName) && currentIcon !== '🔌';
      });

      if (departmentsNeedingBackfill.length > 0) {
        await Promise.all(
          departmentsNeedingBackfill.map((dept) =>
            supabase
              .from('catalog_entities')
              .update({
                item_details_data: {
                  ...(dept.item_details_data || {}),
                  icon: '🔌'
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', dept.id)
              .eq('user_id', user.id)
          )
        );
      }

      const normalizedDepartments = data.map((dept) => {
        const normalizedName = String(dept.name || '').trim().toLowerCase();
        if (!techAccessoryNames.has(normalizedName)) {
          return dept;
        }
        return {
          ...dept,
          item_details_data: {
            ...(dept.item_details_data || {}),
            icon: '🔌'
          }
        };
      });

      setDepartments(normalizedDepartments);
    }
  };

  const handleEditDepartment = (dept) => {
    const generatedIcon = getDepartmentIcon(dept.name, dept.item_details_data?.icon);
    setDepartmentFormData({
      name: dept.name,
      subdepartments: dept.subdepartments.length > 0 
        ? dept.subdepartments.map(s => s.name) 
        : [''],
      icon: generatedIcon,
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

    const resolvedIcon = getDepartmentIcon(departmentFormData.name, departmentFormData.icon);

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
              icon: resolvedIcon, 
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
          resolvedIcon,
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
      featured_model: false,
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
      featured_model: product.featured_model ?? itemDetails.featuredModel ?? false,
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

  const handleDeleteProduct = async (productId, productName) => {
    setDeleteTarget({ ids: [productId], label: productName });
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProductIds.size === 0) {
      return;
    }
    setDeleteTarget({
      ids: Array.from(selectedProductIds),
      label: `${selectedProductIds.size} selected products`
    });
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAllProducts = (checked, filteredProducts) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (checked) {
        filteredProducts.forEach(product => next.add(product.id));
      } else {
        filteredProducts.forEach(product => next.delete(product.id));
      }
      return next;
    });
  };

  const handleBulkUpdateFieldChange = (field, value) => {
    setBulkUpdateValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetBulkUpdateValues = () => {
    setBulkUpdateValues({
      is_active: '',
      department: '',
      subdepartment: '',
      original_price: '',
      discount_price: '',
      stock_quantity: ''
    });
  };

  const clearProductFilters = () => {
    setProductFilters({
      search: '',
      department: 'all',
      stock: 'all'
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [productFilters.search, productFilters.department, productFilters.stock]);

  const getProductDepartment = (product) => String(product.item_details_data?.department || '').trim() || 'Others';
  const getProductSubdepartment = (product) => String(
    product.item_details_data?.subcategory || product.item_details_data?.subdepartment || ''
  ).trim() || 'Others';

  const getSubdepartmentOptionsForDepartment = (departmentName) => {
    const normalizedDepartment = String(departmentName || '').trim();
    const matchedDepartment = departments.find(
      dept => String(dept.name || '').trim() === normalizedDepartment
    );

    if (!matchedDepartment?.subdepartments?.length) {
      return [];
    }

    return Array.from(
      new Set(
        matchedDepartment.subdepartments
          .map(subdept => String(subdept.name || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  };

  const startDeptSubdeptEditMode = () => {
    setIsPriceStockEditMode(false);
    setPriceStockEdits({});
    setIsFeaturedEditMode(false);
    setFeaturedEdits({});
    const draft = {};
    products
      .filter(product => product.type?.toLowerCase() === 'item')
      .forEach(product => {
        draft[product.id] = {
          department: getProductDepartment(product),
          subdepartment: getProductSubdepartment(product)
        };
      });
    setDeptSubdeptEdits(draft);
    setIsDeptSubdeptEditMode(true);
  };

  const cancelDeptSubdeptEditMode = () => {
    setIsDeptSubdeptEditMode(false);
    setDeptSubdeptEdits({});
  };

  const getProductOriginalPrice = (product) => Number(product.original_price || 0);
  const getProductDiscountPrice = (product) => Number(product.discount_price || 0);
  const getProductStockQuantity = (product) => Number(product.stock_quantity || 0);
  const getProductIsActive = (product) => product.is_active !== false;
  const getProductFeatured = (product) => Boolean(
    product.featured_model ?? product.item_details_data?.featuredModel ?? false
  );

  const handleToggleSingleProductActive = async (product, nextActive) => {
    if (!user?.id) {
      showToast('Please log in to update products');
      return;
    }

    setActiveUpdateLoadingIds(prev => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });

    try {
      const { error } = await updateCatalogItem(product.id, user.id, {
        is_active: nextActive
      });

      if (error) {
        showToast(`Failed to update "${product.name}"`);
        return;
      }

      setProducts(prev => prev.map(item => (
        item.id === product.id ? { ...item, is_active: nextActive } : item
      )));
    } catch (error) {
      console.error('Error updating active status:', error);
      showToast('Error updating active status');
    } finally {
      setActiveUpdateLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleBulkUpdateSelectedProducts = async () => {
    if (!user?.id) {
      showToast('Please log in to update products');
      return;
    }

    const selectedItems = products.filter(
      product => product.type?.toLowerCase() === 'item' && selectedProductIds.has(product.id)
    );

    if (selectedItems.length === 0) {
      showToast('Select products first');
      return;
    }

    const hasActiveChange = bulkUpdateValues.is_active === 'active' || bulkUpdateValues.is_active === 'inactive';
    const hasDepartmentChange = String(bulkUpdateValues.department || '').trim().length > 0;
    const hasSubdepartmentChange = String(bulkUpdateValues.subdepartment || '').trim().length > 0;
    const hasOriginalPriceChange = String(bulkUpdateValues.original_price).trim() !== '';
    const hasDiscountPriceChange = String(bulkUpdateValues.discount_price).trim() !== '';
    const hasStockChange = String(bulkUpdateValues.stock_quantity).trim() !== '';

    if (
      !hasActiveChange &&
      !hasDepartmentChange &&
      !hasSubdepartmentChange &&
      !hasOriginalPriceChange &&
      !hasDiscountPriceChange &&
      !hasStockChange
    ) {
      showToast('Choose at least one bulk field to update');
      return;
    }

    try {
      setIsApplyingBulkUpdate(true);

      const results = await Promise.all(
        selectedItems.map(product => {
          const updates = {};

          if (hasActiveChange) {
            updates.is_active = bulkUpdateValues.is_active === 'active';
          }

          if (hasOriginalPriceChange) {
            updates.original_price = Math.max(0, Number(bulkUpdateValues.original_price || 0));
          }

          if (hasDiscountPriceChange) {
            updates.discount_price = Math.max(0, Number(bulkUpdateValues.discount_price || 0));
          }

          if (hasStockChange) {
            updates.stock_quantity = Math.max(0, Number(bulkUpdateValues.stock_quantity || 0));
          }

          if (hasDepartmentChange || hasSubdepartmentChange) {
            const nextDepartment = hasDepartmentChange
              ? String(bulkUpdateValues.department).trim()
              : getProductDepartment(product);
            const nextSubdepartment = hasSubdepartmentChange
              ? String(bulkUpdateValues.subdepartment).trim()
              : getProductSubdepartment(product);

            updates.item_details_data = {
              ...(product.item_details_data || {}),
              department: nextDepartment || 'Others',
              subcategory: nextSubdepartment || 'Others',
              subdepartment: nextSubdepartment || 'Others'
            };
          }

          return updateCatalogItem(product.id, user.id, updates);
        })
      );

      const failedCount = results.filter(result => result.error).length;
      const successCount = selectedItems.length - failedCount;

      if (failedCount === 0) {
        showToast(`${successCount} selected products updated successfully`);
      } else if (successCount > 0) {
        showToast(`${successCount} updated, ${failedCount} failed`);
      } else {
        showToast('Failed to update selected products');
      }

      await loadProducts();
      resetBulkUpdateValues();
      setSelectedProductIds(new Set());
    } catch (error) {
      console.error('Error applying bulk update:', error);
      showToast('Error applying bulk update');
    } finally {
      setIsApplyingBulkUpdate(false);
    }
  };

  const startPriceStockEditMode = () => {
    setIsDeptSubdeptEditMode(false);
    setDeptSubdeptEdits({});
    setIsFeaturedEditMode(false);
    setFeaturedEdits({});
    const draft = {};
    products
      .filter(product => product.type?.toLowerCase() === 'item')
      .forEach(product => {
        draft[product.id] = {
          original_price: String(getProductOriginalPrice(product)),
          discount_price: String(getProductDiscountPrice(product)),
          stock_quantity: String(getProductStockQuantity(product))
        };
      });
    setPriceStockEdits(draft);
    setIsPriceStockEditMode(true);
  };

  const cancelPriceStockEditMode = () => {
    setIsPriceStockEditMode(false);
    setPriceStockEdits({});
  };

  const startFeaturedEditMode = () => {
    setIsDeptSubdeptEditMode(false);
    setDeptSubdeptEdits({});
    setIsPriceStockEditMode(false);
    setPriceStockEdits({});
    const draft = {};
    products
      .filter(product => product.type?.toLowerCase() === 'item')
      .forEach(product => {
        draft[product.id] = getProductFeatured(product);
      });
    setFeaturedEdits(draft);
    setIsFeaturedEditMode(true);
  };

  const cancelFeaturedEditMode = () => {
    setIsFeaturedEditMode(false);
    setFeaturedEdits({});
  };

  const handleFeaturedDraftChange = (productId, value) => {
    setFeaturedEdits(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const saveFeaturedUpdates = async () => {
    if (!user?.id) {
      showToast('Please log in to update products');
      return;
    }

    const itemProductsToCheck = products.filter(product => product.type?.toLowerCase() === 'item');
    const changedProducts = itemProductsToCheck.filter(product => {
      const nextValue = Boolean(featuredEdits[product.id]);
      return nextValue !== getProductFeatured(product);
    });

    if (changedProducts.length === 0) {
      showToast('No featured changes to update');
      cancelFeaturedEditMode();
      return;
    }

    try {
      setIsSavingFeatured(true);
      const results = await Promise.all(
        changedProducts.map(product =>
          updateCatalogItem(product.id, user.id, {
            featured_model: Boolean(featuredEdits[product.id])
          })
        )
      );

      const failedCount = results.filter(result => result.error).length;
      const successCount = changedProducts.length - failedCount;

      if (failedCount === 0) {
        showToast(`${successCount} products updated successfully`);
      } else if (successCount > 0) {
        showToast(`${successCount} updated, ${failedCount} failed`);
      } else {
        showToast('Failed to update featured products');
      }

      await loadProducts();
      cancelFeaturedEditMode();
    } catch (error) {
      console.error('Error updating featured products:', error);
      showToast('Error updating featured products');
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const handlePriceStockDraftChange = (productId, field, value) => {
    setPriceStockEdits(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { original_price: '0', discount_price: '0', stock_quantity: '0' }),
        [field]: value
      }
    }));
  };

  const savePriceStockUpdates = async () => {
    if (!user?.id) {
      showToast('Please log in to update products');
      return;
    }

    const itemProductsToCheck = products.filter(product => product.type?.toLowerCase() === 'item');
    const changedProducts = itemProductsToCheck.filter(product => {
      const draft = priceStockEdits[product.id];
      if (!draft) return false;

      const nextOriginal = Number(draft.original_price || 0);
      const nextDiscount = Number(draft.discount_price || 0);
      const nextStock = Number(draft.stock_quantity || 0);

      return (
        nextOriginal !== getProductOriginalPrice(product) ||
        nextDiscount !== getProductDiscountPrice(product) ||
        nextStock !== getProductStockQuantity(product)
      );
    });

    if (changedProducts.length === 0) {
      showToast('No price or stock changes to update');
      cancelPriceStockEditMode();
      return;
    }

    try {
      setIsSavingPriceStock(true);
      const results = await Promise.all(
        changedProducts.map(product => {
          const draft = priceStockEdits[product.id] || {};
          const nextOriginal = Math.max(0, Number(draft.original_price || 0));
          const nextDiscount = Math.max(0, Number(draft.discount_price || 0));
          const nextStock = Math.max(0, Number(draft.stock_quantity || 0));

          return updateCatalogItem(product.id, user.id, {
            original_price: nextOriginal,
            discount_price: nextDiscount,
            stock_quantity: nextStock
          });
        })
      );

      const failedCount = results.filter(result => result.error).length;
      const successCount = changedProducts.length - failedCount;

      if (failedCount === 0) {
        showToast(`${successCount} products updated successfully`);
      } else if (successCount > 0) {
        showToast(`${successCount} updated, ${failedCount} failed`);
      } else {
        showToast('Failed to update price and stock');
      }

      await loadProducts();
      cancelPriceStockEditMode();
    } catch (error) {
      console.error('Error updating price/stock:', error);
      showToast('Error updating price and stock');
    } finally {
      setIsSavingPriceStock(false);
    }
  };

  const handleDeptSubdeptDraftChange = (productId, field, value) => {
    setDeptSubdeptEdits(prev => {
      const current = prev[productId] || { department: 'Others', subdepartment: 'Others' };

      if (field === 'department') {
        const nextDepartment = String(value || '').trim() || 'Others';
        const subdeptOptions = getSubdepartmentOptionsForDepartment(nextDepartment);
        const nextSubdepartment = subdeptOptions.includes(current.subdepartment)
          ? current.subdepartment
          : 'Others';

        return {
          ...prev,
          [productId]: {
            ...current,
            department: nextDepartment,
            subdepartment: nextSubdepartment
          }
        };
      }

      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: String(value || '').trim() || 'Others'
        }
      };
    });
  };

  const saveDeptSubdeptUpdates = async () => {
    if (!user?.id) {
      showToast('Please log in to update products');
      return;
    }

    const itemProductsToCheck = products.filter(product => product.type?.toLowerCase() === 'item');
    const changedProducts = itemProductsToCheck.filter(product => {
      const draft = deptSubdeptEdits[product.id];
      if (!draft) return false;
      const nextDepartment = String(draft.department || '').trim() || 'Others';
      const nextSubdepartment = String(draft.subdepartment || '').trim() || 'Others';
      return (
        nextDepartment !== getProductDepartment(product) ||
        nextSubdepartment !== getProductSubdepartment(product)
      );
    });

    if (changedProducts.length === 0) {
      showToast('No department changes to update');
      cancelDeptSubdeptEditMode();
      return;
    }

    try {
      setIsSavingDeptSubdept(true);
      const results = await Promise.all(
        changedProducts.map(product => {
          const draft = deptSubdeptEdits[product.id] || {};
          const nextDepartment = String(draft.department || '').trim() || 'Others';
          const nextSubdepartment = String(draft.subdepartment || '').trim() || 'Others';
          return updateCatalogItem(product.id, user.id, {
            item_details_data: {
              ...(product.item_details_data || {}),
              department: nextDepartment,
              subcategory: nextSubdepartment,
              subdepartment: nextSubdepartment
            }
          });
        })
      );

      const failedCount = results.filter(result => result.error).length;
      const successCount = changedProducts.length - failedCount;

      if (failedCount === 0) {
        showToast(`${successCount} products updated successfully`);
      } else if (successCount > 0) {
        showToast(`${successCount} updated, ${failedCount} failed`);
      } else {
        showToast('Failed to update department details');
      }

      await loadProducts();
      cancelDeptSubdeptEditMode();
    } catch (error) {
      console.error('Error updating department/subdepartment:', error);
      showToast('Error updating department details');
    } finally {
      setIsSavingDeptSubdept(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget?.ids?.length || !user?.id) {
      setDeleteTarget(null);
      return;
    }

    try {
      setIsDeletingProduct(true);
      const deleteResults = await Promise.all(
        deleteTarget.ids.map(productId => deleteCatalogItem(productId, user.id))
      );

      const failedCount = deleteResults.filter(result => result.error).length;
      const deletedCount = deleteTarget.ids.length - failedCount;

      if (failedCount === 0) {
        showToast(
          deleteTarget.ids.length > 1
            ? `${deletedCount} products deleted successfully`
            : 'Product deleted successfully'
        );
      } else if (deletedCount > 0) {
        showToast(`${deletedCount} deleted, ${failedCount} failed`);
      } else {
        showToast('Failed to delete selected products');
      }

      await loadProducts();
      setSelectedProductIds(prev => {
        const next = new Set(prev);
        deleteTarget.ids.forEach(productId => next.delete(productId));
        return next;
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Error deleting product');
    } finally {
      setIsDeletingProduct(false);
    }
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
      featured_model: false,
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
        featured_model: formData.featured_model === true,
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
        featured_model: false,
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
  const readExcelCell = (row, keys, fallback = '') => {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }

    const normalizedEntries = Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]);
    for (const key of keys) {
      const normalizedKey = String(key).trim().toLowerCase();
      const found = normalizedEntries.find(([entryKey]) => entryKey === normalizedKey);
      if (found && found[1] !== undefined && found[1] !== null && found[1] !== '') {
        return found[1];
      }
    }

    return fallback;
  };

  const parseAdditionalImagesValue = (value) => {
    if (Array.isArray(value)) return value.map(v => String(v || '').trim()).filter(Boolean);
    return String(value || '')
      .split(/\r?\n|,|;/)
      .map(v => v.trim())
      .filter(Boolean);
  };

  const parseBooleanExcel = (value, fallback = true) => {
    if (typeof value === 'boolean') return value;
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
    return fallback;
  };

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
          const additionalImagesRaw = readExcelCell(row, ['additional_images', 'Additional Images', 'additionalImages'], '');
          const additionalImages = parseAdditionalImagesValue(additionalImagesRaw);
          const imageUrlCell = readExcelCell(row, ['image_url', 'Image URL', 'image'], '');

          const product = {
            name: String(readExcelCell(row, ['name', 'Name', 'NAME'], '') || '').trim(),
            lookup_code: String(readExcelCell(row, ['lookup_code', 'Lookup Code', 'code'], '') || '').trim(),
            description: String(readExcelCell(row, ['description', 'Description'], '') || '').trim(),
            type: String(readExcelCell(row, ['type', 'Type'], 'Item') || 'Item').trim() || 'Item',
            original_price: readExcelCell(row, ['original_price', 'Original Price', 'price'], ''),
            discount_price: readExcelCell(row, ['discount_price', 'Discount Price'], ''),
            stock_quantity: readExcelCell(row, ['stock_quantity', 'Stock Quantity', 'stock'], ''),
            printing_time: readExcelCell(row, ['printing_time', 'Printing Time'], ''),
            is_active: parseBooleanExcel(readExcelCell(row, ['is_active', 'Is Active'], true), true),
            featured_model: parseBooleanExcel(readExcelCell(row, ['featured_model', 'Featured Model', 'featured'], false), false),
            department: String(readExcelCell(row, ['department', 'Department'], '') || '').trim(),
            subdepartment: String(readExcelCell(row, ['subdepartment', 'Subdepartment', 'Sub Department'], '') || '').trim(),
            image_url: String(imageUrlCell || '').trim() || null,
            additional_images: additionalImages,
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

        const additionalImages = parseAdditionalImagesValue(product.additional_images);
        const primaryImage = (product.image_url && String(product.image_url).trim())
          ? String(product.image_url).trim()
          : (additionalImages[0] || null);

        const itemData = {
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
          featured_model: product.featured_model === true,
          image_url: primaryImage,
          item_details_data: {
            department: product.department || '',
            subcategory: product.subdepartment || '',
            additionalImages: primaryImage ? additionalImages.filter(url => url !== primaryImage) : additionalImages
          }
        };

        let error = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount <= maxRetries) {
          const result = await createCatalogItem(user.id, itemData);
          error = result.error;

          if (error?.code === '23505' && error?.details?.includes('lookup_code')) {
            retryCount += 1;
            if (retryCount <= maxRetries) {
              const { data: newCode } = await getNextProductLookupCode();
              itemData.lookup_code = newCode || `PROD-${Date.now()}`;
              continue;
            }
          }
          break;
        }

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
        featured_model: false,
        department: 'Electronics',
        subdepartment: 'Mobile Accessories',
        image_url: '/Products/imported/sample-product/image-01.png',
        additional_images: '/Products/imported/sample-product/image-02.png, /Products/imported/sample-product/image-03.png'
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
  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-lg text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const itemProducts = products.filter(p => p.type?.toLowerCase() === 'item');
  const productsPerPage = 10;
  const departmentEditOptions = Array.from(
    new Set(
      departments
        .map(dept => String(dept.name || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
  const departmentFilterOptions = Array.from(
    new Set(
      itemProducts
        .map(product => product.item_details_data?.department)
        .filter(Boolean)
        .map(name => String(name).trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredItemProducts = itemProducts.filter(product => {
    const searchText = productFilters.search.trim().toLowerCase();
    const name = String(product.name || '').toLowerCase();
    const description = String(product.description || '').toLowerCase();
    const lookupCode = String(product.lookup_code || '').toLowerCase();
    const productDepartment = String(product.item_details_data?.department || '');
    const stockQty = Number(product.stock_quantity || 0);

    const searchMatch =
      !searchText ||
      name.includes(searchText) ||
      description.includes(searchText) ||
      lookupCode.includes(searchText);

    const departmentMatch =
      productFilters.department === 'all' ||
      productDepartment === productFilters.department;

    const stockMatch =
      productFilters.stock === 'all' ||
      (productFilters.stock === 'in' && stockQty > 0) ||
      (productFilters.stock === 'out' && stockQty <= 0);

    return searchMatch && departmentMatch && stockMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItemProducts.length / productsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = (currentPageSafe - 1) * productsPerPage;
  const paginatedItemProducts = filteredItemProducts.slice(pageStartIndex, pageStartIndex + productsPerPage);

  const allFilteredSelected =
    paginatedItemProducts.length > 0 &&
    paginatedItemProducts.every(product => selectedProductIds.has(product.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Title - Above Everything */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Product Management</h1>
          <p className="text-slate-600">Manage your products and departments</p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full px-4 sm:px-6 py-3 font-bold text-base sm:text-lg rounded-xl transition-all ${
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
            className={`w-full px-4 sm:px-6 py-3 font-bold text-base sm:text-lg rounded-xl transition-all ${
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
          <button
            onClick={() => navigate('/products/review')}
            className="w-full px-4 sm:px-6 py-3 font-bold text-base sm:text-lg rounded-xl transition-all bg-white text-slate-600 border-2 border-slate-200 hover:border-teal-400"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Review Products
            </span>
          </button>
          <button
            onClick={handleOpenCustomOrdersModal}
            className="w-full px-4 sm:px-6 py-3 font-bold text-base sm:text-lg rounded-xl transition-all bg-white text-slate-600 border-2 border-slate-200 hover:border-amber-400"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
              </svg>
              Customized Orders ({customOrders.length})
            </span>
          </button>
        </div>

        {showCustomOrdersModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Customized Orders</h2>
                  <p className="text-sm text-slate-600 mt-1">View customer-submitted customization details</p>
                </div>
                <button
                  onClick={() => setShowCustomOrdersModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close customized orders"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
                {isLoadingCustomOrders ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
                    Loading customized orders...
                  </div>
                ) : customOrders.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
                    No customized orders yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                          <p className="font-bold text-slate-900">{order.id}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                            Source Product: {order.sourceProduct.name}
                          </p>
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
                          <div>
                            <p className="font-semibold text-slate-700 mb-1">Reference Files</p>
                            {order.files?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {order.files.map((file, fileIndex) => (
                                  <a
                                    key={`${order.id}-${file.path || file.name}-${fileIndex}`}
                                    href={file.url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                                      file.url
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
                                    }`}
                                    onClick={(event) => {
                                      if (!file.url) event.preventDefault();
                                    }}
                                  >
                                    {file.name || `File ${fileIndex + 1}`}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-600">—</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <>
            {/* Action Buttons - Below Title */}
            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 mb-8">
              {/* Download Excel Template */}
              <button
                onClick={downloadExcelTemplate}
                disabled={isDownloadingTemplate}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <label className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
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
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          )}
          
          {/* SVG Generator Button */}
          <button
            onClick={() => setShowSvgGenerator(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            title="Generate SVG from text or image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            SVG Generator
          </button>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold">
              Total Products: <span className="text-blue-600">{itemProducts.length}</span>
              <span className="text-slate-400"> • </span>
              Showing: <span className="text-purple-600">{filteredItemProducts.length}</span>
            </div>
            {selectedProductIds.size > 0 && (
              <button
                onClick={handleBulkDeleteProducts}
                className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
              >
                Delete Selected ({selectedProductIds.size})
              </button>
            )}
          </div>

          {selectedProductIds.size > 0 && (
            <div className="mt-4 p-4 rounded-2xl border border-blue-200 bg-blue-50/60">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                Bulk update selected products ({selectedProductIds.size})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={bulkUpdateValues.is_active}
                  onChange={(e) => handleBulkUpdateFieldChange('is_active', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Active Status (No change)</option>
                  <option value="active">Set Active</option>
                  <option value="inactive">Set Inactive</option>
                </select>

                <select
                  value={bulkUpdateValues.department}
                  onChange={(e) => {
                    handleBulkUpdateFieldChange('department', e.target.value);
                    handleBulkUpdateFieldChange('subdepartment', '');
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Department (No change)</option>
                  {departmentEditOptions.map(departmentName => (
                    <option key={departmentName} value={departmentName}>
                      {departmentName}
                    </option>
                  ))}
                </select>

                <select
                  value={bulkUpdateValues.subdepartment}
                  onChange={(e) => handleBulkUpdateFieldChange('subdepartment', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Subdepartment (No change)</option>
                  {(bulkUpdateValues.department
                    ? getSubdepartmentOptionsForDepartment(bulkUpdateValues.department)
                    : Array.from(
                        new Set(
                          departments.flatMap(dept =>
                            (dept.subdepartments || [])
                              .map(subdept => String(subdept.name || '').trim())
                              .filter(Boolean)
                          )
                        )
                      ).sort((a, b) => a.localeCompare(b))
                  ).map(subdepartmentName => (
                    <option key={subdepartmentName} value={subdepartmentName}>
                      {subdepartmentName}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkUpdateValues.original_price}
                  onChange={(e) => handleBulkUpdateFieldChange('original_price', e.target.value)}
                  placeholder="Original Price (No change)"
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkUpdateValues.discount_price}
                  onChange={(e) => handleBulkUpdateFieldChange('discount_price', e.target.value)}
                  placeholder="Discount Price (No change)"
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bulkUpdateValues.stock_quantity}
                  onChange={(e) => handleBulkUpdateFieldChange('stock_quantity', e.target.value)}
                  placeholder="Stock (No change)"
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />

                <button
                  type="button"
                  onClick={handleBulkUpdateSelectedProducts}
                  disabled={isApplyingBulkUpdate}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {isApplyingBulkUpdate ? 'Applying...' : 'Apply Bulk Update'}
                </button>

                <button
                  type="button"
                  onClick={resetBulkUpdateValues}
                  disabled={isApplyingBulkUpdate}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                  Reset Bulk Fields
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={productFilters.search}
              onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search product, description, lookup code"
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />

            <select
              value={productFilters.department}
              onChange={(e) => setProductFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="all">All Departments</option>
              {departmentFilterOptions.map(departmentName => (
                <option key={departmentName} value={departmentName}>
                  {departmentName}
                </option>
              ))}
            </select>

            <select
              value={productFilters.stock}
              onChange={(e) => setProductFilters(prev => ({ ...prev, stock: e.target.value }))}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <button
              type="button"
              onClick={clearProductFilters}
              className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all"
            >
              Clear Filters
            </button>
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                        <div key={subdepartment} className="ml-0 sm:ml-6 mb-6">
                          <h4 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="text-lg">📂</span>
                            {subdepartment}
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                              {grouped[department][subdepartment].length} items
                            </span>
                          </h4>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                            <table className="min-w-[1250px] w-full text-xs sm:text-sm">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="p-3 text-left w-12">Select</th>
                                  <th className="p-3 text-left">Name *</th>
                                  <th className="p-3 text-left">Lookup Code *</th>
                                  <th className="p-3 text-left">Original Price *</th>
                                  <th className="p-3 text-left">Discount Price</th>
                                  <th className="p-3 text-left">Department</th>
                                  <th className="p-3 text-left">Subdepartment</th>
                                  <th className="p-3 text-left">Image URL</th>
                                  <th className="p-3 text-left">Additional Images</th>
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
                                      <input
                                        type="text"
                                        value={product.department || ''}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'department', e.target.value)}
                                        className="w-full min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Department"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="text"
                                        value={product.subdepartment || ''}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'subdepartment', e.target.value)}
                                        className="w-full min-w-[160px] px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Subdepartment"
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <input
                                        type="text"
                                        value={product.image_url || ''}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'image_url', e.target.value)}
                                        className="w-full min-w-[220px] px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="/NirmanHub/Products/... or https://..."
                                      />
                                    </td>
                                    <td className="p-3 align-top">
                                      <textarea
                                        value={Array.isArray(product.additional_images) ? product.additional_images.join(', ') : (product.additional_images || '')}
                                        onChange={(e) => updateExcelRow(product.originalIndex, 'additional_images', e.target.value)}
                                        className="w-full min-w-[240px] px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                        placeholder="Comma-separated additional image URLs"
                                      />
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
              <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50">
                <button
                  onClick={() => {
                    setShowExcelImport(false);
                    setValidationResults([]);
                    setSelectedItems(new Set());
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isImporting || selectedItems.size === 0 || validationResults.filter((p, i) => p.isValid && selectedItems.has(i)).length === 0}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* 
                 Price */}
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

                {/* Active / Featured Status */}
                <div className="space-y-3">
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured_model"
                      checked={formData.featured_model}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <span className="text-sm font-semibold text-slate-700">Show in Featured Models</span>
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
                            src={resolveAssetSrc(preview)} 
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
              <p className="px-4 pt-3 text-xs text-slate-500 sm:hidden">Swipe left/right to view all columns</p>
              {itemProducts.length > 0 && (
                <table className="min-w-[1080px] w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 w-12">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => toggleSelectAllProducts(e.target.checked, paginatedItemProducts)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 w-16">Image</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 max-w-[200px]">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Featured</span>
                          {!isFeaturedEditMode ? (
                            <button
                              type="button"
                              onClick={startFeaturedEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit featured products"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={saveFeaturedUpdates}
                                disabled={isSavingFeatured}
                                className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                title="Save featured changes"
                              >
                                {isSavingFeatured ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelFeaturedEditMode}
                                disabled={isSavingFeatured}
                                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                title="Cancel featured changes"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Active</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Department</span>
                          {!isDeptSubdeptEditMode ? (
                            <button
                              type="button"
                              onClick={startDeptSubdeptEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit department and subdepartment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={saveDeptSubdeptUpdates}
                                disabled={isSavingDeptSubdept}
                                className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                title="Save department changes"
                              >
                                {isSavingDeptSubdept ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelDeptSubdeptEditMode}
                                disabled={isSavingDeptSubdept}
                                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                title="Cancel department changes"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Subdepartment</span>
                          {!isDeptSubdeptEditMode && (
                            <button
                              type="button"
                              onClick={startDeptSubdeptEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit department and subdepartment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Original Price</span>
                          {!isPriceStockEditMode ? (
                            <button
                              type="button"
                              onClick={startPriceStockEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit original price, discount price, and stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={savePriceStockUpdates}
                                disabled={isSavingPriceStock}
                                className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                title="Save price and stock changes"
                              >
                                {isSavingPriceStock ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelPriceStockEditMode}
                                disabled={isSavingPriceStock}
                                className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                title="Cancel price and stock changes"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Discount Price</span>
                          {!isPriceStockEditMode && (
                            <button
                              type="button"
                              onClick={startPriceStockEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit original price, discount price, and stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">Discount %</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Stock</span>
                          {!isPriceStockEditMode && (
                            <button
                              type="button"
                              onClick={startPriceStockEditMode}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit original price, discount price, and stock"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItemProducts.map(product => {
                      const draft = deptSubdeptEdits[product.id] || {};
                      const productDepartment = isDeptSubdeptEditMode
                        ? String(draft.department ?? getProductDepartment(product))
                        : getProductDepartment(product);
                      const productSubdepartment = isDeptSubdeptEditMode
                        ? String(draft.subdepartment ?? getProductSubdepartment(product))
                        : getProductSubdepartment(product);
                      const priceStockDraft = priceStockEdits[product.id] || {};
                      const currentOriginalPrice = isPriceStockEditMode
                        ? String(priceStockDraft.original_price ?? getProductOriginalPrice(product))
                        : getProductOriginalPrice(product);
                      const currentDiscountPrice = isPriceStockEditMode
                        ? String(priceStockDraft.discount_price ?? getProductDiscountPrice(product))
                        : getProductDiscountPrice(product);
                      const currentStockQuantity = isPriceStockEditMode
                        ? String(priceStockDraft.stock_quantity ?? getProductStockQuantity(product))
                        : getProductStockQuantity(product);
                      const discountPercent = Number(currentOriginalPrice) > 0 && Number(currentDiscountPrice) > 0
                        ? Math.round(((Number(currentOriginalPrice) - Number(currentDiscountPrice)) / Number(currentOriginalPrice)) * 100)
                        : 0;
                      const currentFeatured = isFeaturedEditMode
                        ? Boolean(featuredEdits[product.id])
                        : getProductFeatured(product);
                      return (
                      <tr
                        key={product.id}
                        onDoubleClick={() => {
                          if (!isDeptSubdeptEditMode && !isPriceStockEditMode && !isFeaturedEditMode) {
                            handleEditProduct(product);
                          }
                        }}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        title="Double click to edit product"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 w-16">
                          {product.image_url ? (
                            <img src={resolveAssetSrc(product.image_url)} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
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
                        <td className="py-3 px-4" onDoubleClick={(e) => e.stopPropagation()}>
                          {isFeaturedEditMode ? (
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={currentFeatured}
                                onChange={(e) => handleFeaturedDraftChange(product.id, e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700">Featured</span>
                            </label>
                          ) : currentFeatured ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                              Featured
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4" onDoubleClick={(e) => e.stopPropagation()}>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={getProductIsActive(product)}
                              onChange={(e) => handleToggleSingleProductActive(product, e.target.checked)}
                              disabled={activeUpdateLoadingIds.has(product.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            />
                            <span className={`text-xs font-semibold ${getProductIsActive(product) ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {getProductIsActive(product) ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3 px-4" onDoubleClick={(e) => e.stopPropagation()}>
                          {isDeptSubdeptEditMode ? (
                            <select
                              value={productDepartment}
                              onChange={(e) => handleDeptSubdeptDraftChange(product.id, 'department', e.target.value)}
                              className="w-full min-w-[140px] px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                            >
                              <option value="Others">Others</option>
                              {departmentEditOptions.map(departmentName => (
                                <option key={departmentName} value={departmentName}>
                                  {departmentName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-700 font-medium">{productDepartment}</span>
                          )}
                        </td>
                        <td className="py-3 px-4" onDoubleClick={(e) => e.stopPropagation()}>
                          {isDeptSubdeptEditMode ? (
                            <select
                              value={productSubdepartment}
                              onChange={(e) => handleDeptSubdeptDraftChange(product.id, 'subdepartment', e.target.value)}
                              className="w-full min-w-[140px] px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                            >
                              <option value="Others">Others</option>
                              {getSubdepartmentOptionsForDepartment(productDepartment).map(subdepartmentName => (
                                <option key={subdepartmentName} value={subdepartmentName}>
                                  {subdepartmentName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-700 font-medium">{productSubdepartment}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isPriceStockEditMode ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentOriginalPrice}
                              onChange={(e) => handlePriceStockDraftChange(product.id, 'original_price', e.target.value)}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="w-full min-w-[120px] px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900">₹{getProductOriginalPrice(product)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isPriceStockEditMode ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentDiscountPrice}
                              onChange={(e) => handlePriceStockDraftChange(product.id, 'discount_price', e.target.value)}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="w-full min-w-[120px] px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                            />
                          ) : (
                            <>
                              {getProductDiscountPrice(product) > 0 ? (
                                <span className="font-semibold text-green-600">₹{getProductDiscountPrice(product)}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </>
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
                          {isPriceStockEditMode ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={currentStockQuantity}
                              onChange={(e) => handlePriceStockDraftChange(product.id, 'stock_quantity', e.target.value)}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="w-full min-w-[100px] px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                            />
                          ) : (
                            <span className={`font-semibold ${getProductStockQuantity(product) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {getProductStockQuantity(product)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )})}
                    {filteredItemProducts.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-500 font-medium">
                          No products match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {filteredItemProducts.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Showing {pageStartIndex + 1} to {Math.min(pageStartIndex + paginatedItemProducts.length, filteredItemProducts.length)} of {filteredItemProducts.length} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPageSafe === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-slate-700">
                    Page {currentPageSafe} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPageSafe === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoadingData && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading products...</p>
          </div>
        )}

        {!isLoadingData && itemProducts.length === 0 && !showForm && (
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-900">Department Management</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/products/review')}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Review Products
                  </button>
                  <button
                    onClick={() => setShowDepartmentForm(!showDepartmentForm)}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Department
                  </button>
                </div>
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
                <p className="px-4 pt-3 text-xs text-slate-500 sm:hidden">Swipe left/right to view all columns</p>
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
                  <table className="min-w-[720px] w-full text-sm">
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
                                    <span className="text-xl">{getDepartmentIcon(dept.name, dept.item_details_data?.icon)}</span>
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
      
      {/* SVG Generator Modal */}
      <SvgGenerator 
        isOpen={showSvgGenerator} 
        onClose={() => setShowSvgGenerator(false)} 
        showToast={showToast}
      />

      {/* Product Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">
                {deleteTarget.ids?.length > 1 ? 'Delete Products' : 'Delete Product'}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.label}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {isDeletingProduct ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
