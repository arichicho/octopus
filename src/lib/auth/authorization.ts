/**
 * Sistema de autorización de usuarios
 */

export const isEmailAuthorized = (email: string | null): boolean => {
  console.log('🔍 Checking authorization for email:', email);
  
  if (!email) {
    console.log('❌ No email provided');
    return false;
  }
  
  const authorizedEmails = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS;
  console.log('📋 Authorized emails from env:', authorizedEmails);
  
  if (!authorizedEmails) {
    console.log('❌ No authorized emails configured');
    return false;
  }
  
  const emailList = authorizedEmails.split(',').map(email => email.trim().toLowerCase());
  console.log('📝 Email list:', emailList);
  console.log('🔍 Looking for:', email.toLowerCase());
  
  const isAuthorized = emailList.includes(email.toLowerCase());
  console.log('✅ Authorization result:', isAuthorized);
  
  return isAuthorized;
};

export const getAuthorizedEmails = (): string[] => {
  const authorizedEmails = process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS;
  if (!authorizedEmails) return [];
  
  return authorizedEmails.split(',').map(email => email.trim());
};