// components/layout-builder.tsx
import Sidebar from '@/components/ui/sidebar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={cn("flex-1 transition-all duration-300 ease-in-out", isSidebarCollapsed ? 'ml-16' : 'ml-60')}>
        {children}
      </main>
    </div>
  );
}
