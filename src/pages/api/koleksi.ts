// src/pages/api/koleksi.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

const BUCKET_NAME = 'images';
const FOLDER = 'koleksi';

// Helper untuk parse path dari URL Storage
function parsePathFromUrl(url: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  // Cari posisi '/images/' lalu ambil sisanya
  const pathStartIndex = url.indexOf(`/${BUCKET_NAME}/`);
  if (pathStartIndex === -1) return null;
  
  return url.substring(pathStartIndex + 1); // Hasilnya 'images/koleksi/file.png'
}

// Handle POST (untuk Update)
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string | null;
  const nama = formData.get('nama') as string;
  const old_gambar_url = formData.get('old_gambar') as string | null;
  const file = formData.get('gambar') as File | null;

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID Koleksi wajib diisi.' }), { status: 400 });
  }

  const updateData: { nama: string; gambar?: string } = { nama };
  
  // Jika ada file baru yang di-upload
  if (file) {
    const fileExt = file.name.split('.').pop();
    const safeName = nama.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const filePath = `${FOLDER}/${safeName}-${Date.now()}.${fileExt}`;

    // 1. Upload file baru
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      return new Response(JSON.stringify({ message: `Gagal upload gambar: ${uploadError.message}` }), { status: 500 });
    }

    // 2. Dapatkan URL publik dari file baru
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    updateData.gambar = data.publicUrl;

    // 3. Hapus file lama jika ada
    if (old_gambar_url) {
      const oldPath = parsePathFromUrl(old_gambar_url);
      if (oldPath) {
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([oldPath.substring(oldPath.indexOf('/') + 1)]); // Hapus 'images/' dari path
        if (deleteError) {
          // Jangan gagalkan proses utama, cukup catat di log server
          console.warn(`Gagal hapus file lama di storage: ${deleteError.message}`);
        }
      }
    }
  }

  // 4. Update record di database
  const { error: dbError } = await supabase
    .from('koleksi')
    .update(updateData)
    .eq('id', id);

  if (dbError) {
    return new Response(JSON.stringify({ message: `Gagal update database: ${dbError.message}` }), { status: 500 });
  }

  return new Response(JSON.stringify({ message: 'Koleksi berhasil diupdate' }), { status: 200 });
};