import { apiFetch } from '@/lib/http/apiFetch';

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
