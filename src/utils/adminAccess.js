import { CONFIG, isAdminEmail as checkIsAdminEmail } from './config';

// Re-export for backward compatibility
export const ADMIN_EMAILS = CONFIG.adminEmails;

export const isAdminEmail = checkIsAdminEmail;
