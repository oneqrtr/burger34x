import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { Home } from '../pages/Home';
import { Menu } from '../pages/Menu';

export const SiteApp: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <CartDrawer />
    <main className="flex-grow">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
      </Routes>
    </main>
    <PWAInstallButton />
    <Footer />
  </div>
);
