'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'ホーム', icon: '🏠', activeIcon: '💜' },
    { href: '/record', label: '記録', icon: '✏️', activeIcon: '💕' },
    { href: '/stats', label: '統計', icon: '📊', activeIcon: '💎' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t-2 border-pink-100 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-6 py-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-purple-700 scale-105'
                  : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50'
              }`}
            >
              <span className={`text-2xl ${isActive ? 'animate-sparkle' : ''}`}>
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className={`text-xs font-bold mt-1 ${isActive ? 'text-purple-600' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
