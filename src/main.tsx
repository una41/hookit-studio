import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './styles/global.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/editor.css';
import './styles/setup.css';
import './styles/brand.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
