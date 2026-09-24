import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';

interface ContactPageProps {
  onAddToCartSuccess: (message: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onAddToCartSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    onAddToCartSuccess('Pesan Anda berhasil dikirim! Customer Care Saena.id akan segera membalas.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Customer Care</span>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Hubungi Kami</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Ada pertanyaan seputar ukuran, bahan kain, pengiriman Mengantar, atau status pesanan? Tim kami siap membantu dengan ramah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-slate-900">Kontak Resmi</h3>
            
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">WhatsApp Customer Care</p>
                <p className="text-slate-600 mt-0.5">+62 812-3456-7890</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Senin - Sabtu: 08.00 - 21.00 WIB</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Email Korespondensi</p>
                <p className="text-slate-600 mt-0.5">salam@saena.id</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Kantor & Butik Saena</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Wisma Saena Lantai 4, Jl. TB Simatupang No. 88, Cilandak Barat, Jakarta Selatan 12430
                </p>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Langsung via WhatsApp</span>
          </a>
        </div>

        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          {sent ? (
            <div className="py-12 text-center space-y-2">
              <p className="font-serif text-lg font-bold text-slate-900">Alhamdulillah, Pesan Terkirim!</p>
              <p className="text-xs text-slate-500">Kami akan membalas ke email {email} secepatnya.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topik Pesan</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Konsultasi ukuran / Pertanyaan pengiriman"
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pesan Anda</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan pertanyaan atau keluhan Anda secara rinci..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-900 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesan</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
