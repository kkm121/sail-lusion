import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles/sail.css';
import './styles/nav.css';
import './styles/motion.css';
import './styles/brand.css';
import App from './App';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!window.location.hash) window.scrollTo(0, 0);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
