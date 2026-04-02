import React from 'react';

const CHUNK = 'SINIRSIZ ÇITIR TAVUK · 350 TL · ';

export const MenuPromoMegaStrip: React.FC = () => {
  const repeated = Array.from({ length: 20 }, () => CHUNK).join('');

  return (
    <div
      className="menu-mega-strip sticky top-20 z-[45] w-screen border-y border-orange-accent/25 bg-burgundy shadow-lg"
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <div className="relative overflow-hidden py-2.5 md:py-3">
        <div
          className="menu-mega-glitch-bg pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
        />
        <div className="menu-mega-marquee-track relative flex w-max font-headline text-xs font-black uppercase tracking-[0.35em] text-cream md:text-sm">
          <span className="menu-mega-line inline-flex shrink-0 px-3">{repeated}</span>
          <span className="menu-mega-line inline-flex shrink-0 px-3" aria-hidden>
            {repeated}
          </span>
        </div>
      </div>
    </div>
  );
};
