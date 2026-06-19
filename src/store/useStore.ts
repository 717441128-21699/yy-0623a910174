import { create } from 'zustand';
import type {
  Member,
  Preference,
  Activity,
  ActivitySignup,
  Feedback,
  PreferenceScores,
  ActivityType,
} from '@/types';
import {
  mockMembers,
  mockPreferences,
  mockActivities,
  mockSignups,
  mockFeedbacks,
  CURRENT_USER_ID,
  quizQuestions,
} from '@/utils/mockData';
import { calculateMatchScore, generateTags, determineTier } from '@/utils/matching';
import { saveToStorage, loadFromStorage } from '@/utils/storage';

interface StoreState {
  currentUserId: string;
  members: Member[];
  preferences: Record<string, Preference>;
  activities: Activity[];
  signups: ActivitySignup[];
  feedbacks: Feedback[];
  isPresident: boolean;

  getCurrentMember: () => Member | undefined;
  getCurrentPreference: () => Preference | undefined;
  getMemberById: (id: string) => Member | undefined;
  getPreferenceByMemberId: (id: string) => Preference | undefined;

  submitQuiz: (answers: { questionId: string; optionIndex: number }[]) => void;
  createActivity: (data: Omit<Activity, 'id' | 'createdBy' | 'createdAt' | 'status'>) => void;
  signupActivity: (activityId: string) => void;
  cancelSignup: (activityId: string) => void;
  submitFeedback: (activityId: string, scriptRating: number, atmosphereRating: number, comment: string) => void;

  getSignupsByActivity: (activityId: string) => (ActivitySignup & { member: Member })[];
  getSignupsByMember: (memberId: string) => (ActivitySignup & { activity: Activity })[];
  getFeedbacksByActivity: (activityId: string) => (Feedback & { member: Member })[];
  getActivitiesByStatus: (status: Activity['status']) => Activity[];
  hasSubmittedFeedback: (activityId: string, memberId: string) => boolean;
  isSignedUp: (activityId: string, memberId: string) => boolean;
}

const initialState = {
  currentUserId: CURRENT_USER_ID,
  members: mockMembers,
  preferences: mockPreferences,
  activities: mockActivities,
  signups: mockSignups,
  feedbacks: mockFeedbacks,
};

function getInitialState() {
  const saved = loadFromStorage<typeof initialState>();
  return saved || initialState;
}

