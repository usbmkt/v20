import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './ui/sidebar';
import { SidebarContext } from '@/lib/SidebarContext';

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { pathname } = useRouter();
  const hideSidebar = pathname === '/builder';

  return (
    <SidebarContext.Provider value={{ alreadyRendered: true }}>
      <div className="flex h-screen bg-background text-foreground">
        {!hideSidebar && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        <main className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${!hideSidebar ? (isSidebarCollapsed ? 'ml-16' : 'ml-60') : ''}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
