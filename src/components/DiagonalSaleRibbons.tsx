import React from 'react';

const CHUNK =
  'SINIRSIZ - ÇITIR TAVUK · SINIRSIZ - ÇITIR TAVUK · SINIRSIZ - ÇITIR TAVUK · ';

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const repeated = Array.from({ length: 14 }, () => CHUNK).join('');
  return (
    <div
      className={`sale-marquee-track flex w-max shrink-0 items-center gap-0 whitespace-nowrap font-headline text-sm font-black uppercase tracking-[0.2em] md:text-base lg:text-lg ${reverse ? 'sale-marquee-track--reverse' : ''}`}
    >
      <span className="inline-flex shrink-0 px-2">{repeated}</span>
      <span className="inline-flex shrink-0 px-2" aria-hidden>
        {repeated}
      </span>
    </div>
  );
}

interface RibbonBandProps {
  top: string;
  rotationDeg: number;
  bgClass: string;
  textClass: string;
  reverse?: boolean;
}

function RibbonBand({ top, rotationDeg, bgClass, textClass, reverse }: RibbonBandProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-10 w-[125%] max-w-none -translate-x-1/2"
      style={{ top }}
    >
      <div
        className="origin-center shadow-lg"
        style={{ transform: `rotate(${rotationDeg}deg)` }}
      >
        {/* Metin şeritle aynı açıda; translateX şeridin boyunca kayar */}
        <div className={`${bgClass} overflow-hidden py-2.5 md:py-3.5`}>
          <div className={textClass}>
            <MarqueeRow reverse={reverse} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const DiagonalSaleRibbons: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-dark-bg py-6 md:py-10">
      <p className="sr-only">Sınırsız çıtır tavuk kampanyası</p>
      <div className="relative mx-auto h-[200px] w-full max-w-[100vw] md:h-[260px]" aria-hidden>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-bg via-transparent to-dark-bg opacity-90" />

        <RibbonBand
          top="8%"
          rotationDeg={-5}
          bgClass="bg-burgundy"
          textClass="text-cream"
          reverse={false}
        />
        <RibbonBand
          top="38%"
          rotationDeg={4}
          bgClass="bg-orange-accent"
          textClass="text-[#2a0a0a]"
          reverse
        />
        <RibbonBand
          top="68%"
          rotationDeg={-4}
          bgClass="bg-[#5a1212]"
          textClass="text-cream"
          reverse={false}
        />
      </div>
    </section>
  );
};
