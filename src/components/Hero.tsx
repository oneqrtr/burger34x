import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronDown } from 'lucide-react';

/** Video: public/video/hamburger_final.mp4 */
const HERO_VIDEO_SRC = '/video/hamburger_final.mp4';

/** Scroll sahnesi yüksekliği (vh). */
const HERO_SCROLL_SECTION_VH = 300;

interface HeroProps {
  title: string;
  subtitle: string;
}

export const Hero: React.FC<HeroProps> = ({ title, subtitle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 0, 0, 1]);
  const textScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 0.8, 0.8, 1.2]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    tryPlay();
    v.addEventListener('loadeddata', tryPlay);
    return () => v.removeEventListener('loadeddata', tryPlay);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${HERO_SCROLL_SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-dark-bg">
        {/* Video scroll’dan bağımsız: sürekli oynar, scrub yok */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            onError={() => setVideoFailed(true)}
            onLoadedData={() => setVideoFailed(false)}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-dark-bg/55 via-dark-bg/25 to-dark-bg/75"
          aria-hidden
        />

        {videoFailed && (
          <p className="absolute bottom-20 left-4 right-4 z-20 text-center text-sm text-orange-accent/90 md:left-12 md:right-12">
            Video açılamadı. Dosyayı şu konuma koyun:{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-cream">public/video/hamburger_final.mp4</code>
          </p>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
          <motion.div style={{ opacity: textOpacity, scale: textScale }}>
            <h1 className="mb-4 text-6xl font-black leading-none tracking-tighter text-glow md:text-[8rem]">
              {title}
            </h1>
            <p className="text-xl uppercase tracking-[0.3em] text-orange-accent md:text-2xl">
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: textOpacity }}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-12 flex justify-center"
          >
            <ChevronDown className="text-primary h-10 w-10 animate-bounce" />
          </motion.div>
        </div>

        <div className="pointer-events-none absolute bottom-12 left-12 z-10 hidden lg:block">
          <p className="select-none text-[10rem] font-black leading-none opacity-5">UMAMI</p>
        </div>
      </div>
    </section>
  );
};
