import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-bg border-t border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="text-2xl font-black text-cream">Burger34</div>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Fine dining ruhu, rahat bir ortamda. Modern lezzet tutkunları için seçkin burger deneyimi.
          </p>
          <p className="text-white/40 text-xs">© 2024 Burger34. Tüm hakları saklıdır.</p>
        </div>

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">Gezinme</h5>
          <ul className="space-y-2">
            <li><Link to="/menu" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Menü</Link></li>
            <li><Link to="/about" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Hakkımızda</Link></li>
            <li><Link to="/news" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Haberler</Link></li>
            <li><Link to="/contact" className="text-white/60 hover:text-orange-accent transition-colors text-sm">İletişim</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">Sosyal</h5>
          <ul className="space-y-2">
            <li><a href="#" rel="noopener noreferrer" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Instagram</a></li>
            <li><a href="#" rel="noopener noreferrer" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Facebook</a></li>
            <li><a href="#" rel="noopener noreferrer" className="text-white/60 hover:text-orange-accent transition-colors text-sm">X (Twitter)</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">İletişim</h5>
          <p className="text-white/60 text-sm leading-relaxed">
            Gece Sokağı No: 34, Kadıköy / İstanbul<br />
            merhaba@burger34.com<br />
            +90 (212) 555 34 34
          </p>
          <div className="pt-4">
            <Link to="/admin" className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Yönetim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
