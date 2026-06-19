import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Calendar, MessageSquare, Crown, ChevronDown, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { MEMBER_LEVEL_LABELS } from '@/types';

export default function Layout({ children }: { children: React.ReactNode }) {
  const currentMember = useStore(state => state.getCurrentMember());
  const isPresident = useStore(state => state.isPresident);
  const members = useStore(state => state.members);
  const switchUser = useStore(state => state.switchUser);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 hover:bg-midnight-700/50 transition-colors"
            >
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
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium truncate">{currentMember?.name}</p>
                <p className="text-xs text-midnight-400">
                  {isPresident ? '社长' : '社员'} · 点击切换身份
                </p>
              </div>
              <ChevronDown size={16} className="text-midnight-400" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-midnight-800 border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-amber-500/10">
                    <p className="text-xs text-midnight-400 px-2 flex items-center gap-1">
                      <Sparkles size={12} />
                      切换身份体验
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {members.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchUser(member.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-midnight-700/50 transition-colors ${
                          member.id === currentMember?.id
                            ? 'bg-amber-500/10'
                            : ''
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className={`w-8 h-8 rounded-full ${
                              member.id === currentMember?.id
                                ? 'border-2 border-amber-500'
                                : 'border border-midnight-600'
                            }`}
                          />
                          {member.role === 'president' && (
                            <Crown
                              size={12}
                              className="absolute -top-1 -right-1 text-amber-400"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-midnight-100 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-midnight-400">
                            {MEMBER_LEVEL_LABELS[member.level]}
                            {member.role === 'president' ? ' · 社长' : ''}
                          </p>
                        </div>
                        {member.id === currentMember?.id && (
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 relative z-10">
        <div className="p-8 min-h-screen">{children}</div>
      </main>
    </div>
  );
}
