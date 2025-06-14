// src/pages/api/banner.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

const BUCKET_NAME = 'images';
const FOLDER = 'banner';

// Helper untuk parse path dari URL Storage
function parsePathFromUrl(url: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const baseUrl = `${import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;
  if (url.startsWith(baseUrl)) {
    return url.substring(baseUrl.length);
  }
  return null;
}

// Handle POST (Create/Update)
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string | null;
  const nama = formData.get('nama') as string;
  const old_gambar = formData.get('old_gambar') as string | null;
  const file = formData.get('gambar') as File | null;

  let gambarUrl: string | null = old_gambar;

  // Jika ada file baru di-upload
  if (file) {
    const fileExt = file.name.split('.').pop();
    const safeName = nama.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const filePath = `${FOLDER}/${safeName}-${Date.now()}.${fileExt}`;

    // Upload ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      return new Response(JSON.stringify({ message: `Gagal upload gambar: ${uploadError.message}` }), { status: 500 });
    }

    // Dapatkan public URL
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    gambarUrl = data.publicUrl;

    // Jika ini adalah edit dan ada gambar lama, hapus gambar lama dari storage
    if (id && old_gambar) {
      const oldPath = parsePathFromUrl(old_gambar);
      if(oldPath) {
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        if (deleteError) console.warn('Gagal hapus file lama:', deleteError.message);
      }
    }
  }

  if (id) {
    // --- UPDATE ---
    const { error } = await supabase
      .from('banner')
      .update({ nama, gambar: gambarUrl })
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ message: `Gagal update banner: ${error.message}` }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Banner berhasil diupdate' }), { status: 200 });

  } else {
    // --- CREATE ---
    const { error } = await supabase
      .from('banner')
      .insert({ nama, gambar: gambarUrl });

    if (error) {
      return new Response(JSON.stringify({ message: `Gagal menambah banner: ${error.message}` }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Banner berhasil ditambahkan' }), { status: 201 });
  }
};


// Handle DELETE
export const DELETE: APIRoute = async ({ request }) => {
  const { id, gambar } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ message: 'ID tidak ditemukan' }), { status: 400 });
  }

  // Hapus dari tabel
  const { error: dbError } = await supabase
    .from('banner')
    .delete()
    .eq('id', id);

  if (dbError) {
    return new Response(JSON.stringify({ message: `Gagal hapus data: ${dbError.message}` }), { status: 500 });
  }

  // Hapus file dari storage jika ada
  if (gambar) {
    const path = parsePathFromUrl(gambar);
    if(path) {
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([path]);
        if (storageError) console.warn('Gagal hapus file dari storage:', storageError.message);
    }
  }

  return new Response(JSON.stringify({ message: 'Banner berhasil dihapus' }), { status: 200 });
};