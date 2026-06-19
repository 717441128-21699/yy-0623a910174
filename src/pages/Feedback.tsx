import { useState } from 'react';
import { Star, MessageSquare, TrendingUp, Clock, CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GlassCard from '@/components/GlassCard';
import TasteTag from '@/components/TasteTag';
import Modal from '@/components/Modal';
import StarRating from '@/components/StarRating';
import { ACTIVITY_TYPE_LABELS } from '@/types';

export default function Feedback() {
  const currentUserId = useStore(state => state.currentUserId);
  const getSignupsByMember = useStore(state => state.getSignupsByMember);
  const getFeedbacksByActivity = useStore(state => state.getFeedbacksByActivity);
  const hasSubmittedFeedback = useStore(state => state.hasSubmittedFeedback);
  const submitFeedback = useStore(state => state.submitFeedback);
  const currentPreference = useStore(state => state.getCurrentPreference());
  const isPresident = useStore(state => state.isPresident);
  const activities = useStore(state => state.activities);
  const feedbacks = useStore(state => state.feedbacks);
  const preferences = useStore(state => state.preferences);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [scriptRating, setScriptRating] = useState(0);
  const [atmosphereRating, setAtmosphereRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showStats, setShowStats] = useState(false);

  const mySignups = getSignupsByMember(currentUserId);
  
  const pendingFeedbacks = mySignups.filter(
    s => s.activity.status === 'ended' && !hasSubmittedFeedback(s.activity.id, currentUserId)
  );

  const completedFeedbacks = mySignups.filter(
    s => s.activity.status === 'ended' && hasSubmittedFeedback(s.activity.id, currentUserId)
  );

  const openFeedbackModal = (activityId: string) => {
    setSelectedActivityId(activityId);
    setScriptRating(0);
    setAtmosphereRating(0);
    setComment('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (!selectedActivityId || scriptRating === 0 || atmosphereRating === 0) return;

    submitFeedback(selectedActivityId, scriptRating, atmosphereRating, comment);
    setShowFeedbackModal(false);
    setSelectedActivityId(null);
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const overallScriptAvg = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.scriptRating, 0) / feedbacks.length
    : 0;

  const overallAtmosphereAvg = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.atmosphereRating, 0) / feedbacks.length
    : 0;

  const dimensions = [
    { key: 'logicReasoning', label: '逻辑推理', color: 'bg-crimson-500' },
    { key: 'worldBuilding', label: '世界观脑洞', color: 'bg-mystic-500' },
    { key: 'npcAcceptance', label: 'NPC演绎', color: 'bg-amber-500' },
    { key: 'edgeRoleTolerance', label: '边缘角色', color: 'bg-midnight-400' },
    { key: 'socialPreference', label: '社交互动', color: 'bg-mystic-400' },
  ];

  const getClubPreferenceStats = () => {
    const memberPrefs = Object.values(preferences).filter(p => p.hasCompletedQuiz);
    if (memberPrefs.length === 0) return null;

    const avgScores = dimensions.reduce((acc, dim) => {
      const total = memberPrefs.reduce((sum, p) => sum + p.scores[dim.key as keyof typeof p.scores], 0);
      return { ...acc, [dim.key]: total / memberPrefs.length };
    }, {} as Record<string, number>);

    return avgScores;
  };

  const clubStats = getClubPreferenceStats();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-bold text-midnight-100">
          复盘反馈
        </h2>
        {isPresident && (
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-5 py-2.5 bg-midnight-800 text-midnight-200 font-medium rounded-lg border border-amber-500/20 hover:bg-midnight-700 transition-all flex items-center gap-2"
          >
            <TrendingUp size={18} className="text-amber-400" />
            社团统计
            {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {isPresident && showStats && clubStats && (
        <GlassCard className="p-6 border-amber-500/20">
          <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4 flex items-center gap-2">
            <TrendingUp className="text-amber-400" size={20} />
            社团整体偏好分布
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {dimensions.map(({ key, label }) => (
              <div key={key} className="text-center p-4 bg-midnight-700/30 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-midnight-600/50 border border-amber-500/20">
                  <span className="text-lg font-bold text-amber-400">
                    {clubStats[key].toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-midnight-300">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-midnight-700/30 rounded-lg">
              <p className="text-midnight-400 text-sm mb-2">平均剧本评分</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-amber-400">{overallScriptAvg.toFixed(1)}</span>
                <StarRating value={overallScriptAvg} readOnly size={16} />
              </div>
            </div>
            <div className="p-4 bg-midnight-700/30 rounded-lg">
              <p className="text-midnight-400 text-sm mb-2">平均氛围评分</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-mystic-400">{overallAtmosphereAvg.toFixed(1)}</span>
                <StarRating value={overallAtmosphereAvg} readOnly size={16} />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400 font-medium mb-1">💡 社长小贴士</p>
            <p className="text-sm text-midnight-300">
              根据社团偏好数据，建议近期可以多安排
              {clubStats.logicReasoning > 3.5 ? ' 本格推理本' : ''}
              {clubStats.worldBuilding > 3.5 ? ' 变格沉浸本' : ''}
              {clubStats.socialPreference > 3.5 ? ' 欢乐机制本' : ''}
              {clubStats.logicReasoning <= 3.5 && clubStats.worldBuilding <= 3.5 && clubStats.socialPreference <= 3.5
                ? ' 混合体验本'
                : ''}
              ，社员接受度会更高。
            </p>
          </div>
        </GlassCard>
      )}

      {pendingFeedbacks.length > 0 && (
        <div>
          <h3 className="font-serif text-xl font-bold text-midnight-100 mb-4 flex items-center gap-2">
            <Clock className="text-amber-400" size={22} />
            待评价活动
            <span className="text-sm font-normal text-amber-400">
              ({pendingFeedbacks.length} 场)
            </span>
          </h3>
          <div className="space-y-3">
            {pendingFeedbacks.map(({ activity }) => (
              <GlassCard
                key={activity.id}
                hover
                className="p-5"
                onClick={() => openFeedbackModal(activity.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center text-2xl shadow-gold">
                      🎬
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TasteTag
                          label={ACTIVITY_TYPE_LABELS[activity.type]}
                          variant={
                            activity.type === 'honkaku' ? 'danger' :
                            activity.type === 'henkaku' ? 'mystic' :
                            activity.type === 'fun' ? 'gold' : 'default'
                          }
                          size="sm"
                        />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-midnight-100">
                        {activity.scriptName}
                      </h4>
                      <p className="text-sm text-midnight-400">
                        {activity.date} · {activity.time}
                      </p>
                    </div>
                  </div>

                  <button className="px-5 py-2.5 bg-gradient-gold text-midnight-900 font-semibold rounded-lg shadow-gold hover:shadow-gold-lg transition-all flex items-center gap-2">
                    <Sparkles size={16} />
                    去评价
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-xl font-bold text-midnight-100 mb-4 flex items-center gap-2">
          <CheckCircle className="text-mystic-400" size={22} />
          我的评价
          <span className="text-sm font-normal text-midnight-400">
            ({completedFeedbacks.length} 条)
          </span>
        </h3>

        {completedFeedbacks.length > 0 ? (
          <div className="space-y-3">
            {completedFeedbacks.map(({ activity }) => {
              const myFeedback = getFeedbacksByActivity(activity.id).find(
                f => f.memberId === currentUserId
              );

              return (
                <GlassCard key={activity.id} className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-midnight-700 rounded-xl flex items-center justify-center text-xl">
                      📜
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TasteTag
                          label={ACTIVITY_TYPE_LABELS[activity.type]}
                          variant={
                            activity.type === 'honkaku' ? 'danger' :
                            activity.type === 'henkaku' ? 'mystic' :
                            activity.type === 'fun' ? 'gold' : 'default'
                          }
                          size="sm"
                        />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-midnight-100">
                        {activity.scriptName}
                      </h4>
                      <p className="text-sm text-midnight-400">
                        {activity.date} · {activity.time}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-midnight-700/30 rounded-lg">
                      <p className="text-xs text-midnight-400 mb-1">剧本评分</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={myFeedback?.scriptRating || 0} readOnly size={18} />
                        <span className="text-amber-400 font-bold">{myFeedback?.scriptRating}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-midnight-700/30 rounded-lg">
                      <p className="text-xs text-midnight-400 mb-1">氛围评分</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={myFeedback?.atmosphereRating || 0} readOnly size={18} />
                        <span className="text-mystic-400 font-bold">{myFeedback?.atmosphereRating}</span>
                      </div>
                    </div>
                  </div>

                  {myFeedback?.comment && (
                    <div className="p-3 bg-midnight-700/30 rounded-lg">
                      <p className="text-xs text-midnight-400 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} />
                        评价内容
                      </p>
                      <p className="text-sm text-midnight-200">{myFeedback.comment}</p>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-midnight-400">还没有评价记录</p>
            <p className="text-sm text-midnight-500 mt-1">参加活动结束后记得来写评价哦～</p>
          </GlassCard>
        )}
      </div>

      {currentPreference?.history && currentPreference.history.length > 0 && (
        <GlassCard className="p-6">
          <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4 flex items-center gap-2">
            <TrendingUp className="text-amber-400" size={20} />
            我的口味变化
          </h4>
          <div className="h-48 flex items-end justify-around gap-4">
            {currentPreference.history.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end h-32">
                  {dimensions.map(({ key, color }) => {
                    const score = item.scores[key as keyof typeof item.scores] || 0;
                    const heightPercent = (score / 5) * 100;
                    return (
                      <div
                        key={key}
                        className={`flex-1 ${color} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-midnight-400">{item.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {dimensions.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-midnight-400">{label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="提交评价"
        size="md"
      >
        {selectedActivity && (
          <>
            <div className="mb-6 p-4 bg-midnight-700/30 rounded-lg">
              <p className="text-sm text-midnight-400 mb-1">评价剧本</p>
              <p className="font-serif text-xl font-bold text-midnight-100">
                {selectedActivity.scriptName}
              </p>
              <p className="text-sm text-midnight-400 mt-1">
                {selectedActivity.date} · {selectedActivity.time}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-3 flex items-center gap-2">
                  <Star className="text-amber-400" size={18} />
                  剧本质量评分
                </label>
                <div className="flex items-center gap-4">
                  <StarRating value={scriptRating} onChange={setScriptRating} size={32} />
                  <span className="text-2xl font-bold text-amber-400">
                    {scriptRating > 0 ? scriptRating : '-'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-3 flex items-center gap-2">
                  <MessageSquare className="text-mystic-400" size={18} />
                  氛围体验评分
                </label>
                <div className="flex items-center gap-4">
                  <StarRating value={atmosphereRating} onChange={setAtmosphereRating} size={32} />
                  <span className="text-2xl font-bold text-mystic-400">
                    {atmosphereRating > 0 ? atmosphereRating : '-'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">
                  文字评价（选填）
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="分享一下这次打本的感受吧～"
                  rows={4}
                  className="w-full px-4 py-3 bg-midnight-700/50 border border-midnight-600 rounded-lg text-midnight-100 placeholder-midnight-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400">
                💡 提示：你的评价会帮助社团更好地了解你的口味偏好，
                下次排车时能更精准地为你推荐适合的剧本哦～
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-6 py-2.5 rounded-lg font-medium text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={scriptRating === 0 || atmosphereRating === 0}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  scriptRating > 0 && atmosphereRating > 0
                    ? 'bg-gradient-gold text-midnight-900 hover:shadow-gold-lg'
                    : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
                }`}
              >
                提交评价
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
