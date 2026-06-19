import { useState } from 'react';
import { Calendar, Activity, Award, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GlassCard from '@/components/GlassCard';
import TasteTag from '@/components/TasteTag';
import Modal from '@/components/Modal';
import { quizQuestions } from '@/utils/mockData';
import { MEMBER_LEVEL_LABELS } from '@/types';
import StarRating from '@/components/StarRating';

export default function Profile() {
  const currentMember = useStore(state => state.getCurrentMember());
  const currentPreference = useStore(state => state.getCurrentPreference());
  const submitQuiz = useStore(state => state.submitQuiz);
  const getSignupsByMember = useStore(state => state.getSignupsByMember);
  const getFeedbacksByActivity = useStore(state => state.getFeedbacksByActivity);
  const hasSubmittedFeedback = useStore(state => state.hasSubmittedFeedback);
  const currentUserId = useStore(state => state.currentUserId);

  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionIndex: number }[]>([]);

  const mySignups = getSignupsByMember(currentUserId);
  const endedActivities = mySignups.filter(s => s.activity.status === 'ended');

  const dimensions = [
    { key: 'logicReasoning', label: '逻辑推理', color: 'bg-crimson-500' },
    { key: 'worldBuilding', label: '世界观脑洞', color: 'bg-mystic-500' },
    { key: 'npcAcceptance', label: 'NPC演绎', color: 'bg-amber-500' },
    { key: 'edgeRoleTolerance', label: '边缘角色', color: 'bg-midnight-400' },
    { key: 'socialPreference', label: '社交互动', color: 'bg-mystic-400' },
  ];

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(
      a => a.questionId === quizQuestions[currentQuestion].id
    );

    if (existingIndex >= 0) {
      newAnswers[existingIndex].optionIndex = optionIndex;
    } else {
      newAnswers.push({
        questionId: quizQuestions[currentQuestion].id,
        optionIndex,
      });
    }

    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(answers);
      setShowQuiz(false);
      setCurrentQuestion(0);
      setAnswers([]);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentAnswer = answers.find(
    a => a.questionId === quizQuestions[currentQuestion]?.id
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-bold text-midnight-100">
          成员档案
        </h2>
        {!currentPreference?.hasCompletedQuiz && (
          <button
            onClick={() => setShowQuiz(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-midnight-900 font-semibold rounded-lg shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Sparkles size={18} />
            做偏好测评
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-1" glow>
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={currentMember?.avatar}
                alt={currentMember?.name}
                className="w-24 h-24 rounded-full border-4 border-amber-500/50 mx-auto shadow-gold-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-midnight-900 text-xs font-bold shadow-lg">
                {currentMember?.activityCount}
              </div>
            </div>

            <h3 className="mt-4 font-serif text-2xl font-bold text-midnight-100">
              {currentMember?.name}
            </h3>

            <div className="mt-2 flex items-center justify-center gap-2">
              <TasteTag
                label={MEMBER_LEVEL_LABELS[currentMember?.level || 'new']}
                variant="gold"
                size="sm"
              />
              <TasteTag
                label={currentMember?.role === 'president' ? '社长' : '社员'}
                variant="mystic"
                size="sm"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-midnight-700/50 rounded-lg">
                <p className="text-2xl font-bold text-amber-400">
                  {currentMember?.activityCount}
                </p>
                <p className="text-xs text-midnight-400">参与场次</p>
              </div>
              <div className="p-3 bg-midnight-700/50 rounded-lg">
                <p className="text-2xl font-bold text-mystic-400">
                  {currentPreference?.tags.length || 0}
                </p>
                <p className="text-xs text-midnight-400">口味标签</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-midnight-400 text-sm">
              <Calendar size={14} />
              入社时间：{currentMember?.joinDate}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-6">
            <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4 flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              口味标签
            </h4>

            <div className="flex flex-wrap gap-2">
              {currentPreference?.hasCompletedQuiz ? (
                currentPreference.tags.map((tag, index) => (
                  <TasteTag
                    key={index}
                    label={tag}
                    variant={index === 0 ? 'gold' : index % 3 === 0 ? 'success' : 'default'}
                    size="lg"
                    className="animate-float"
                    style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                  />
                ))
              ) : (
                <div className="text-midnight-400 text-center w-full py-4">
                  <p>完成偏好测评后，这里会显示你的口味标签 🎭</p>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="mt-3 text-amber-400 hover:text-amber-300 font-medium"
                  >
                    立即测评 →
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} />
              偏好维度
            </h4>

            <div className="space-y-4">
              {dimensions.map(({ key, label, color }) => {
                const score = currentPreference?.scores[key as keyof typeof currentPreference.scores] || 0;
                const percentage = (score / 5) * 100;

                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-midnight-300">{label}</span>
                      <span className="text-midnight-400">{score.toFixed(1)}/5</span>
                    </div>
                    <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {currentPreference?.history && currentPreference.history.length > 1 && (
        <GlassCard className="p-6">
          <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4">
            偏好变化趋势
          </h4>
          <div className="h-48 flex items-end justify-around gap-4">
            {currentPreference.history.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end h-32">
                  {dimensions.map(({ key, color }) => {
                    const height = ((item.scores[key as keyof typeof item.scores] || 0) / 5) * 100;
                    return (
                      <div
                        key={key}
                        className={`flex-1 ${color} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                        style={{ height: `${height}%` }}
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

      <GlassCard className="p-6">
        <h4 className="font-serif text-lg font-bold text-midnight-100 mb-4 flex items-center gap-2">
          <Activity className="text-amber-400" size={20} />
          历史活动
        </h4>

        {endedActivities.length > 0 ? (
          <div className="space-y-3">
            {endedActivities.map(({ activity }) => {
              const feedbacks = getFeedbacksByActivity(activity.id);
              const myFeedback = feedbacks.find(f => f.memberId === currentUserId);
              const hasFeedback = hasSubmittedFeedback(activity.id, currentUserId);

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-midnight-700/30 rounded-lg hover:bg-midnight-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center text-xl">
                      🎬
                    </div>
                    <div>
                      <p className="font-medium text-midnight-100">{activity.scriptName}</p>
                      <p className="text-sm text-midnight-400">
                        {activity.date} · {activity.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {hasFeedback && myFeedback && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <StarRating
                            value={myFeedback.scriptRating}
                            readOnly
                            size={14}
                          />
                        </div>
                        <p className="text-xs text-midnight-500 mt-1">已评价</p>
                      </div>
                    )}
                    <ChevronRight className="text-midnight-500" size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-midnight-400">
            <p className="text-4xl mb-2">🎲</p>
            <p>还没有参加过活动，快去活动排车页报名吧！</p>
          </div>
        )}
      </GlassCard>

      <Modal
        isOpen={showQuiz}
        onClose={() => {
          setShowQuiz(false);
          setCurrentQuestion(0);
          setAnswers([]);
        }}
        title="偏好测评"
        size="lg"
      >
        <div className="mb-6">
          <div className="flex justify-between text-sm text-midnight-400 mb-2">
            <span>问题 {currentQuestion + 1} / {quizQuestions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-gold rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h4 className="font-serif text-xl font-bold text-midnight-100 mb-6">
            {quizQuestions[currentQuestion].question}
          </h4>

          <div className="space-y-3">
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  currentAnswer?.optionIndex === index
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-midnight-600 bg-midnight-700/50 text-midnight-200 hover:border-midnight-500 hover:bg-midnight-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      currentAnswer?.optionIndex === index
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-midnight-500'
                    }`}
                  >
                    {currentAnswer?.optionIndex === index && (
                      <div className="w-2 h-2 bg-midnight-900 rounded-full" />
                    )}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              currentQuestion === 0
                ? 'text-midnight-500 cursor-not-allowed'
                : 'text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700'
            }`}
          >
            上一题
          </button>

          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              currentAnswer
                ? 'bg-gradient-gold text-midnight-900 hover:shadow-gold-lg'
                : 'bg-midnight-700 text-midnight-500 cursor-not-allowed'
            }`}
          >
            {currentQuestion === quizQuestions.length - 1 ? '完成测评' : '下一题'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
