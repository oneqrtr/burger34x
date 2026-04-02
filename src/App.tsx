import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Admin } from './pages/Admin';
import { publicAssetUrl } from './utils/publicAssetUrl';

export default function App() {
  useEffect(() => {
    const icon = publicAssetUrl('/logo_final_vectorized.png');
    document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']").forEach((el) => {
      (el as HTMLLinkElement).href = icon;
    });
  }, []);

  return (
    <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/admin" element={<Admin />} />
            {/* Other routes can be added here */}
          </Routes>
        </main>
        <PWAInstallButton />
        <Footer />
      </div>
    </Router>
  );
}
