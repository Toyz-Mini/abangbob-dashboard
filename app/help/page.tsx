'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search,
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ShoppingCart,
  ChefHat,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Smartphone,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Play,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useTour } from '@/components/onboarding/TourProvider';

// Help Categories
const HELP_CATEGORIES = [
  {
    id: 'pos',
    title: 'Sistem POS',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    articles: [
      { id: 'pos-1', title: 'Cara Buat Pesanan Baru', content: 'Langkah-langkah untuk membuat pesanan baru di sistem POS...', tags: ['pesanan', 'pos', 'asas'] },
      { id: 'pos-2', title: 'Proses Bayaran Pelanggan', content: 'Cara terima bayaran tunai, kad, dan e-wallet...', tags: ['bayaran', 'pembayaran', 'pos'] },
      { id: 'pos-3', title: 'Ubah atau Batalkan Pesanan', content: 'Cara edit pesanan yang sudah dibuat atau batalkan pesanan...', tags: ['edit', 'batal', 'pesanan'] },
      { id: 'pos-4', title: 'Cetak Resit', content: 'Cara cetak resit untuk pelanggan...', tags: ['cetak', 'resit', 'printer'] },
      { id: 'pos-5', title: 'Discount dan Promosi', content: 'Cara apply diskaun dan kod promosi...', tags: ['diskaun', 'promosi', 'promo'] },
    ]
  },
  {
    id: 'kds',
    title: 'Kitchen Display',
    icon: ChefHat,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    articles: [
      { id: 'kds-1', title: 'Fungsi Kitchen Display', content: 'Pengenalan kepada sistem paparan dapur...', tags: ['kds', 'dapur', 'asas'] },
      { id: 'kds-2', title: 'Kemaskini Status Pesanan', content: 'Cara tandakan pesanan sebagai sedang dimasak atau siap...', tags: ['status', 'pesanan', 'kds'] },
      { id: 'kds-3', title: 'Timer Pesanan', content: 'Memahami penunjuk masa untuk setiap pesanan...', tags: ['timer', 'masa', 'pesanan'] },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventori',
    icon: Package,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    articles: [
      { id: 'inv-1', title: 'Tambah Stok Baru', content: 'Cara daftarkan item stok baru dalam sistem...', tags: ['stok', 'inventori', 'tambah'] },
      { id: 'inv-2', title: 'Kemaskini Kuantiti Stok', content: 'Cara update jumlah stok apabila terima barang...', tags: ['kuantiti', 'kemaskini', 'stok'] },
      { id: 'inv-3', title: 'Amaran Stok Rendah', content: 'Cara setup amaran bila stok hampir habis...', tags: ['amaran', 'alert', 'stok rendah'] },
      { id: 'inv-4', title: 'Laporan Inventori', content: 'Cara lihat dan export laporan inventori...', tags: ['laporan', 'report', 'inventori'] },
    ]
  },
  {
    id: 'hr',
    title: 'Pengurusan HR',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    articles: [
      { id: 'hr-1', title: 'Daftar Staf Baru', content: 'Cara tambah pekerja baru dalam sistem...', tags: ['staf', 'pekerja', 'daftar'] },
      { id: 'hr-2', title: 'Jadual Kerja', content: 'Cara buat dan urus jadual shift staf...', tags: ['jadual', 'shift', 'kerja'] },
      { id: 'hr-3', title: 'Rekod Kehadiran', content: 'Sistem clock-in/out dan laporan kehadiran...', tags: ['kehadiran', 'clock', 'rekod'] },
      { id: 'hr-4', title: 'Proses Gaji', content: 'Cara kira gaji dan buat slip gaji...', tags: ['gaji', 'payroll', 'slip'] },
      { id: 'hr-5', title: 'Pengurusan Cuti', content: 'Cara urus permohonan cuti staf...', tags: ['cuti', 'leave', 'permohonan'] },
    ]
  },
  {
    id: 'finance',
    title: 'Kewangan',
    icon: CreditCard,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    articles: [
      { id: 'fin-1', title: 'Rekod Perbelanjaan', content: 'Cara masukkan rekod perbelanjaan harian...', tags: ['perbelanjaan', 'expense', 'rekod'] },
      { id: 'fin-2', title: 'Laporan Jualan', content: 'Cara lihat laporan jualan harian/bulanan...', tags: ['jualan', 'laporan', 'sales'] },
      { id: 'fin-3', title: 'Untung Rugi', content: 'Cara lihat laporan profit & loss...', tags: ['untung', 'rugi', 'profit'] },
    ]
  },
  {
    id: 'analytics',
    title: 'Analitik',
    icon: BarChart3,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    articles: [
      { id: 'ana-1', title: 'Dashboard Utama', content: 'Memahami ringkasan data di dashboard...', tags: ['dashboard', 'analitik', 'data'] },
      { id: 'ana-2', title: 'Trend Jualan', content: 'Cara analisis trend jualan anda...', tags: ['trend', 'jualan', 'analisis'] },
      { id: 'ana-3', title: 'Top Items', content: 'Lihat item terlaris dan prestasi menu...', tags: ['top', 'menu', 'prestasi'] },
    ]
  },
  {
    id: 'staff-portal',
    title: 'Portal Staf',
    icon: Smartphone,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    articles: [
      { id: 'sp-1', title: 'Clock In/Out', content: 'Cara clock in dan clock out melalui portal staf...', tags: ['clock', 'kehadiran', 'staf'] },
      { id: 'sp-2', title: 'Lihat Jadual', content: 'Cara lihat jadual kerja anda...', tags: ['jadual', 'shift', 'portal'] },
      { id: 'sp-3', title: 'Mohon Cuti', content: 'Cara submit permohonan cuti...', tags: ['cuti', 'permohonan', 'leave'] },
      { id: 'sp-4', title: 'Senarai Tugas', content: 'Cara lengkapkan checklist harian...', tags: ['tugas', 'checklist', 'senarai'] },
      { id: 'sp-5', title: 'Lihat Slip Gaji', content: 'Cara muat turun slip gaji bulanan...', tags: ['slip', 'gaji', 'payslip'] },
    ]
  },
  {
    id: 'settings',
    title: 'Tetapan',
    icon: Settings,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    articles: [
      { id: 'set-1', title: 'Tetapan Perniagaan', content: 'Cara kemaskini maklumat perniagaan...', tags: ['tetapan', 'perniagaan', 'setting'] },
      { id: 'set-2', title: 'Tetapan Cukai', content: 'Cara set kadar cukai dan caj perkhidmatan...', tags: ['cukai', 'sst', 'caj'] },
      { id: 'set-3', title: 'Urus Pembayaran', content: 'Cara aktifkan kaedah pembayaran...', tags: ['pembayaran', 'payment', 'cara'] },
      { id: 'set-4', title: 'Backup Data', content: 'Cara backup dan restore data sistem...', tags: ['backup', 'restore', 'data'] },
    ]
  },
];

// FAQ Items
const FAQ_ITEMS = [
  {
    question: 'Bagaimana nak reset PIN staf?',
    answer: 'Pergi ke HR > Senarai Staf > Klik pada staf > Edit > Masukkan PIN baru. Pastikan anda simpan perubahan.',
  },
  {
    question: 'Sistem offline, boleh ke masih guna POS?',
    answer: 'Ya, sistem AbangBob boleh beroperasi secara offline. Data akan disimpan secara lokal dan sync bila internet kembali.',
  },
  {
    question: 'Macam mana nak tambah item menu baru?',
    answer: 'Pergi ke Menu Management > Klik butang "Tambah Item" > Isi maklumat item > Pilih kategori > Simpan.',
  },
  {
    question: 'Boleh ke print resit tanpa printer thermal?',
    answer: 'Ya, sistem boleh cetak resit ke mana-mana printer. Pergi ke Settings untuk configure printer anda.',
  },
  {
    question: 'Bagaimana nak export laporan ke Excel?',
    answer: 'Di setiap halaman laporan, klik butang Export > Pilih format (Excel/PDF) > Download.',
  },
  {
    question: 'Kenapa order tak muncul di Kitchen Display?',
    answer: 'Pastikan order sudah di-submit (bukan draft). Check juga connection internet dan refresh KDS.',
  },
  {
    question: 'Macam mana nak buat void/refund?',
    answer: 'Pergi ke Order History > Cari pesanan > Klik Void/Refund > Masukkan sebab > Confirm. Hanya Admin/Manager boleh buat.',
  },
  {
    question: 'Boleh ke staf tukar shift sesama sendiri?',
    answer: 'Ya, melalui Portal Staf > Swap Shift > Pilih shift dan staf pengganti > Submit untuk approval manager.',
  },
];

export default function HelpCenterPage() {
  const { startTour } = useTour();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Filter articles based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { category: typeof HELP_CATEGORIES[0]; article: typeof HELP_CATEGORIES[0]['articles'][0] }[] = [];
    
    HELP_CATEGORIES.forEach(category => {
      category.articles.forEach(article => {
        if (
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.includes(query))
        ) {
          results.push({ category, article });
        }
      });
    });
    
    return results;
  }, [searchQuery]);

  // Get current category and article
  const currentCategory = selectedCategory 
    ? HELP_CATEGORIES.find(c => c.id === selectedCategory) 
    : null;
  
  const currentArticle = currentCategory && selectedArticle
    ? currentCategory.articles.find(a => a.id === selectedArticle)
    : null;

  const handleStartTour = () => {
    startTour('admin-full-tour');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pusat Bantuan</h1>
            <p className="text-teal-100 mb-8">Cari jawapan untuk soalan anda atau ikuti panduan langkah demi langkah</p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari artikel bantuan..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Search Results */}
          {searchQuery && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">
                Hasil Carian ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">Tiada hasil ditemui untuk "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(({ category, article }) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={article.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedArticle(article.id);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors text-left"
                      >
                        <div className={`p-2 rounded-lg ${category.bgColor}`}>
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{article.title}</h3>
                          <p className="text-sm text-slate-400">{category.title}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Article View */}
          {currentArticle && !searchQuery ? (
            <div className="mb-8">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedArticle(null); }}
                  className="hover:text-white transition-colors"
                >
                  Pusat Bantuan
                </button>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="hover:text-white transition-colors"
                >
                  {currentCategory?.title}
                </button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{currentArticle.title}</span>
              </div>

              {/* Article Content */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  {currentCategory && (
                    <div className={`p-2 rounded-lg ${currentCategory.bgColor}`}>
                      <currentCategory.icon className={`w-6 h-6 ${currentCategory.color}`} />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white">{currentArticle.title}</h2>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed">{currentArticle.content}</p>
                  
                  {/* Placeholder for full article content */}
                  <div className="mt-6 p-6 bg-slate-700/50 rounded-xl border border-slate-600">
                    <p className="text-slate-400 text-center">
                      Kandungan penuh artikel akan ditambah kemudian.
                    </p>
                  </div>
                </div>

                {/* Article Tags */}
                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-700">
                  <span className="text-sm text-slate-500">Tags:</span>
                  {currentArticle.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 mt-4 text-teal-400 hover:text-teal-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke senarai
              </button>
            </div>
          ) : selectedCategory && !searchQuery ? (
            /* Category View */
            <div className="mb-8">
              {/* Back Button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke kategori
              </button>

              {currentCategory && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl ${currentCategory.bgColor}`}>
                      <currentCategory.icon className={`w-8 h-8 ${currentCategory.color}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{currentCategory.title}</h2>
                      <p className="text-slate-400">{currentCategory.articles.length} artikel</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentCategory.articles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article.id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                          <span className="text-white group-hover:text-teal-400 transition-colors">
                            {article.title}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : !searchQuery && (
            /* Main Help Center View */
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={handleStartTour}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-xl hover:from-teal-500/30 hover:to-emerald-500/30 transition-colors group"
                >
                  <div className="p-3 rounded-xl bg-teal-500/20">
                    <Play className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                      Mula Tour Interaktif
                    </h3>
                    <p className="text-sm text-slate-400">Panduan langkah demi langkah</p>
                  </div>
                </button>

                <button className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Video className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      Video Tutorial
                    </h3>
                    <p className="text-sm text-slate-400">Tonton demo sistem</p>
                  </div>
                </button>

                <button className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <MessageCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Hubungi Sokongan
                    </h3>
                    <p className="text-sm text-slate-400">Chat dengan kami</p>
                  </div>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4">Topik Bantuan</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {HELP_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex flex-col items-center gap-3 p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 hover:bg-slate-800 transition-all group"
                      >
                        <div className={`p-3 rounded-xl ${category.bgColor} group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${category.color}`} />
                        </div>
                        <div className="text-center">
                          <h3 className="font-medium text-white">{category.title}</h3>
                          <p className="text-xs text-slate-500">{category.articles.length} artikel</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Soalan Lazim (FAQ)</h2>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-medium text-white">{faq.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            expandedFaq === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4">
                          <div className="pt-2 border-t border-slate-700">
                            <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

