import { useState } from 'react';
import { Plus, Calendar, Clock, Users, ChevronDown, ChevronUp, Crown, Zap, Coffee, AlertTriangle, CheckCircle, ListPlus, Sparkles, Star, ArrowUp, Send, X, Clock8 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GlassCard from '@/components/GlassCard';
import TasteTag from '@/components/TasteTag';
import Modal from '@/components/Modal';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS, TIER_LABELS, type ActivityType, MEMBER_LEVEL_LABELS, INVITATION_STATUS_LABELS } from '@/types';
import { getRecommendReason } from '@/utils/matching';

export default function Events() {
  const isPresident = useStore(state => state.isPresident);
  const activities = useStore(state => state.activities);
  const createActivity = useStore(state => state.createActivity);
  const signupActivity = useStore(state => state.signupActivity);
  const cancelSignup = useStore(state => state.cancelSignup);
  const getSignupsByActivity = useStore(state => state.getSignupsByActivity);
  const getInvitationsByActivity = useStore(state => state.getInvitationsByActivity);
  const sendInvitation = useStore(state => state.sendInvitation);
  const isSignedUp = useStore(state => state.isSignedUp);
  const isOnWaitlist = useStore(state => state.isOnWaitlist);
  const currentUserId = useStore(state => state.currentUserId);
  const getPreferenceByMemberId = useStore(state => state.getPreferenceByMemberId);
  const calculateVeteranRatio = useStore(state => state.calculateVeteranRatio);
  const getRecommendationsForActivity = useStore(state => state.getRecommendationsForActivity);
  const hasPendingInvitation = useStore(state => state.hasPendingInvitation);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);

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

  const recommendations = getRecommendationsForActivity(
    newActivity.type,
    newActivity.totalSlots,
    newActivity.veteranRatio
  );

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

  const handleSendInvitation = (activityId: string, memberId: string) => {
    const message = inviteMessage.trim() || undefined;
    sendInvitation(activityId, memberId, message);
    setInviteMessage('');
    setShowInviteModal(null);
  };

  const toggleExpand = (activityId: string) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const renderActivityCard = (activity: typeof activities[0], isEnded = false) => {
    const signups = getSignupsByActivity(activity.id);
    const invitations = getInvitationsByActivity(activity.id);
    const signedUp = isSignedUp(activity.id, currentUserId);
    const onWaitlist = isOnWaitlist(activity.id, currentUserId);
    const isExpanded = expandedActivity === activity.id;
    const totalFormal = Math.min(signups.length, activity.totalSlots);
    const waitlistCount = Math.max(0, signups.length - activity.totalSlots);

    const formalSignups = signups.filter(s => !s.isWaitlist);
    const waitlistSignups = signups.filter(s => s.isWaitlist);

    const coreSignups = formalSignups.filter(s => s.tier === 'core' && !s.isLowMatch);
    const experienceSignups = formalSignups.filter(s => s.tier === 'experience' && !s.isLowMatch);
    const lowMatchSignups = formalSignups.filter(s => s.isLowMatch);

    const pendingInvitations = invitations.filter(i => i.status === 'pending');

    const veteranRatio = calculateVeteranRatio(activity.id);
    const ratioOk = veteranRatio.ok;

    const activityRecommendations = isPresident && !isEnded
      ? getRecommendationsForActivity(activity.type, activity.totalSlots, activity.veteranRatio, activity.id)
      : null;

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
            <div className="flex items-center gap-2">
              {!isEnded && signedUp && (
                <TasteTag
                  label={onWaitlist ? '候补中' : '已报名'}
                  variant={onWaitlist ? 'default' : 'success'}
                  size="sm"
                />
              )}
              {pendingInvitations.length > 0 && (
                <TasteTag label={`邀请 ${pendingInvitations.length}`} variant="default" size="sm" />
              )}
              {waitlistCount > 0 && !isEnded && (
                <TasteTag label={`候补 ${waitlistCount}人`} variant="default" size="sm" />
              )}
            </div>
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
              {totalFormal}/{activity.totalSlots}
            </div>
          </div>

          <p className="text-sm text-midnight-300 line-clamp-2 mb-4">
            {activity.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {formalSignups.slice(0, 5).map(signup => (
                <img
                  key={signup.id}
                  src={signup.member.avatar}
                  alt={signup.member.name}
                  className={`w-8 h-8 rounded-full border-2 border-midnight-800 ${signup.isLowMatch ? 'opacity-50' : ''}`}
                />
              ))}
              {formalSignups.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-midnight-700 border-2 border-midnight-800 flex items-center justify-center text-xs text-midnight-400">
                  +{formalSignups.length - 5}
                </div>
              )}
              {waitlistCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-midnight-800 border-2 border-dashed border-midnight-600 flex items-center justify-center text-xs text-midnight-500 ml-1">
                  +{waitlistCount}
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
                      : totalFormal >= activity.totalSlots
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50'
                        : 'bg-gradient-gold text-midnight-900 hover:shadow-gold-lg'
                  }`}
                >
                  {signedUp
                    ? '取消报名'
                    : totalFormal >= activity.totalSlots
                      ? '加入候补'
                      : '立即报名'}
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
              <>
                <div className={`mb-4 p-4 rounded-lg ${
                  ratioOk ? 'bg-mystic-500/10 border border-mystic-500/30' : 'bg-crimson-500/10 border border-crimson-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {ratioOk ? (
                      <CheckCircle className="text-mystic-400 shrink-0 mt-0.5" size={22} />
                    ) : (
                      <AlertTriangle className="text-crimson-400 shrink-0 mt-0.5" size={22} />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-bold ${ratioOk ? 'text-mystic-400' : 'text-crimson-400'}`}>
                          老带新比例：{Math.round(veteranRatio.current * 100)}% / 目标 {Math.round(activity.veteranRatio * 100)}%
                        </p>
                        <div className="text-xs text-midnight-400">
                          正式 {totalFormal}人 · 候补 {waitlistCount}人
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm mt-3">
                        <div className="bg-midnight-800/60 rounded p-2 text-center">
                          <p className="text-amber-400 font-bold">{veteranRatio.veteranCount}</p>
                          <p className="text-xs text-midnight-400">老玩家</p>
                        </div>
                        <div className="bg-midnight-800/60 rounded p-2 text-center">
                          <p className="text-mystic-400 font-bold">{veteranRatio.newbieCount}</p>
                          <p className="text-xs text-midnight-400">新社员</p>
                        </div>
                        <div className="bg-midnight-800/60 rounded p-2 text-center">
                          <p className={`font-bold ${veteranRatio.needMoreVeterans > 0 ? 'text-crimson-400' : 'text-mystic-400'}`}>
                            {veteranRatio.needMoreVeterans > 0 ? `缺${veteranRatio.needMoreVeterans}` : '够了'}
                          </p>
                          <p className="text-xs text-midnight-400">还差老玩家</p>
                        </div>
                        <div className="bg-midnight-800/60 rounded p-2 text-center">
                          <p className={`font-bold ${veteranRatio.needMoreNewbies > 0 ? 'text-crimson-400' : 'text-mystic-400'}`}>
                            {veteranRatio.needMoreNewbies > 0 ? `缺${veteranRatio.needMoreNewbies}` : '够了'}
                          </p>
                          <p className="text-xs text-midnight-400">还差新社员</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {activityRecommendations && (
                  <div className="mb-4 border border-amber-500/20 rounded-xl p-4 bg-amber-500/5">
                    <h5 className="font-serif text-base font-bold text-amber-400 mb-3 flex items-center gap-2">
                      <Sparkles size={16} />
                      智能推荐邀请
                      <span className="text-xs font-normal text-midnight-400 ml-2">
                        点击「邀请」按钮直接发送邀请
                      </span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-midnight-300 mb-2">
                          推荐老玩家 {activityRecommendations.neededVeterans > 0 &&
                            <span className="text-crimson-400">（还差 {activityRecommendations.neededVeterans} 位）</span>}
                        </p>
                        {activityRecommendations.recommendedVeterans.length > 0 ? (
                          <div className="space-y-2">
                            {activityRecommendations.recommendedVeterans.map(m => {
                              const pref = getPreferenceByMemberId(m.id);
                              const reasons = pref ? getRecommendReason(pref.scores, activity.type, m.level) : [];
                              const invited = hasPendingInvitation(activity.id, m.id);
                              return (
                                <div key={m.id} className="flex items-center justify-between p-2.5 bg-midnight-800/60 rounded-lg">
                                  <div className="flex items-center gap-2.5">
                                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-midnight-100 flex items-center gap-1.5">
                                        {m.name}
                                        {invited && <TasteTag label="已邀请" size="sm" variant="default" />}
                                      </p>
                                      <p className="text-xs text-midnight-400 truncate">{reasons.join(' · ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-crimson-400">{m.matchScore}%</span>
                                    {!invited && (
                                      <button
                                        onClick={() => setShowInviteModal(`${activity.id}-${m.id}`)}
                                        className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Send size={12} />
                                        邀请
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-midnight-500 py-2">暂无推荐</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-midnight-300 mb-2">
                          推荐新社员 {activityRecommendations.neededNewbies > 0 &&
                            <span className="text-crimson-400">（还差 {activityRecommendations.neededNewbies} 位）</span>}
                        </p>
                        {activityRecommendations.recommendedNewbies.length > 0 ? (
                          <div className="space-y-2">
                            {activityRecommendations.recommendedNewbies.map(m => {
                              const pref = getPreferenceByMemberId(m.id);
                              const reasons = pref ? getRecommendReason(pref.scores, activity.type, m.level) : [];
                              const invited = hasPendingInvitation(activity.id, m.id);
                              return (
                                <div key={m.id} className="flex items-center justify-between p-2.5 bg-midnight-800/60 rounded-lg">
                                  <div className="flex items-center gap-2.5">
                                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-midnight-100 flex items-center gap-1.5">
                                        {m.name}
                                        {invited && <TasteTag label="已邀请" size="sm" variant="default" />}
                                      </p>
                                      <p className="text-xs text-midnight-400 truncate">{reasons.join(' · ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-mystic-400">{m.matchScore}%</span>
                                    {!invited && (
                                      <button
                                        onClick={() => setShowInviteModal(`${activity.id}-${m.id}`)}
                                        className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Send size={12} />
                                        邀请
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-midnight-500 py-2">暂无推荐</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {pendingInvitations.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <Clock8 size={16} />
                  待确认邀请 ({pendingInvitations.length})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pendingInvitations.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <img src={inv.member.avatar} alt={inv.member.name} className="w-9 h-9 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-midnight-100">{inv.member.name}</p>
                        {inv.message && (
                          <p className="text-xs text-midnight-400 truncate">"{inv.message}"</p>
                        )}
                        <p className="text-xs text-midnight-500">{inv.createdAt}</p>
                      </div>
                      <TasteTag label={INVITATION_STATUS_LABELS[inv.status]} size="sm" variant="default" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-bold text-crimson-400 mb-2 flex items-center gap-2">
                  <Zap size={16} />
                  核心盘手 ({coreSignups.length})
                  <span className="text-xs font-normal text-midnight-500">匹配度≥80%，适合带队推理</span>
                </h5>
                {coreSignups.length > 0 ? (
                  <div className="space-y-2">
                    {coreSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-3 bg-crimson-500/10 rounded-lg border border-crimson-500/20">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={signup.member.avatar}
                              alt={signup.member.name}
                              className="w-9 h-9 rounded-full"
                            />
                            {signup.member.level !== 'new' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-crimson-500 rounded-full flex items-center justify-center">
                                <Star size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-midnight-100 flex items-center gap-2">
                              {signup.member.name}
                              <TasteTag label={MEMBER_LEVEL_LABELS[signup.member.level]} size="sm" variant="default" />
                            </p>
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
                  <span className="text-xs font-normal text-midnight-500">匹配度50-80%</span>
                </h5>
                {experienceSignups.length > 0 ? (
                  <div className="space-y-2">
                    {experienceSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-3 bg-mystic-500/10 rounded-lg border border-mystic-500/20">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={signup.member.avatar}
                              alt={signup.member.name}
                              className="w-9 h-9 rounded-full"
                            />
                            {signup.member.level !== 'new' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-mystic-500 rounded-full flex items-center justify-center">
                                <Star size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-midnight-100 flex items-center gap-2">
                              {signup.member.name}
                              <TasteTag label={MEMBER_LEVEL_LABELS[signup.member.level]} size="sm" variant="default" />
                            </p>
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

              {lowMatchSignups.length > 0 && (
                <div>
                  <h5 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    待调整 ({lowMatchSignups.length})
                    <span className="text-xs font-normal text-midnight-500">匹配度{'<'}50%，可考虑调整</span>
                  </h5>
                  <div className="space-y-2">
                    {lowMatchSignups.map(signup => (
                      <div key={signup.id} className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={signup.member.avatar}
                              alt={signup.member.name}
                              className="w-9 h-9 rounded-full opacity-70"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-midnight-200 flex items-center gap-2">
                              {signup.member.name}
                              <TasteTag label={MEMBER_LEVEL_LABELS[signup.member.level]} size="sm" variant="default" />
                            </p>
                            <p className="text-xs text-midnight-400">
                              {getPreferenceByMemberId(signup.member.id)?.tags.slice(0, 2).join(' · ') || '暂无标签'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-400">{signup.matchScore}%</p>
                          <p className="text-xs text-midnight-500">匹配度低</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {waitlistSignups.length > 0 && (
                <div>
                  <h5 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <ListPlus size={16} />
                    候补名单 ({waitlistSignups.length})
                    <span className="text-xs font-normal text-midnight-500">有空位时按匹配度自动递补</span>
                  </h5>
                  <div className="space-y-2">
                    {waitlistSignups.map((signup, idx) => (
                      <div key={signup.id} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                            #{idx + 1}
                          </div>
                          <img
                            src={signup.member.avatar}
                            alt={signup.member.name}
                            className="w-8 h-8 rounded-full opacity-70"
                          />
                          <div>
                            <p className="text-sm font-medium text-midnight-200 flex items-center gap-2">
                              {signup.member.name}
                              <TasteTag label={MEMBER_LEVEL_LABELS[signup.member.level]} size="sm" variant="default" />
                            </p>
                            <p className="text-xs text-midnight-500">
                              {getPreferenceByMemberId(signup.member.id)?.tags.slice(0, 2).join(' · ') || '暂无标签'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <ArrowUp size={12} className="text-amber-400" />
                          <p className="text-sm font-medium text-amber-400">{signup.matchScore}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showInviteModal?.startsWith(`${activity.id}-`) && (
          <Modal
            isOpen={true}
            onClose={() => setShowInviteModal(null)}
            title="发送邀请"
            size="sm"
          >
            {(() => {
              const memberId = showInviteModal.split('-')[1];
              const member = useStore.getState().members.find(m => m.id === memberId);
              return member ? (
                <>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-midnight-700/30 rounded-lg">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-medium text-midnight-100">{member.name}</p>
                      <p className="text-sm text-midnight-400">{MEMBER_LEVEL_LABELS[member.level]}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      附言（可选）
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={e => setInviteMessage(e.target.value)}
                      placeholder="例如：周六推理局缺个老玩家撑场子，来吗？"
                      rows={2}
                      className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowInviteModal(null)}
                      className="px-5 py-2 rounded-lg font-medium text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSendInvitation(activity.id, memberId)}
                      className="px-5 py-2 bg-gradient-gold text-midnight-900 font-medium rounded-lg hover:shadow-gold-lg transition-all flex items-center gap-2"
                    >
                      <Send size={16} />
                      发送邀请
                    </button>
                  </div>
                </>
              ) : null;
            })()}
          </Modal>
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
        size="xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-midnight-200 mb-3">
              剧本类型
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    {type === 'honkaku' && '重逻辑推理'}
                    {type === 'henkaku' && '重世界观'}
                    {type === 'fun' && '重游戏机制'}
                    {type === 'mixed' && '综合体验'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                老带新：{Math.round(newActivity.veteranRatio * 100)}%
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
              rows={2}
              className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
            />
          </div>

          {isPresident && (
            <div className="border border-amber-500/20 rounded-xl p-4 bg-amber-500/5">
              <h5 className="font-serif text-base font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles size={16} />
                智能推荐报名
                <span className="text-xs font-normal text-midnight-400 ml-2">
                  需要 {recommendations.neededVeterans} 位老玩家 + {recommendations.neededNewbies} 位新社员
                </span>
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-midnight-300 mb-2">推荐老玩家</p>
                  {recommendations.recommendedVeterans.length > 0 ? (
                    <div className="space-y-2">
                      {recommendations.recommendedVeterans.slice(0, 3).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-midnight-800/60 rounded-lg">
                          <div className="flex items-center gap-2">
                            <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full" />
                            <div>
                              <p className="text-sm text-midnight-100">{m.name}</p>
                              <p className="text-xs text-midnight-400">{m.reasons.join(' · ')}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-crimson-400">{m.matchScore}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-midnight-500">暂无合适的老玩家推荐</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-midnight-300 mb-2">推荐新社员</p>
                  {recommendations.recommendedNewbies.length > 0 ? (
                    <div className="space-y-2">
                      {recommendations.recommendedNewbies.slice(0, 3).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-midnight-800/60 rounded-lg">
                          <div className="flex items-center gap-2">
                            <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full" />
                            <div>
                              <p className="text-sm text-midnight-100">{m.name}</p>
                              <p className="text-xs text-midnight-400">{m.reasons.join(' · ')}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-mystic-400">{m.matchScore}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-midnight-500">暂无合适的新社员推荐</p>
                  )}
                </div>
              </div>
            </div>
          )}
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
