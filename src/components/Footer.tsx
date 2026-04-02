import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCMSStore } from '../store/cmsStore';
import { fallbackCmsData } from '../constants/fallbackCmsData';

function turkeyPhoneForLinks(displayPhone: string): string {
  const digits = displayPhone.replace(/\D/g, '');
  const intl =
    digits.startsWith('90') ? digits : digits.startsWith('0') ? `90${digits.slice(1)}` : `90${digits}`;
  return `+${intl}`;
}

export const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const pathNorm = pathname.replace(/\/$/, '') || '/';
  const isAdmin = pathNorm === '/admin';

  const { data, fetchData } = useCMSStore();
  const cmsData = data ?? fallbackCmsData;
  const visibleSocials = cmsData.ui.socialLinks.filter((item) => item.enabled);
  const telHref = turkeyPhoneForLinks(cmsData.contact.phone);

  React.useEffect(() => {
    if (isAdmin) return;
    if (!data) fetchData();
  }, [data, fetchData, isAdmin]);

  if (isAdmin) return null;

  return (
    <footer className="bg-dark-bg border-t border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4 max-w-sm">
          <div className="flex flex-col gap-0.5 text-lg font-black leading-tight text-cream md:text-xl">
            <span>Burger34</span>
            <span>Chicken34</span>
            <span>Kumru34</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-accent">
            Sokak Lezzetleri
          </p>
          <p className="text-white/40 text-xs pt-2">© 2022 Burger34 — Tüm hakları saklıdır.</p>
        </div>

        <div className="space-y-4">
          <h5 className="text-orange-accent font-bold text-sm uppercase tracking-widest">Gezinme</h5>
          <ul className="space-y-2">
            <li><Link to="/menu" className="text-white/60 hover:text-orange-accent transition-colors text-sm">Menü</Link></li>
            <li><Link to="/#about" className="text-white/60 hover:text-orange-accent transition-colors text-sm">{cmsData.ui.aboutLabel}</Link></li>
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
          <p className="text-white/50 text-sm leading-relaxed">
            {cmsData.contact.address}
            {cmsData.contact.email?.trim() ? (
              <>
                <br />
                {cmsData.contact.email}
              </>
            ) : null}
            <br />
            <a href={`tel:${telHref}`} className="text-orange-accent/90 hover:text-orange-accent font-semibold">
              {cmsData.contact.phone}
            </a>
          </p>
          <div className="pt-4">
            <Link to="/admin" className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Yönetim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
