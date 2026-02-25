import { supabase } from './supabase';

/**
 * Get all public products (items)
 */
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('type', 'Item')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to match UI expected format
    const products = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      price: item.discount_price || item.original_price,
      originalPrice: item.discount_price ? item.original_price : null,
      description: item.description,
      department: item.item_details_data?.department || 'General',
      subcategory: item.item_details_data?.subcategory || 'Other',
      category: item.item_details_data?.category || item.item_details_data?.department || 'General',
      emoji: item.item_details_data?.emoji || '📦',
      image: item.image_url,
      isNew: item.item_details_data?.isNew || false,
      rating: item.item_details_data?.rating || 4.5,
      reviews: item.item_details_data?.reviews || 0,
      // Pass through structured specifications/customization so UI can read them
      specifications: item.item_details_data?.specifications || null,
      customizationOptions: item.item_details_data?.customizationOptions || null,
      whyChoose: item.item_details_data?.whyChoose || null,
      stock: item.stock_quantity,
      printingTime: item.printing_time
    }));
    
    return { data: products, error: null };
  } catch (error) {
    console.error('Error fetching all products:', error);
    return { data: [], error };
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('id', productId)
      .eq('type', 'Item')
      .single();

    if (error) throw error;
    
    if (!data) return { data: null, error: null };
    
    // Transform to match UI expected format
    const product = {
      id: data.id,
      lookupCode: data.lookup_code,
      name: data.name,
      price: data.discount_price || data.original_price,
      originalPrice: data.discount_price ? data.original_price : null,
      description: data.description,
      department: data.item_details_data?.department || 'General',
      subcategory: data.item_details_data?.subcategory || 'Other',
      category: data.item_details_data?.category || data.item_details_data?.department || 'General',
      emoji: data.item_details_data?.emoji || '📦',
      image: data.image_url,
      additionalImages: data.item_details_data?.additionalImages || [],
      isNew: data.item_details_data?.isNew || false,
      rating: data.item_details_data?.rating || 4.5,
      reviews: data.item_details_data?.reviews || 0,
      specifications: data.item_details_data?.specifications || null,
      customizationOptions: data.item_details_data?.customizationOptions || null,
      whyChoose: data.item_details_data?.whyChoose || null,
      stock: data.stock_quantity,
      printingTime: data.printing_time
    };
    
    return { data: product, error: null };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return { data: null, error };
  }
};

/**
 * Search products by name or description
 */
export const searchProducts = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('type', 'Item')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform to match UI expected format
    const products = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      price: item.discount_price || item.original_price,
      originalPrice: item.discount_price ? item.original_price : null,
      description: item.description,
      department: item.item_details_data?.department || 'General',
      subcategory: item.item_details_data?.subcategory || 'Other',
      category: item.item_details_data?.category || item.item_details_data?.department || 'General',
      emoji: item.item_details_data?.emoji || '📦',
      image: item.image_url,
      isNew: item.item_details_data?.isNew || false,
      rating: item.item_details_data?.rating || 4.5,
      reviews: item.item_details_data?.reviews || 0,
      specifications: item.item_details_data?.specifications || null,
      customizationOptions: item.item_details_data?.customizationOptions || null,
      whyChoose: item.item_details_data?.whyChoose || null,
      stock: item.stock_quantity,
      printingTime: item.printing_time
    }));
    
    return { data: products, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: [], error };
  }
};

/**
 * Get products by department
 */
export const getProductsByDepartment = async (departmentName) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('type', 'Item')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter by department from item_details_data
    const filteredData = (data || []).filter(item => 
      item.item_details_data?.department?.toLowerCase() === departmentName.toLowerCase()
    );
    
    // Transform to match UI expected format
    const products = filteredData.map(item => ({
      id: item.id,
      name: item.name,
      price: item.discount_price || item.original_price,
      originalPrice: item.discount_price ? item.original_price : null,
      description: item.description,
      department: item.item_details_data?.department || 'General',
      subcategory: item.item_details_data?.subcategory || 'Other',
      category: item.item_details_data?.category || item.item_details_data?.department || 'General',
      emoji: item.item_details_data?.emoji || '📦',
      image: item.image_url,
      isNew: item.item_details_data?.isNew || false,
      rating: item.item_details_data?.rating || 4.5,
      reviews: item.item_details_data?.reviews || 0,
      stock: item.stock_quantity,
      printingTime: item.printing_time
    }));
    
    return { data: products, error: null };
  } catch (error) {
    console.error('Error fetching products by department:', error);
    return { data: [], error };
  }
};

/**
 * Get all departments
 */
export const getAllDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('type', 'DepartmentGroup')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { data: [], error };
  }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (userId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('NirmanHub')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('NirmanHub')
      .getPublicUrl(fileName);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Image upload error:', error);
    return { url: null, error };
  }
};

/**
 * Create a new catalog item
 */
