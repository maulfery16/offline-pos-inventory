import { redirect } from 'next/navigation';

/** /pengaturan redirects to the first sub-page */
export default function PengaturanPage() {
  redirect('/pengaturan/cabang');
}
