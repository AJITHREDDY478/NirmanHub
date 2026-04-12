// =====================
// BUSINESS CONFIGURATION
// =====================
// Centralized configuration for all business-related settings
// Update these values to change them across the entire application

export const CONFIG = {
  // Business details
  businessName: 'AR PrintLab',
  businessDescription: '3D Printing Products',
  
  // WhatsApp communication
  whatsappNumber: '9632038829',           // Without country code prefix (will be formatted as 91+ for India)
  whatsappCountryCode: '91',              // India country code
  
  // Contact details
  supportEmail: 'support@arprintlab.com',
  
  // Admin configuration
  adminEmails: [
    'ajithreddy478@gmail.com',
    'reddybhagya742@gmail.com'
  ]
};

// Utility function to get formatted WhatsApp URL
export const getWhatsAppUrl = (message = '') => {
  const fullNumber = `${CONFIG.whatsappCountryCode}${CONFIG.whatsappNumber}`;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${fullNumber}?text=${encodedMsg}`;
};

// Utility to check if email is admin
export const isAdminEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  return CONFIG.adminEmails.includes(normalized);
};
