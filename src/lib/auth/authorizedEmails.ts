/**
 * Lista de emails autorizados - método más directo
 * Modifica esta lista para agregar/quitar usuarios autorizados
 */

export const AUTHORIZED_EMAILS = [
  'ariel.chicho@daleplayrecords.com',
  'arichicho1@gmail.com'
];

export const isEmailAuthorized = (email: string | null): boolean => {
  if (!email) {
    return false;
  }
  
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
};