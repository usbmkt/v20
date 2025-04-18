// builder.tsx
import { layoutSidebarButtons, youtubeAssetProvider } from '@grapesjs/studio-sdk-plugins';
import { useRef, useEffect } from 'react';
import '@grapesjs/studio-sdk/style';
import createStudioEditor from '@grapesjs/studio-sdk';

export default function BuilderPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    createStudioEditor({
      root: editorRef.current,
      licenseKey: 'a588bab57a26417d829a73e27616d0233b3b7ba518ea4156a72f28517c14f616',
      theme: 'dark',
      project: {
        type: 'web',
        storage: false,
        default: {
          pages: [
            {
              name: 'Página Inicial',
              component: `<section class="hero"><h1>Hello, GrapesJS</h1></section>`,
            },
          ],
        },
      },
      storage: {
        type: 'self',
        autosaveChanges: 100,
        autosaveIntervalMs: 10000,
        onSave: async ({ project }) => {
          await fetch('/api/save-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
          });
        },
        onLoad: async () => {
          const res = await fetch('/api/load-project');
          return { project: await res.json() };
        },
      },
      assets: {
        storageType: 'self',
        onUpload: async ({ files }) => {
          const body = new FormData();
          for (const file of files) body.append('files', file);
          const res = await fetch('/api/save-assets', { method: 'POST', body });
          return await res.json();
        },
        onDelete: async ({ assets }) => {
          await fetch('/api/delete-assets', {
            method: 'DELETE',
            body: JSON.stringify(assets),
          });
        },
      },
      plugins: [
        layoutSidebarButtons.init({}),
        youtubeAssetProvider.init({}),
      ],
    });
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={editorRef} className="w-full h-full" />
    </div>
  );
}
