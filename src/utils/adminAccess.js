export const ADMIN_EMAILS = [
  'ajithreddy478@gmail.com',
  'reddybhagya742@gmail.com'
];

export const isAdminEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
};
