import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SiteApp } from './apps/SiteApp';
import { AdminApp } from './apps/AdminApp';
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
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<SiteApp />} />
      </Routes>
    </Router>
  );
}
