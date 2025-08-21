import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import queryClient from './lib/queryClient.js';


createRoot(document.getElementById('root')).render(
<React.StrictMode>
<QueryClientProvider client={queryClient}>
<BrowserRouter>
<App />
</BrowserRouter>
</QueryClientProvider>
</React.StrictMode>
);