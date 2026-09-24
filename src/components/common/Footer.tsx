import React from 'react';
import { ShieldCheck, Truck, Clock, RefreshCw, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-stone-200 mt-20 pb-16 lg:pb-8">
      {/* 4 Brand Value Pillars */}
      <div className="border-b border-stone-100 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Pembayaran Aman</h4>
                <p className="text-xs text-slate-500 mt-0.5">Diverifikasi otomatis dengan gateway resmi DOKU.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Pengiriman Mengantar</h4>
                <p className="text-xs text-slate-500 mt-0.5">Jangkauan multi-kurir seluruh Indonesia & tracking real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Garansi Kualitas 100%</h4>
                <p className="text-xs text-slate-500 mt-0.5">Kain adem premium, jahitan butik, dan no-terawang.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Customer Care Sigap</h4>
                <p className="text-xs text-slate-500 mt-0.5">Konsultasi ukuran & panduan belanja via WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Sitemap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Saena<span className="text-amber-600 font-sans text-xl font-semibold">.id</span>
            </span>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Online shop busana muslim Indonesia yang modern, anggun, dan ramah. Menghadirkan gamis syar'i, dress plisket, mukena sutra, hijab voal, dan homewear daster elegan untuk muslimah percaya diri.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>📍 Wisma Saena, Jl. TB Simatupang No. 88, Jakarta Selatan</p>
              <p>📱 WhatsApp CS: +62 812-3456-7890</p>
              <p>✉️ Email: salam@saena.id</p>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Koleksi Busana
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <button onClick={() => onNavigate('/kategori/gamis')} className="hover:text-blue-900 transition-colors">
                  Gamis Syar'i
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/kategori/dress-muslim')} className="hover:text-blue-900 transition-colors">
                  Dress Muslim
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/kategori/mukena')} className="hover:text-blue-900 transition-colors">
                  Mukena Armani Silk
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/kategori/hijab')} className="hover:text-blue-900 transition-colors">
                  Voal & Hijab Paris
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/kategori/daster')} className="hover:text-blue-900 transition-colors">
                  Daster Chic Modern
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/kategori/setelan')} className="hover:text-blue-900 transition-colors">
                  Setelan Tunic & Kulot
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Bantuan & Layanan
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <button onClick={() => onNavigate('/order/SAENA-20260920-0088')} className="hover:text-blue-900 transition-colors text-left">
                  Lacak Pengiriman Pesanan
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-blue-900 transition-colors">
                  Tanya Jawab (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-blue-900 transition-colors">
                  Kontak Customer Care
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-blue-900 transition-colors">
                  Tentang Saena.id
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/account')} className="hover:text-blue-900 transition-colors">
                  Akun & Riwayat Belanja
                </button>
              </li>
            </ul>
          </div>

          {/* Integration Badges */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Mitra Pembayaran & Kurir
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Payment Gateway Resmi:</p>
                <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-stone-200">DOKU</span>
                  <span className="text-[11px] font-semibold text-slate-600">BCA VA</span>
                  <span className="text-[11px] font-semibold text-slate-600">Mandiri</span>
                  <span className="text-[11px] font-semibold text-slate-600">BRI</span>
                  <span className="text-[11px] font-semibold text-slate-600">QRIS</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Logistik Terintegrasi:</p>
                <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-stone-200">Mengantar</span>
                  <span className="text-[11px] font-semibold text-slate-600">SiCepat</span>
                  <span className="text-[11px] font-semibold text-slate-600">JNE</span>
                  <span className="text-[11px] font-semibold text-slate-600">J&T</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Admin Link */}
        <div className="border-t border-stone-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Saena.id · Busana Muslim Indonesia Modern. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Privasi & Keamanan Data</span>
            <span>·</span>
            <span>Syarat & Ketentuan</span>
            <span>·</span>
            <button
              onClick={() => onNavigate('/admin')}
              className="text-slate-600 hover:text-blue-900 font-medium underline"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
