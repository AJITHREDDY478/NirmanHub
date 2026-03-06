import { supabase } from './supabase';

const CUSTOM_ORDER_BUCKET = 'NirmanHub';

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const uploadCustomOrderFiles = async (files, submittedByUserId) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const ownerFolder = submittedByUserId || 'guest';
  const uploadedFiles = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileName = `${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
    const filePath = `custom-orders/${ownerFolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(CUSTOM_ORDER_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(CUSTOM_ORDER_BUCKET)
      .getPublicUrl(filePath);

    uploadedFiles.push({
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath,
      url: publicUrl
    });
  }

  return uploadedFiles;
};

const toUiOrder = (row) => ({
  id: row.id,
  createdAt: row.created_at,
  sourceProduct: row.source_product_name
    ? {
        id: row.source_product_id,
        name: row.source_product_name
      }
    : null,
  formData: {
    name: row.customer_name || '',
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    category: row.category || '',
    quantity: row.quantity != null ? String(row.quantity) : '1',
    budget: row.budget || '',
    deadline: row.deadline || '',
    dimensions: row.dimensions || '',
    material: row.material || '',
    color: row.color || '',
    description: row.description || '',
    notes: row.notes || ''
  },
  files: Array.isArray(row.files) ? row.files : []
});

export const getCustomOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('custom_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(toUiOrder),
      error: null
    };
  } catch (error) {
    console.error('Failed to fetch custom orders:', error);
    return { data: [], error };
  }
};

export const createCustomOrder = async ({ formData, files, sourceProduct }) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const submittedByUserId = authData?.user?.id || null;
    const uploadedFiles = await uploadCustomOrderFiles(files, submittedByUserId);

    const payload = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone || null,
      category: formData.category || null,
      quantity: Number(formData.quantity || 1),
      budget: formData.budget || null,
      deadline: formData.deadline || null,
      dimensions: formData.dimensions || null,
      material: formData.material || null,
      color: formData.color || null,
      description: formData.description,
      notes: formData.notes || null,
      source_product_id: sourceProduct?.id || null,
      source_product_name: sourceProduct?.name || null,
      submitted_by_user_id: submittedByUserId,
      files: uploadedFiles
    };

    const { data, error } = await supabase
      .from('custom_orders')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;

    return { data: toUiOrder(data), error: null };
  } catch (error) {
    console.error('Failed to create custom order:', error);
    return { data: null, error };
  }
};