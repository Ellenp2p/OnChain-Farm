import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './pages/App';
import { FriendsList } from './pages/FriendsList';
import { Settings } from './pages/Settings';
import { FriendFarm } from './pages/FriendFarm';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/friends', element: <FriendsList /> },
  { path: '/friend/:id', element: <FriendFarm /> },
  { path: '/settings', element: <Settings /> }
]);

createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


