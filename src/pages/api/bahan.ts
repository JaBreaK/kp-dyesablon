// src/pages/api/bahan.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

const BUCKET_NAME = 'images';
const FOLDER = 'bahan';

// Helper untuk mengambil path file dari URL lengkap
function parsePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    // Path akan menjadi: /storage/v1/object/public/images/bahan/file.png
    // Kita buang bagian awalnya
    const pathParts = pathname.split(`/${BUCKET_NAME}/`);
    return pathParts[1] ? `${FOLDER}/${pathParts[1].split('/').pop()}` : null;
  } catch (error) {
    console.error('Invalid URL for parsing:', url);
    return null;
  }
}

// Method POST: Untuk Menambah (Create) dan Mengedit (Update)
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string | null;
  const nama = formData.get('nama') as string;
  const desk = formData.get('desk') as string;
  const old_gambar_url = formData.get('old_gambar') as string | null;
  const file = formData.get('gambar') as File | null;

  if (!nama || !desk) {
    return new Response(JSON.stringify({ message: 'Nama dan Deskripsi wajib diisi.' }), { status: 400 });
  }

  let gambarUrl: string | undefined = undefined;

  // Jika ada file baru yang diupload
  if (file) {
    const fileExt = file.name.split('.').pop();
    const safeName = nama.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const filePath = `${FOLDER}/${safeName}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
    if (uploadError) {
      return new Response(JSON.stringify({ message: `Gagal upload gambar: ${uploadError.message}` }), { status: 500 });
    }
    
    gambarUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;
    
    // Jika ini mode edit dan ada file lama, hapus file lama
    if (id && old_gambar_url) {
      const oldPath = parsePathFromUrl(old_gambar_url);
      if (oldPath) {
        await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    }
  }

  // Logika untuk CREATE atau UPDATE
  if (id) {
    // --- UPDATE ---
    const updateData: { nama: string; desk: string; gambar?: string } = { nama, desk };
    if (gambarUrl !== undefined) {
      updateData.gambar = gambarUrl;
    }
    const { error } = await supabase.from('bahan').update(updateData).eq('id', id);
    if (error) {
      return new Response(JSON.stringify({ message: `Database error: ${error.message}` }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Bahan berhasil diupdate' }), { status: 200 });
  } else {
    // --- CREATE ---
    const insertData: { nama: string; desk: string; gambar?: string } = { nama, desk };
    if (gambarUrl !== undefined) {
      insertData.gambar = gambarUrl;
    }
    const { error } = await supabase.from('bahan').insert(insertData);
    if (error) {
      return new Response(JSON.stringify({ message: `Database error: ${error.message}` }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Bahan berhasil ditambahkan' }), { status: 201 });
  }
};

// Method DELETE: Untuk Menghapus
export const DELETE: APIRoute = async ({ request }) => {
  const { id, gambar: gambarUrl } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ message: 'ID tidak ditemukan' }), { status: 400 });
  }

  // 1. Hapus dari tabel
  const { error: dbError } = await supabase.from('bahan').delete().eq('id', id);
  if (dbError) {
    return new Response(JSON.stringify({ message: `Gagal hapus data: ${dbError.message}` }), { status: 500 });
  }

  // 2. Hapus file dari storage jika ada
  if (gambarUrl) {
    const path = parsePathFromUrl(gambarUrl);
    if (path) {
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (storageError) console.warn(`Gagal hapus file storage: ${storageError.message}`);
    }
  }

  return new Response(JSON.stringify({ message: 'Bahan berhasil dihapus' }), { status: 200 });
};