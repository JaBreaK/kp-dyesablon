import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Helper untuk membuat slug dari judul
function slugify(str: string): string {
    return str
        .toString()
        .normalize('NFD') // Normalisasi karakter (misal: é -> e)
        .replace(/[\u0300-\u036f]/g, '') // Hapus diakritik
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Ganti spasi dengan -
        .replace(/[^\w-]+/g, '') // Hapus karakter non-alfanumerik kecuali -
        .replace(/--+/g, '-'); // Ganti -- berurutan dengan satu -
}

// Helper untuk mengambil path file dari URL lengkap Supabase
function parseImagePath(url: string | null): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        // pathname: /storage/v1/object/public/images/produk/file.png
        const parts = urlObject.pathname.split('/');
        
        // Cari posisi bucket 'images' dan ambil semua setelahnya
        const bucketNameIndex = parts.indexOf('images');
        if (bucketNameIndex === -1 || bucketNameIndex + 1 >= parts.length) {
            return null; // Jika bucket 'images' tidak ditemukan
        }
        
        // Mengembalikan "produk/file.png"
        return parts.slice(bucketNameIndex + 1).join('/');
    } catch (e) {
        console.error("URL tidak valid, tidak bisa parse path gambar:", url);
        return null;
    }
}

// =============================================================================
// || METHOD GET: Mengambil detail satu produk untuk form Edit                 ||
// =============================================================================
export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
        return new Response(JSON.stringify({ message: 'ID produk diperlukan' }), { status: 400 });
    }

    const { data, error } = await supabase.from('produk').select('*').eq('id', id).single();
    
    if (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 404 });
    }
    
    return new Response(JSON.stringify(data), { status: 200 });
};

// =============================================================================
// || METHOD POST: Menambah (Create) & Mengupdate (Update) produk             ||
// =============================================================================
export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string | null;
    const nama = formData.get('nama') as string;
    const deskripsi = formData.get('deskripsi') as string;
    const kategori = JSON.parse(formData.get('kategori') as string);
    const file = formData.get('gambar') as File | null;
    const existingImageUrl = formData.get('existing-image-url') as string | null;

    if (!nama || !deskripsi || !kategori) {
        return new Response(JSON.stringify({ message: 'Data nama, deskripsi, dan kategori tidak boleh kosong.' }), { status: 400 });
    }

    const dataToSubmit: {
        nama: string;
        slug: string;
        kategori: any;
        deskripsi: string;
        gambar?: string | null;
    } = {
        nama,
        slug: slugify(nama),
        kategori,
        deskripsi,
    };

    // Jika ada file baru yang di-upload, proses penggantian gambar
    if (file && file.size > 0) {
        // Hapus gambar lama dari storage jika ada
        if (existingImageUrl) {
            const oldPath = parseImagePath(existingImageUrl);
            if (oldPath) {
                console.log(`Mencoba menghapus file lama: ${oldPath}`);
                const { error: deleteError } = await supabase.storage.from("images").remove([oldPath]);
                if (deleteError) {
                    console.warn(`PERINGATAN: Gagal hapus file lama, tapi proses lanjut. Error: ${deleteError.message}`);
                }
            }
        }
        
        // Upload gambar baru
        const newPath = `produk/${Date.now()}_${slugify(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(newPath, file);
        if (uploadError) {
            return new Response(JSON.stringify({ message: `Gagal upload gambar: ${uploadError.message}` }), { status: 500 });
        }
        
        // Tambahkan URL gambar baru ke data yang akan disubmit
        dataToSubmit.gambar = supabase.storage.from("images").getPublicUrl(newPath).data.publicUrl;
    } else if (id) {
        // Jika ini mode UPDATE dan TIDAK ada file baru, pastikan gambar lama tetap tersimpan
        dataToSubmit.gambar = existingImageUrl;
    }

    // Kirim data ke Supabase
    if (id) { // --- UPDATE ---
        const { error } = await supabase.from("produk").update(dataToSubmit).eq("id", id);
        if (error) return new Response(JSON.stringify({ message: `Gagal update database: ${error.message}` }), { status: 500 });
        return new Response(JSON.stringify({ message: 'Produk berhasil diperbarui!' }), { status: 200 });
    } else { // --- CREATE ---
        const { error } = await supabase.from("produk").insert([dataToSubmit]);
        if (error) return new Response(JSON.stringify({ message: `Gagal membuat produk: ${error.message}` }), { status: 500 });
        return new Response(JSON.stringify({ message: 'Produk berhasil ditambahkan!' }), { status: 201 });
    }
};

// =============================================================================
// || METHOD DELETE: Menghapus produk                                         ||
// =============================================================================
export const DELETE: APIRoute = async ({ request }) => {
    const { id, gambar: gambarUrl } = await request.json();

    if (!id) {
        return new Response(JSON.stringify({ message: 'ID produk diperlukan' }), { status: 400 });
    }

    // Hapus record dari database terlebih dahulu
    const { error: dbError } = await supabase.from("produk").delete().eq("id", id);
    if (dbError) {
        return new Response(JSON.stringify({ message: `Gagal hapus dari database: ${dbError.message}` }), { status: 500 });
    }
    
    // Hapus file dari storage jika URL-nya ada
    if (gambarUrl) {
        const path = parseImagePath(gambarUrl);
        if (path) {
            // Biarkan proses ini berjalan di background, tidak perlu ditunggu (await)
            supabase.storage.from("images").remove([path]).catch(storageError => {
                console.warn(`Gagal hapus file di storage (tapi record DB sudah dihapus): ${storageError.message}`);
            });
        }
    }
    
    return new Response(JSON.stringify({ message: 'Produk berhasil dihapus' }), { status: 200 });
};