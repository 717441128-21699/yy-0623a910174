import { NavLink } from 'react-router-dom';
import { User, Calendar, MessageSquare, Crown } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const currentMember = useStore(state => state.getCurrentMember());
  const isPresident = useStore(state => state.isPresident);

  const navItems = [
    { path: '/profile', label: '成员档案', icon: User },
    { path: '/events', label: '活动排车', icon: Calendar },
    { path: '/feedback', label: '复盘反馈', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-midnight-900 text-midnight-100 flex">
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-midnight-800/50 to-midnight-950 pointer-events-none z-0" />

      <aside className="w-64 min-h-screen bg-midnight-900/80 backdrop-blur-xl border-r border-amber-500/10 relative z-10">
        <div className="p-6 border-b border-amber-500/10">
          <h1 className="font-serif text-2xl font-bold text-amber-400 flex items-center gap-2">
            <span className="text-3xl">🎭</span>
            剧本杀社团
          </h1>
          <p className="text-midnight-400 text-sm mt-1">组局管理系统</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 shadow-gold'
                    : 'text-midnight-300 hover:bg-midnight-800 hover:text-midnight-100'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-500/10">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50">
            <div className="relative">
              <img
                src={currentMember?.avatar}
                alt={currentMember?.name}
                className="w-10 h-10 rounded-full border-2 border-amber-500/50"
              />
              {isPresident && (
                <Crown
                  size={14}
                  className="absolute -top-1 -right-1 text-amber-400"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentMember?.name}</p>
              <p className="text-xs text-midnight-400">
                {isPresident ? '社长' : '社员'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 relative z-10">
        <div className="p-8 min-h-screen">{children}</div>
      </main>
    </div>
  );
}
