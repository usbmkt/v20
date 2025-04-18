// pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from "@/components/ui/toaster";
import { ReactFlowProvider } from '@xyflow/react'; // Mantido caso use em outras partes
import { AuthProvider } from '@/context/AuthContext'; // <<<---- IMPORTADO

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Envolve tudo com AuthProvider
    <AuthProvider>
      <ReactFlowProvider> {/* Mantido por segurança */}
        {/* O Layout será aplicado dentro das páginas que precisam dele */}
        <Component {...pageProps} />
        <Toaster /> {/* Para exibir notificações globais */}
      </ReactFlowProvider>
    </AuthProvider>
  );
}

export default MyApp;