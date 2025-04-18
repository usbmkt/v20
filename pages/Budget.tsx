// pages/vvveb.tsx
import Head from 'next/head';
// import Layout from '@/components/layout'; // <<< REMOVER IMPORT DO LAYOUT

export default function VvvebPage() {

  return (
    // Remove o componente Layout daqui
    <>
      <Head>
        <title>Editor Web - USBMKT</title>
      </Head>
      {/* O iframe agora ocupa toda a tela */}
      <iframe
        src="/vvvebjs/editor.html"
        className="w-screen h-screen" // Ocupa 100% da largura e altura da tela
        style={{ border: 'none' }} // Remove borda
        title="Editor VvvebJs"
      />
    </>
  );
}