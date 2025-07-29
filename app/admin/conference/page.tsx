import { redirect } from 'next/navigation';

export default function AdminConferenceIndexPage() {
  redirect('/admin/conference/dashboard');
  return null;
}
