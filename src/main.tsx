import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PomodoroProvider } from './context/PomodoroContext';
import { MiniTimerStandalone } from './components/FloatingMiniTimer';
import './index.css';

const isMiniWindow = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mini') === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PomodoroProvider>
      {isMiniWindow ? <MiniTimerStandalone /> : <App />}
    </PomodoroProvider>
  </StrictMode>,
);
