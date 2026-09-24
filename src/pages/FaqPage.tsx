import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const categories = [
    {
      title: 'Pemesanan & Pembayaran',
      items: [
        {
          q: 'Bagaimana cara berbelanja di Saena.id?',
          a: 'Pilih model busana yang Anda sukai, tentukan warna dan ukuran yang diinginkan, klik Tambah ke Keranjang, lalu lanjutkan ke halaman Checkout. Anda bisa berbelanja langsung sebagai guest tanpa wajib mendaftar akun terlebih dahulu.'
        },
        {
          q: 'Apakah pembayaran di Saena.id aman?',
          a: 'Sangat aman. Seluruh transaksi menggunakan gerbang pembayaran berlisensi DOKU Jokul yang terenkripsi dan terhubung langsung dengan sistem perbankan nasional (BCA, Mandiri, BRI, BNI) serta QRIS.'
        },
        {
          q: 'Berapa batas waktu transfer setelah pesanan dibuat?',
          a: 'Batas waktu pembayaran adalah 2 jam sejak invoice terbit. Jika melebihi batas waktu, pesanan akan kadaluarsa otomatis dan stok akan dikembalikan ke etalase toko.'
        }
      ]
    },
    {
      title: 'Pengiriman & Resi',
      items: [
        {
          q: 'Kurir apa yang digunakan oleh Saena.id?',
          a: 'Kami bekerjasama resmi dengan agregator logistik Mengantar yang mencakup ekspedisi terpercaya seperti JNE, SiCepat, dan J&T Express dengan jangkauan ke seluruh kecamatan di Indonesia.'
        },
        {
          q: 'Bagaimana cara melacak posisi paket saya?',
          a: 'Setelah pembayaran terverifikasi, nomor resi kurir Mengantar akan diterbitkan. Anda dapat memasukkan nomor pesanan di menu Lacak Pesanan pada navigasi kami untuk melihat riwayat checkpoint perjalanan paket.'
        },
        {
          q: 'Berapa ongkos kirim ke alamat saya?',
          a: 'Ongkos kirim dihitung otomatis secara transparan saat Anda mengisi provinsi, kota, dan kecamatan pada halaman Checkout.'
        }
      ]
    },
    {
      title: 'Bahan, Ukuran & Garansi',
      items: [
        {
          q: 'Apakah bahan gamis dan dress Saena menerawang?',
          a: 'Tidak. Seluruh busana kami didesain syar\'i dengan kain berkarakter jatuh dan tidak menerawang, serta dilengkapi furing katun lembut khusus untuk bahan ceruty atau sifon plisket.'
        },
        {
          q: 'Bagaimana jika ukuran baju yang saya beli kebesaran atau kekecilan?',
          a: 'Kami memberikan garansi penukaran ukuran maksimal 3 hari setelah status paket diterima menurut resi kurir Mengantar. Tag label wajib utuh dan produk belum dicuci.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Pusat Bantuan</span>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Pertanyaan yang Sering Diajukan</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Temukan jawaban cepat seputar pemesanan busana, pembayaran DOKU, dan pengiriman kurir Mengantar.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-slate-900 border-b border-stone-200 pb-2">
              {cat.title}
            </h2>
            <div className="space-y-2">
              {cat.items.map((item, itemIdx) => {
                const uniqueKey = catIdx * 10 + itemIdx;
                const isOpen = openIdx === uniqueKey;
                return (
                  <div
                    key={itemIdx}
                    className="border border-stone-200 rounded-xl bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : uniqueKey)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:text-blue-900"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-900' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-stone-100 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
