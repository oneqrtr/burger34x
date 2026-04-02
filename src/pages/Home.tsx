import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Hero } from '../components/Hero';
import { DiagonalSaleRibbons } from '../components/DiagonalSaleRibbons';
import { ProductCard } from '../components/ProductCard';
import { useCMSStore } from '../store/cmsStore';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fallbackCmsData } from '../constants/fallbackCmsData';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../utils/placeholderImage';

export const Home: React.FC = () => {
  const { data, isLoading, fetchData } = useCMSStore();

  useEffect(() => {
    fetchData();
  }, []);

  const cmsData = data ?? fallbackCmsData;

  const bestSellers = cmsData.products.filter(p => p.isBestSeller);

  return (
    <div className="w-full">
      <Hero title={cmsData.hero.title} subtitle={cmsData.hero.subtitle} />

      {/* Featured Products */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-orange-accent text-sm font-bold tracking-widest uppercase mb-2">Özenle seçilmiş</h2>
            <h3 className="text-5xl font-black tracking-tight">İmza lezzetler</h3>
          </div>
          <p className="text-white/60 max-w-xs italic">“Sokak ruhuna özel.”</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          <div className="flex flex-col justify-center p-8 bg-burgundy/20 rounded-xl border border-burgundy/30">
            <h4 className="text-2xl font-black text-orange-accent mb-4 leading-tight">Tüm menüyü keşfetmek ister misin?</h4>
            <Link to="/menu" className="flex items-center gap-2 font-bold hover:gap-4 transition-all">
              Tüm menüyü gör <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <DiagonalSaleRibbons />

      {/* About Section */}
      <section id="about" className="scroll-mt-24 bg-white/5 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-burgundy/20 rounded-full blur-3xl"></div>
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-xl overflow-hidden shadow-2xl"
            >
              <img 
                src={publicAssetUrl(cmsData.about.image || '/logo_final.png')} 
                alt="Hikayemiz" 
                className="block w-full h-auto object-contain" 
              />
            </motion.div>
          </div>
          <div className="space-y-8">
            <h2 className="text-orange-accent text-sm font-bold tracking-widest uppercase">Hikayemiz</h2>
            <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9]">
              {cmsData.about.title.split(' ').map((word, i) =>
                ['MKP', 'Mustafakemalpaşa'].some((w) => word.includes(w)) ? (
                  <span key={i} className="text-burgundy italic">
                    {word}{' '}
                  </span>
                ) : (
                  <React.Fragment key={i}>{word} </React.Fragment>
                )
              )}
            </h3>
            <p className="w-full text-lg text-white/60 leading-relaxed whitespace-pre-line">
              {cmsData.about.content}
            </p>
            <div className="flex items-center gap-12 pt-4">
              {cmsData.about.stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl font-black">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-orange-accent">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog / News */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight">{cmsData.ui.blogSectionTitle}</h2>
          <div className="mx-auto h-1 w-24 bg-burgundy" />
          {cmsData.ui.blogIntro?.trim() ? (
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 whitespace-pre-line">
              {cmsData.ui.blogIntro}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cmsData.blog.map(post => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl mb-6">
                <img
                  src={post.image?.trim() ? publicAssetUrl(post.image.trim()) : PRODUCT_IMAGE_PLACEHOLDER}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-dark-bg/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange-accent">
                  {post.category}
                </div>
              </div>
              <h4 className="text-2xl font-bold group-hover:text-orange-accent transition-colors mb-3">{post.title}</h4>
              <p className="text-sm text-white/60 line-clamp-2">{post.excerpt}</p>
            </motion.div>
          ))}
        </div>
        {isLoading && (
          <p className="mt-8 text-center text-sm text-white/50">Icerik guncelleniyor...</p>
        )}
      </section>
    </div>
  );
};
