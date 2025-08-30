import { createInvitation, getInvitation, updateInvitation } from '../firebase/firestore';
import { Invitation } from '../firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

export const createUserInvitation = async (
  email: string,
  companies: Array<{ companyId: string; role: 'admin' | 'editor' | 'viewer' }>,
  invitedBy: string
): Promise<{ id: string; token: string }> => {
  const token = uuidv4();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now

  const invitationData: Omit<Invitation, 'id' | 'createdAt'> = {
    email,
    companies,
    invitedBy,
    status: 'pending',
    expiresAt,
  };

  const { id } = await createInvitation(invitationData);
  
  // In a real app, you would send an email here
  console.log(`Invitation created for ${email} with token: ${token}`);
  
  return { id, token };
};

export const validateInvitation = async (token: string): Promise<Invitation | null> => {
  // In a real implementation, you would validate the token
  // For now, we'll simulate this
  const invitation = await getInvitation(token);
  
  if (!invitation) {
    return null;
  }

  if (invitation.status !== 'pending') {
    throw new Error('Invitation already used or expired');
  }

  if (invitation.expiresAt.toDate() < new Date()) {
    await updateInvitation(token, { status: 'expired' });
    throw new Error('Invitation has expired');
  }

  return invitation;
};

export const acceptInvitation = async (token: string, userId: string): Promise<void> => {
  await updateInvitation(token, { 
    status: 'accepted' 
  });
  
  // Here you would also update the user's companies
  console.log(`Invitation ${token} accepted by user ${userId}`);
};

export const sendInvitationEmail = async (
  email: string,
  invitationUrl: string,
  invitedBy: string,
  companies: string[]
): Promise<void> => {
  // In a real app, you would integrate with SendGrid or similar
  console.log(`Sending invitation email to ${email}`);
  console.log(`Invitation URL: ${invitationUrl}`);
  console.log(`Invited by: ${invitedBy}`);
  console.log(`Companies: ${companies.join(', ')}`);
};
