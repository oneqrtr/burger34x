import React from 'react';
import { Link } from 'react-router-dom';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';

export const Footer: React.FC = () => {
  const { data, fetchData } = useCMSStore();
  const cmsData = data ?? fallbackCmsData;
  const visibleSocials = cmsData.ui.socialLinks.filter((item) => item.enabled);

  React.useEffect(() => {
    if (!data) fetchData();
  }, [data, fetchData]);

  return (
    <footer className="bg-dark-bg border-t border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="text-2xl font-black text-cream">Burger34</div>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            {cmsData.ui.footerDescription}
          </p>
          <p className="text-white/40 text-xs">© 2024 Burger34. Tüm hakları saklıdır.</p>
        </div>

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">Gezinme</h5>
          <ul className="space-y-2">
            <li><Link to="/menu" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Menü</Link></li>
            <li><Link to="/about" className="text-white/60 hover:text-orange-accent transition-colors text-sm">{cmsData.ui.aboutLabel}</Link></li>
            <li><Link to="/news" className="text-white/60 hover:text-orange-accent transition-colors text-sm">{cmsData.ui.newsLabel}</Link></li>
            <li><Link to="/contact" className="text-white/60 hover:text-orange-accent transition-colors text-sm">İletişim</Link></li>
          </ul>
        </div>

        {visibleSocials.length > 0 && (
          <div className="space-y-4">
            <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">Sosyal</h5>
            <ul className="space-y-2">
              {visibleSocials.map((social) => (
                <li key={social.id}>
                  <a href={social.url || '#'} rel="noopener noreferrer" className="text-white/60 hover:text-orange-accent transition-colors text-sm">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">İletişim</h5>
          <p className="text-white/60 text-sm leading-relaxed">
            {cmsData.contact.address}<br />
            {cmsData.contact.email}<br />
            {cmsData.contact.phone}
          </p>
          <div className="pt-4">
            <Link to="/admin" className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Yönetim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
