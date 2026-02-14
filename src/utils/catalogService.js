import { supabase } from './supabase';

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (userId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('catalog-images')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('catalog-images')
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
