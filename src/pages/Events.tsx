import { useState } from 'react';
import { Plus, Calendar, Clock, Users, ChevronDown, ChevronUp, Crown, Zap, Coffee, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GlassCard from '@/components/GlassCard';
import TasteTag from '@/components/TasteTag';
import Modal from '@/components/Modal';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS, TIER_LABELS, type ActivityType } from '@/types';
import { calculateVeteranRatio } from '@/utils/matching';

export default function Events() {
  const isPresident = useStore(state => state.isPresident);
  const activities = useStore(state => state.activities);
  const createActivity = useStore(state => state.createActivity);
  const signupActivity = useStore(state => state.signupActivity);
  const cancelSignup = useStore(state => state.cancelSignup);
  const getSignupsByActivity = useStore(state => state.getSignupsByActivity);
  const isSignedUp = useStore(state => state.isSignedUp);
  const currentUserId = useStore(state => state.currentUserId);
  const getPreferenceByMemberId = useStore(state => state.getPreferenceByMemberId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');

  const [newActivity, setNewActivity] = useState({
    title: '',
    scriptName: '',
    type: 'honkaku' as ActivityType,
    date: '',
    time: '19:00',
    totalSlots: 6,
    veteranRatio: 0.5,
    description: '',
  });

  const upcomingActivities = activities
    .filter(a => a.status === 'upcoming')
    .filter(a => filterType === 'all' || a.type === filterType)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const endedActivities = activities
    .filter(a => a.status === 'ended')
    .filter(a => filterType === 'all' || a.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreateActivity = () => {
    if (!newActivity.title || !newActivity.scriptName || !newActivity.date) return;

    createActivity({
      ...newActivity,
    });

    setShowCreateModal(false);
    setNewActivity({
      title: '',
      scriptName: '',
      type: 'honkaku',
      date: '',
      time: '19:00',
      totalSlots: 6,
      veteranRatio: 0.5,
      description: '',
    });
  };

  const handleSignup = (activityId: string) => {
    if (isSignedUp(activityId, currentUserId)) {
      cancelSignup(activityId);
    } else {
      signupActivity(activityId);
    }
  };

  const toggleExpand = (activityId: string) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const renderActivityCard = (activity: typeof activities[0], isEnded = false) => {
    const signups = getSignupsByActivity(activity.id);
    const signedUp = isSignedUp(activity.id, currentUserId);
    const isExpanded = expandedActivity === activity.id;
    const filledSlots = Math.min(signups.length, activity.totalSlots);

    const coreSignups = signups.filter(s => s.tier === 'core');
    const experienceSignups = signups.filter(s => s.tier === 'experience');
    const substituteSignups = signups.filter(s => s.tier === 'substitute');

    const veteranCount = signups.filter(s => s.member.level !== 'new').length;
    const actualRatio = signups.length > 0 ? veteranCount / Math.min(signups.length, activity.totalSlots) : 0;
    const ratioOk = actualRatio >= activity.veteranRatio;

    return (
      <GlassCard
        key={activity.id}
        hover={!isEnded}
        className={`overflow-hidden ${isEnded ? 'opacity-70' : ''}`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <TasteTag
                label={ACTIVITY_TYPE_LABELS[activity.type]}
                variant={
                  activity.type === 'honkaku' ? 'danger' :
                  activity.type === 'henkaku' ? 'mystic' :
                  activity.type === 'fun' ? 'gold' : 'default'
                }
                size="sm"
              />
              {isPresident && (
                <TasteTag label="社长开的车" variant="gold" size="sm" />
              )}
            </div>
            {!isEnded && signedUp && (
              <TasteTag label="已报名" variant="success" size="sm" />
            )}
          </div>

          <h4 className="font-serif text-xl font-bold text-midnight-100 mb-1">
            {activity.title}
          </h4>
          <p className="text-amber-400 font-medium mb-3">{activity.scriptName}</p>

          <div className="grid grid-cols-3 gap-2 text-sm text-midnight-400 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              {activity.date}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {activity.time}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              {filledSlots}/{activity.totalSlots}
            </div>
          </div>

          <p className="text-sm text-midnight-300 line-clamp-2 mb-4">
            {activity.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {signups.slice(0, 5).map(signup => (
                <img
                  key={signup.id}
                  src={signup.member.avatar}
                  alt={signup.member.name}
                  className="w-8 h-8 rounded-full border-2 border-midnight-800"
                />
              ))}
              {signups.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-midnight-700 border-2 border-midnight-800 flex items-center justify-center text-xs text-midnight-400">
                  +{signups.length - 5}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEnded && (
                <button
                  onClick={() => handleSignup(activity.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    signedUp
                      ? 'bg-crimson-500/20 text-crimson-400 hover:bg-crimson-500/30 border border-crimson-500/50'
                      : filledSlots >= activity.totalSlots
                        ? 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                        : 'bg-gradient-gold text-midnight-900 hover:shadow-gold-lg'
                  }`}
                  disabled={!signedUp && filledSlots >= activity.totalSlots}
                >
                  {signedUp ? '取消报名' : filledSlots >= activity.totalSlots ? '已满员' : '立即报名'}
                </button>
              )}

              <button
                onClick={() => toggleExpand(activity.id)}
                className="p-2 rounded-lg text-midnight-400 hover:text-midnight-100 hover:bg-midnight-700 transition-colors"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-amber-500/10 p-5 bg-midnight-900/50">
            {isPresident && !isEnded && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
                ratioOk ? 'bg-mystic-500/10 border border-mystic-500/30' : 'bg-crimson-500/10 border border-crimson-500/30'
              }`}>
                {ratioOk ? (
                  <CheckCircle className="text-mystic-400 shrink-0" size={20} />
                ) : (
                  <AlertTriangle className="text-crimson-400 shrink-0" size={20} />
                )}
                <div>
                  <p className={`text-sm font-medium ${ratioOk ? 'text-mystic-400' : 'text-crimson-400'}`}>
                    老带新比例：{Math.round(actualRatio * 100)}% / 目标 {Math.round(activity.veteranRatio * 100)}%
                  </p>
                  <p className="text-xs text-midnight-400">
                    {ratioOk ? '老带新比例达标！' : '老玩家不足，需要更多有经验的成员'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-bold text-crimson-400 mb-2 flex items-center gap-2">
                  <Zap size={16} />
                  核心盘手 ({coreSignups.length})
                </h5>
                {coreSignups.length > 0 ? (
                  <div className="space-y-2">
                    {coreSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-2 bg-crimson-500/10 rounded-lg border border-crimson-500/20">
                        <div className="flex items-center gap-3">
                          <img
                            src={signup.member.avatar}
                            alt={signup.member.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-midnight-100">{signup.member.name}</p>
                            <p className="text-xs text-midnight-400">
                              {getPreferenceByMemberId(signup.member.id)?.tags.slice(0, 2).join(' · ') || '暂无标签'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-crimson-400">{signup.matchScore}%</p>
                          <p className="text-xs text-midnight-500">匹配度</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-midnight-500">暂无核心盘手报名</p>
                )}
              </div>

              <div>
                <h5 className="text-sm font-bold text-mystic-400 mb-2 flex items-center gap-2">
                  <Coffee size={16} />
                  体验位 ({experienceSignups.length})
                </h5>
                {experienceSignups.length > 0 ? (
                  <div className="space-y-2">
                    {experienceSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-2 bg-mystic-500/10 rounded-lg border border-mystic-500/20">
                        <div className="flex items-center gap-3">
                          <img
                            src={signup.member.avatar}
                            alt={signup.member.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-midnight-100">{signup.member.name}</p>
                            <p className="text-xs text-midnight-400">
                              {getPreferenceByMemberId(signup.member.id)?.tags.slice(0, 2).join(' · ') || '暂无标签'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-mystic-400">{signup.matchScore}%</p>
                          <p className="text-xs text-midnight-500">匹配度</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-midnight-500">暂无体验位报名</p>
                )}
              </div>

              {substituteSignups.length > 0 && (
                <div>
                  <h5 className="text-sm font-bold text-midnight-400 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    替补 ({substituteSignups.length})
                  </h5>
                  <div className="space-y-2">
                    {substituteSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-2 bg-midnight-700/30 rounded-lg border border-midnight-600/30">
                        <div className="flex items-center gap-3">
                          <img
                            src={signup.member.avatar}
                            alt={signup.member.name}
                            className="w-8 h-8 rounded-full opacity-60"
                          />
                          <div>
                            <p className="text-sm font-medium text-midnight-300">{signup.member.name}</p>
                            <p className="text-xs text-midnight-500">
                              {getPreferenceByMemberId(signup.member.id)?.tags.slice(0, 2).join(' · ') || '暂无标签'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-midnight-400">{signup.matchScore}%</p>
                          <p className="text-xs text-midnight-500">匹配度</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    );
  };

  const typeOptions: { value: ActivityType | 'all'; label: string; color: string }[] = [
    { value: 'all', label: '全部', color: 'bg-midnight-500' },
    { value: 'honkaku', label: '本格推理', color: 'bg-crimson-500' },
    { value: 'henkaku', label: '变格设定', color: 'bg-mystic-500' },
    { value: 'fun', label: '欢乐机制', color: 'bg-amber-500' },
    { value: 'mixed', label: '混合体验', color: 'bg-midnight-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-bold text-midnight-100">
          活动排车
        </h2>
        {isPresident && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-midnight-900 font-semibold rounded-lg shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Plus size={18} />
            发布活动
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {typeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilterType(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              filterType === option.value
                ? 'bg-midnight-700 text-midnight-100 shadow-gold border border-amber-500/30'
                : 'text-midnight-400 hover:text-midnight-200 hover:bg-midnight-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${option.color}`} />
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-serif text-xl font-bold text-midnight-100 mb-4 flex items-center gap-2">
          <span className="text-amber-400">🎪</span>
          即将开始
          <span className="text-sm font-normal text-midnight-400">
            ({upcomingActivities.length} 场)
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingActivities.map(activity => renderActivityCard(activity))}
        </div>
      </div>

      {endedActivities.length > 0 && (
        <div>
          <h3 className="font-serif text-xl font-bold text-midnight-300 mb-4 flex items-center gap-2">
            <span className="text-midnight-500">📜</span>
            历史活动
            <span className="text-sm font-normal text-midnight-500">
              ({endedActivities.length} 场)
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endedActivities.map(activity => renderActivityCard(activity, true))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发布新活动"
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-midnight-200 mb-2">
              活动标题
            </label>
            <input
              type="text"
              value={newActivity.title}
              onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
              placeholder="例如：周六下午推理局"
              className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-midnight-200 mb-2">
              剧本名称
            </label>
            <input
              type="text"
              value={newActivity.scriptName}
              onChange={e => setNewActivity({ ...newActivity, scriptName: e.target.value })}
              placeholder="例如：《时光杀机》"
              className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-midnight-200 mb-3">
              剧本类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['honkaku', 'henkaku', 'fun', 'mixed'] as ActivityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setNewActivity({ ...newActivity, type })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    newActivity.type === type
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-midnight-600 bg-midnight-700/30 hover:border-midnight-500'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mb-2 ${ACTIVITY_TYPE_COLORS[type]}`} />
                  <p className="font-medium text-midnight-100">{ACTIVITY_TYPE_LABELS[type]}</p>
                  <p className="text-xs text-midnight-400 mt-1">
                    {type === 'honkaku' && '重逻辑推理，适合推土机'}
                    {type === 'henkaku' && '重世界观，适合脑洞玩家'}
                    {type === 'fun' && '重游戏机制，适合欢乐党'}
                    {type === 'mixed' && '综合体验，各类玩家皆宜'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-midnight-200 mb-2">
                日期
              </label>
              <input
                type="date"
                value={newActivity.date}
                onChange={e => setNewActivity({ ...newActivity, date: e.target.value })}
                className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-midnight-200 mb-2">
                时间
              </label>
              <input
                type="time"
                value={newActivity.time}
                onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
                className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-midnight-200 mb-2">
                人数：{newActivity.totalSlots} 人
              </label>
              <input
                type="range"
                min="4"
                max="12"
                value={newActivity.totalSlots}
                onChange={e => setNewActivity({ ...newActivity, totalSlots: parseInt(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-midnight-200 mb-2">
                老带新比例：{Math.round(newActivity.veteranRatio * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newActivity.veteranRatio * 100}
                onChange={e => setNewActivity({ ...newActivity, veteranRatio: parseInt(e.target.value) / 100 })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-midnight-200 mb-2">
              活动描述
            </label>
            <textarea
              value={newActivity.description}
              onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder="介绍一下这个剧本的特点和注意事项..."
              rows={3}
              className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-6 py-2.5 rounded-lg font-medium text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreateActivity}
            disabled={!newActivity.title || !newActivity.scriptName || !newActivity.date}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              newActivity.title && newActivity.scriptName && newActivity.date
                ? 'bg-gradient-gold text-midnight-900 hover:shadow-gold-lg'
                : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
            }`}
          >
            发布活动
          </button>
        </div>
      </Modal>
    </div>
  );
}
