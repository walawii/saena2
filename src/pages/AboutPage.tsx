import React from 'react';
import { Sparkles, ShieldCheck, Heart, Users, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
          Filosofi & Kisah Kami
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          Menyempurnakan Penampilan Muslimah Indonesia dengan Keanggunan & Kesantunan.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Saena.id lahir dari kerinduan akan busana muslim yang tidak hanya syar'i dan menutupi aurat dengan sempurna, namun juga nyaman dipakai di iklim tropis Indonesia serta berdesain abadi.
        </p>
      </div>

      <div className="rounded-3xl bg-stone-100 aspect-[16/9] overflow-hidden relative border border-stone-200">
        <img
          src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'><rect width='1200' height='675' fill='%230F172A'/><circle cx='600' cy='337' r='200' fill='%231E3A8A' opacity='0.3'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23D4AF37' font-family='serif' font-size='42'>SAENA.ID ATELIER</text></svg>"
          alt="Saena.id Atelier"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-stone-200/80 space-y-2">
          <Heart className="w-6 h-6 text-rose-600" />
          <h3 className="font-serif text-base font-bold text-slate-900">Material Pilihan No-Terawang</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hanya menggunakan Armani silk, Mulberry crepe, ceruty babydoll berfuring adem, dan voal ultrafine yang nyaman dan tidak menerawang.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200/80 space-y-2">
          <Sparkles className="w-6 h-6 text-amber-600" />
          <h3 className="font-serif text-base font-bold text-slate-900">Jahitan Standar Butik</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dikerjakan oleh penjahit terampil Indonesia dengan jahitan halus, kelim rapi, dan manset wudhu-friendly yang praktis.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-stone-200/80 space-y-2">
          <Users className="w-6 h-6 text-blue-900" />
          <h3 className="font-serif text-base font-bold text-slate-900">Layanan Ramah & Berkah</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mendampingi setiap muslimah dalam memilih ukuran yang tepat dengan konsultasi gratis dan garansi tukar ukuran.
          </p>
        </div>
      </div>

      <div className="bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200/80 text-center space-y-4">
        <h3 className="font-serif text-xl font-bold text-slate-900">Temukan Koleksi Busana Impian Anda</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Jelajahi gamis syar'i, dress plisket, mukena seserahan, hingga hijab voal terbaik Saena.id hari ini.
        </p>
        <button
          onClick={() => onNavigate('/produk')}
          className="px-8 py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
        >
          Lihat Seluruh Koleksi
        </button>
      </div>
    </div>
  );
};
