import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Admin } from '../pages/Admin';

export const AdminApp: React.FC = () => (
  <Routes>
    <Route index element={<Admin />} />
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
);
