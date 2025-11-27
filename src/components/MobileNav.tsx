'use client';

import { Home, Users, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

function NavItem({ icon: Icon, label, href, active }: NavItemProps) {
  return (
    <Link href={href}>
      <button
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-h-[56px] transition-all touch-manipulation ${
          active
            ? 'text-emerald-400'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Icon className={`${active ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <span className="text-xs font-medium">{label}</span>
      </button>
    </Link>
  );
}

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 sm:hidden z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center">
        <NavItem 
          icon={Home} 
          label="Home" 
          href="/" 
          active={pathname === '/'} 
        />
        <NavItem 
          icon={Users} 
          label="Rooms" 
          href="/rooms" 
          active={pathname === '/rooms'} 
        />
        <NavItem 
          icon={Plus} 
          label="Create" 
          href="/rooms?create=true" 
          active={pathname === '/rooms' && typeof window !== 'undefined' && window.location.search.includes('create=true')} 
        />
        <NavItem 
          icon={Settings} 
          label="Settings" 
          href="/settings" 
          active={pathname === '/settings'} 
        />
      </div>
    </nav>
  );
}