export const createCatalogItem = async (userId, itemData) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .insert([{
        user_id: userId,
        name: itemData.name,
        lookup_code: itemData.lookup_code,
        description: itemData.description,
        type: itemData.type || 'Item',
        parent_id: itemData.parent_id || null,
        item_details_data: itemData.item_details_data || {},
        printing_time: itemData.printing_time || 0,
        original_price: parseFloat(itemData.original_price) || 0,
        discount_price: parseFloat(itemData.discount_price) || 0,
        stock_quantity: parseInt(itemData.stock_quantity) || 0,
        reserved_quantity: 0,
        is_active: itemData.is_active !== false,
        image_url: itemData.image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating catalog item:', error);
    return { data: null, error };
  }
};

/**
 * Get all catalog items for user
 */
export const getUserCatalogItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching catalog items:', error);
    return { data: [], error };
  }
};

/**
 * Get catalog item by ID
 */
export const getCatalogItem = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching catalog item:', error);
    return { data: null, error };
  }
};

/**
 * Update catalog item
 */
export const updateCatalogItem = async (itemId, userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating catalog item:', error);
    return { data: null, error };
  }
};

/**
 * Delete catalog item
 */
export const deleteCatalogItem = async (itemId, userId) => {
  try {
    const { error } = await supabase
      .from('catalog_entities')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    return { error };
  }
};

/**
 * Get items by type (DepartmentGroup, CategoryGroup, Item)
 */
export const getItemsByType = async (userId, type) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching items by type:', error);
    return { data: [], error };
  }
};

/**
 * Get items under a parent category
 */
export const getItemsByParent = async (parentId) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching items by parent:', error);
    return { data: [], error };
  }
};

/**
 * Create a department (DepartmentGroup with no parent)
 */
export const createDepartment = async (userId, name, lookupCode, icon = null, imageUrl = null, color = null) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .insert([{
        user_id: userId,
        name,
        lookup_code: lookupCode,
        type: 'DepartmentGroup',
        parent_id: null,
        is_active: true,
        image_url: imageUrl,
        item_details_data: { icon, color },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating department:', error);
    return { data: null, error };
  }
};

/**
 * Create a subdepartment (DepartmentGroup with parent_id)
 */
export const createSubdepartment = async (userId, name, lookupCode, parentDepartmentId) => {
  try {
    const { data, error } = await supabase
      .from('catalog_entities')
      .insert([{
        user_id: userId,
        name,
        lookup_code: lookupCode,
        type: 'DepartmentGroup',
        parent_id: parentDepartmentId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating subdepartment:', error);
    return { data: null, error };
  }
};

/**
 * Get department hierarchy for user
 * Returns departments with their subdepartments nested
 */
export const getDepartmentHierarchy = async (userId) => {
  try {
    // Get all departments (no parent)
    const { data: departments, error: deptError } = await supabase
      .from('catalog_entities')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'DepartmentGroup')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (deptError) throw deptError;

    // For each department, get subdepartments
    const hierarchy = await Promise.all(
      departments.map(async (dept) => {
        const { data: subdepts, error: subError } = await supabase
          .from('catalog_entities')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'DepartmentGroup')
          .eq('parent_id', dept.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (subError) throw subError;

        return {
          ...dept,
          subdepartments: subdepts || []
        };
      })
    );

    return { data: hierarchy, error: null };
  } catch (error) {
    console.error('Error fetching department hierarchy:', error);
    return { data: [], error };
  }
};

/**
 * Find subdepartment ID by department and subdepartment names
 */
export const findSubdepartmentId = async (userId, departmentName, subdepartmentName) => {
  try {
    // First find the department
    const { data: dept, error: deptError } = await supabase
      .from('catalog_entities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'DepartmentGroup')
      .eq('name', departmentName)
      .is('parent_id', null)
      .single();

    if (deptError || !dept) return { data: null, error: deptError };

    // Then find the subdepartment under that department
    const { data: subdept, error: subError } = await supabase
      .from('catalog_entities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'DepartmentGroup')
      .eq('name', subdepartmentName)
      .eq('parent_id', dept.id)
      .single();

    if (subError) return { data: null, error: subError };

    return { data: subdept?.id || null, error: null };
  } catch (error) {
    console.error('Error finding subdepartment:', error);
    return { data: null, error };
  }
};

/**
 * Get the next incremental product lookup code
 * Returns codes like PROD-0001, PROD-0002, etc.
 * Checks database for existing codes and finds the next available one
 */
export const getNextProductLookupCode = async () => {
  try {
    // Get all existing product lookup codes that match PROD-XXXX pattern
    const { data, error } = await supabase
      .from('catalog_entities')
      .select('lookup_code')
      .like('lookup_code', 'PROD-%');

    if (error) throw error;

    // Build a Set of existing codes for quick lookup
    const existingCodes = new Set();
    let maxNumber = 0;
    
    if (data && data.length > 0) {
      for (const item of data) {
        existingCodes.add(item.lookup_code);
        const match = item.lookup_code.match(/PROD-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    // Start from max + 1 and find the next available code
    let nextNumber = maxNumber + 1;
    let nextCode = `PROD-${String(nextNumber).padStart(4, '0')}`;
    
    // Keep incrementing if code already exists (handles edge cases/gaps)
    while (existingCodes.has(nextCode)) {
      nextNumber++;
      nextCode = `PROD-${String(nextNumber).padStart(4, '0')}`;
    }

    return { data: nextCode, error: null };
  } catch (error) {
    console.error('Error generating next product lookup code:', error);
    // Fallback to timestamp-based code if there's an error
    return { data: `PROD-${Date.now()}`, error };
  }
};