export const useStore = create<StoreState>((set, get) => {
  const state = getInitialState();

  return {
    ...state,

    get isPresident() {
      const member = get().members.find(m => m.id === get().currentUserId);
      return member?.role === 'president';
    },

    getCurrentMember: () => {
      return get().members.find(m => m.id === get().currentUserId);
    },

    getCurrentPreference: () => {
      return get().preferences[get().currentUserId];
    },

    getMemberById: (id: string) => {
      return get().members.find(m => m.id === id);
    },

    getPreferenceByMemberId: (id: string) => {
      return get().preferences[id];
    },

    submitQuiz: (answers) => {
      const { currentUserId, preferences } = get();
      const scores: PreferenceScores = {
        logicReasoning: 3,
        worldBuilding: 3,
        npcAcceptance: 3,
        edgeRoleTolerance: 3,
        socialPreference: 3,
      };

      const dimensionCounts: Record<keyof PreferenceScores, number> = {
        logicReasoning: 1,
        worldBuilding: 1,
        npcAcceptance: 1,
        edgeRoleTolerance: 1,
        socialPreference: 1,
      };

      answers.forEach(({ questionId, optionIndex }) => {
        const question = quizQuestions.find((q: { id: string }) => q.id === questionId);
        if (question) {
          const option = question.options[optionIndex];
          const dim = option.dimension;
          scores[dim] = (scores[dim] * dimensionCounts[dim] + option.value) / (dimensionCounts[dim] + 1);
          dimensionCounts[dim]++;
        }
      });

      const tags = generateTags(scores);
      const currentPref = preferences[currentUserId];
      const newHistory = currentPref?.history || [];
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (newHistory.length === 0 || newHistory[newHistory.length - 1].date !== currentMonth) {
        newHistory.push({ date: currentMonth, scores: { ...scores } });
      } else {
        newHistory[newHistory.length - 1].scores = { ...scores };
      }

      const newPreferences = {
        ...preferences,
        [currentUserId]: {
          memberId: currentUserId,
          scores,
          tags,
          lastUpdated: new Date().toISOString().split('T')[0],
          hasCompletedQuiz: true,
          history: newHistory,
        },
      };

      set({ preferences: newPreferences });
      saveToStorage({ ...get(), preferences: newPreferences });
    },

    createActivity: (data) => {
      const { activities, currentUserId } = get();
      const newActivity: Activity = {
        ...data,
        id: `a${Date.now()}`,
        createdBy: currentUserId,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'upcoming',
      };

      const newActivities = [...activities, newActivity];
      set({ activities: newActivities });
      saveToStorage({ ...get(), activities: newActivities });
    },

    signupActivity: (activityId) => {
      const { signups, activities, preferences, members, currentUserId } = get();
      const activity = activities.find(a => a.id === activityId);
      const pref = preferences[currentUserId];
      const member = members.find(m => m.id === currentUserId);

      if (!activity || !pref || !member) return;

      const matchScore = calculateMatchScore(pref.scores, activity.type);
      const existingSignups = signups.filter(s => s.activityId === activityId);
      const filledCoreSlots = existingSignups.filter(s => s.tier === 'core').length;
      const tier = determineTier(matchScore, member.level, filledCoreSlots, activity.totalSlots);

      const newSignup: ActivitySignup = {
        id: `s${Date.now()}`,
        activityId,
        memberId: currentUserId,
        matchScore,
        tier,
        signedUpAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      const newSignups = [...signups, newSignup];
      set({ signups: newSignups });
      saveToStorage({ ...get(), signups: newSignups });
    },

    cancelSignup: (activityId) => {
      const { signups, currentUserId } = get();
      const newSignups = signups.filter(
        s => !(s.activityId === activityId && s.memberId === currentUserId)
      );
      set({ signups: newSignups });
      saveToStorage({ ...get(), signups: newSignups });
    },

    submitFeedback: (activityId, scriptRating, atmosphereRating, comment) => {
      const { feedbacks, currentUserId, preferences } = get();

      const newFeedback: Feedback = {
        id: `f${Date.now()}`,
        activityId,
        memberId: currentUserId,
        scriptRating,
        atmosphereRating,
        comment,
        submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      const newFeedbacks = [...feedbacks, newFeedback];
      set({ feedbacks: newFeedbacks });

      const currentPref = preferences[currentUserId];
      if (currentPref && currentPref.hasCompletedQuiz) {
        const { activities } = get();
        const activity = activities.find(a => a.id === activityId);
        if (activity) {
          const avgRating = (scriptRating + atmosphereRating) / 2;
          const adjustment = (avgRating - 3) * 0.1;

          const newScores = { ...currentPref.scores };
          const typeWeights: Record<ActivityType, (keyof PreferenceScores)[]> = {
            honkaku: ['logicReasoning'],
            henkaku: ['worldBuilding', 'npcAcceptance'],
            fun: ['socialPreference', 'npcAcceptance'],
            mixed: ['logicReasoning', 'worldBuilding', 'socialPreference'],
          };

          const affectedDimensions = typeWeights[activity.type];
          affectedDimensions.forEach(dim => {
            newScores[dim] = Math.max(1, Math.min(5, newScores[dim] + adjustment));
          });

          const newTags = generateTags(newScores);
          const currentMonth = new Date().toISOString().slice(0, 7);
          const newHistory = [...currentPref.history];

          if (newHistory.length === 0 || newHistory[newHistory.length - 1].date !== currentMonth) {
            newHistory.push({ date: currentMonth, scores: { ...newScores } });
          } else {
            newHistory[newHistory.length - 1].scores = { ...newScores };
          }

          const newPreferences = {
            ...preferences,
            [currentUserId]: {
              ...currentPref,
              scores: newScores,
              tags: newTags,
              lastUpdated: new Date().toISOString().split('T')[0],
              history: newHistory,
            },
          };

          set({ preferences: newPreferences });
          saveToStorage({ ...get(), feedbacks: newFeedbacks, preferences: newPreferences });
          return;
        }
      }

      saveToStorage({ ...get(), feedbacks: newFeedbacks });
    },

    getSignupsByActivity: (activityId) => {
      const { signups, members } = get();
      return signups
        .filter(s => s.activityId === activityId)
        .map(s => ({
          ...s,
          member: members.find(m => m.id === s.memberId)!,
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
    },

    getSignupsByMember: (memberId) => {
      const { signups, activities } = get();
      return signups
        .filter(s => s.memberId === memberId)
        .map(s => ({
          ...s,
          activity: activities.find(a => a.id === s.activityId)!,
        }));
    },

    getFeedbacksByActivity: (activityId) => {
      const { feedbacks, members } = get();
      return feedbacks
        .filter(f => f.activityId === activityId)
        .map(f => ({
          ...f,
          member: members.find(m => m.id === f.memberId)!,
        }));
    },

    getActivitiesByStatus: (status) => {
      return get().activities
        .filter(a => a.status === status)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    hasSubmittedFeedback: (activityId, memberId) => {
      return get().feedbacks.some(
        f => f.activityId === activityId && f.memberId === memberId
      );
    },

    isSignedUp: (activityId, memberId) => {
      return get().signups.some(
        s => s.activityId === activityId && s.memberId === memberId
      );
    },
  };
});
