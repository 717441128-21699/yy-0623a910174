import { create } from 'zustand';
import type {
  Member,
  Preference,
  Activity,
  ActivitySignup,
  Feedback,
  PreferenceScores,
  ActivityType,
  ActivityInvitation,
  InvitationStatus,
} from '@/types';
import {
  mockMembers,
  mockPreferences,
  mockActivities,
  mockSignups,
  mockFeedbacks,
  mockInvitations,
  CURRENT_USER_ID,
  quizQuestions,
} from '@/utils/mockData';
import { calculateMatchScore, generateTags, determineTier, getSmartRecommendations, calculateActivityTypeFit } from '@/utils/matching';
import { saveToStorage, loadFromStorage } from '@/utils/storage';

interface StoreState {
  currentUserId: string;
  members: Member[];
  preferences: Record<string, Preference>;
  activities: Activity[];
  signups: ActivitySignup[];
  feedbacks: Feedback[];
  invitations: ActivityInvitation[];

  get isPresident(): boolean;
  getCurrentMember: () => Member | undefined;
  getCurrentPreference: () => Preference | undefined;
  getMemberById: (id: string) => Member | undefined;
  getPreferenceByMemberId: (id: string) => Preference | undefined;

  switchUser: (userId: string) => void;
  submitQuiz: (answers: { questionId: string; optionIndex: number }[]) => void;
  createActivity: (
    data: Omit<Activity, 'id' | 'createdBy' | 'createdAt' | 'status'>,
    invitedMemberIds?: string[]
  ) => void;
  signupActivity: (activityId: string) => void;
  cancelSignup: (activityId: string) => void;
  submitFeedback: (activityId: string, scriptRating: number, atmosphereRating: number, comment: string) => void;

  sendInvitation: (activityId: string, memberId: string, message?: string) => void;
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  revokeInvitation: (invitationId: string) => void;
  getInvitationsByMember: (memberId: string) => (ActivityInvitation & { activity: Activity; inviter: Member })[];
  getInvitationsByActivity: (activityId: string) => (ActivityInvitation & { member: Member; inviter: Member })[];
  hasPendingInvitation: (activityId: string, memberId: string) => boolean;
  hasDeclinedInvitation: (activityId: string, memberId: string) => boolean;

  getSignupsByActivity: (activityId: string) => (ActivitySignup & {
    member: Member;
    isWaitlist: boolean;
    isLowMatch: boolean;
    waitlistPosition?: number;
  })[];
  getSignupsByMember: (memberId: string) => (ActivitySignup & { activity: Activity; isWaitlist: boolean; waitlistPosition?: number })[];
  getFeedbacksByActivity: (activityId: string) => (Feedback & { member: Member })[];
  getActivitiesByStatus: (status: Activity['status']) => Activity[];
  hasSubmittedFeedback: (activityId: string, memberId: string) => boolean;
  isSignedUp: (activityId: string, memberId: string) => boolean;
  isOnWaitlist: (activityId: string, memberId: string) => boolean;
  calculateVeteranRatio: (activityId: string) => {
    current: number;
    required: number;
    ok: boolean;
    veteranCount: number;
    newbieCount: number;
    needMoreVeterans: number;
    needMoreNewbies: number;
  };
  getActivityTypeFit: (memberId: string) => Record<ActivityType, number>;
  getRecommendationsForActivity: (
    activityType: ActivityType,
    totalSlots: number,
    veteranRatio: number,
    activityId?: string
  ) => ReturnType<typeof getSmartRecommendations>;
}

const initialState = {
  currentUserId: CURRENT_USER_ID,
  members: mockMembers,
  preferences: mockPreferences,
  activities: mockActivities,
  signups: mockSignups,
  feedbacks: mockFeedbacks,
  invitations: mockInvitations,
};

function getInitialState() {
  const saved = loadFromStorage<typeof initialState>();
  return saved || initialState;
}

export const useStore = create<StoreState>((set, get) => {
  const state = getInitialState();

  const persist = () => saveToStorage(get());

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

    switchUser: (userId) => {
      set({ currentUserId: userId });
      persist();
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
      persist();
    },

    createActivity: (data, invitedMemberIds) => {
      const { activities, currentUserId, invitations } = get();
      const activityId = `a${Date.now()}`;
      const newActivity: Activity = {
        ...data,
        id: activityId,
        createdBy: currentUserId,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'upcoming',
      };

      let newInvitations = [...invitations];

      if (invitedMemberIds && invitedMemberIds.length > 0) {
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
        invitedMemberIds.forEach((memberId, idx) => {
          newInvitations.push({
            id: `inv${Date.now()}-${idx}`,
            activityId,
            memberId,
            invitedBy: currentUserId,
            status: 'pending',
            createdAt: now,
          });
        });
      }

      set({ activities: [...activities, newActivity], invitations: newInvitations });
      persist();
    },

    signupActivity: (activityId) => {
      const { signups, activities, preferences, members, currentUserId } = get();
      const activity = activities.find(a => a.id === activityId);
      const pref = preferences[currentUserId];
      const member = members.find(m => m.id === currentUserId);

      if (!activity || !pref || !member) return;

      const matchScore = calculateMatchScore(pref.scores, activity.type);

      const newSignup: ActivitySignup = {
        id: `s${Date.now()}`,
        activityId,
        memberId: currentUserId,
        matchScore,
        tier: 'experience',
        signedUpAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      set({ signups: [...signups, newSignup] });
      persist();
    },

    cancelSignup: (activityId) => {
      const { signups, currentUserId } = get();
      const newSignups = signups.filter(
        s => !(s.activityId === activityId && s.memberId === currentUserId)
      );
      set({ signups: newSignups });
      persist();
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

      persist();
    },

    sendInvitation: (activityId, memberId, message) => {
      const { invitations, currentUserId } = get();

      const existing = invitations.find(
        i => i.activityId === activityId && i.memberId === memberId && i.status !== 'declined'
      );
      if (existing) return;

      const newInvitation: ActivityInvitation = {
        id: `inv${Date.now()}`,
        activityId,
        memberId,
        invitedBy: currentUserId,
        status: 'pending',
        message,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      set({ invitations: [...invitations, newInvitation] });
      persist();
    },

    acceptInvitation: (invitationId) => {
      const { invitations, activities, preferences, members, signups } = get();
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation || invitation.status !== 'pending') return;

      const activity = activities.find(a => a.id === invitation.activityId);
      const pref = preferences[invitation.memberId];
      const member = members.find(m => m.id === invitation.memberId);

      if (!activity || !pref || !member) return;

      const matchScore = calculateMatchScore(pref.scores, activity.type);
      const newSignup: ActivitySignup = {
        id: `s${Date.now()}`,
        activityId: invitation.activityId,
        memberId: invitation.memberId,
        matchScore,
        tier: 'experience',
        signedUpAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      const updatedInvitations = invitations.map(i =>
        i.id === invitationId
          ? { ...i, status: 'accepted' as InvitationStatus, respondedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
          : i
      );

      set({
        invitations: updatedInvitations,
        signups: [...signups, newSignup],
      });
      persist();
    },

    declineInvitation: (invitationId) => {
      const { invitations } = get();
      const updatedInvitations = invitations.map(i =>
        i.id === invitationId
          ? { ...i, status: 'declined' as InvitationStatus, respondedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
          : i
      );
      set({ invitations: updatedInvitations });
      persist();
    },

    revokeInvitation: (invitationId) => {
      const { invitations } = get();
      const updatedInvitations = invitations.filter(i => i.id !== invitationId);
      set({ invitations: updatedInvitations });
      persist();
    },

    getInvitationsByMember: (memberId) => {
      const { invitations, activities, members } = get();
      return invitations
        .filter(i => i.memberId === memberId)
        .map(i => ({
          ...i,
          activity: activities.find(a => a.id === i.activityId)!,
          inviter: members.find(m => m.id === i.invitedBy)!,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getInvitationsByActivity: (activityId) => {
      const { invitations, members } = get();
      return invitations
        .filter(i => i.activityId === activityId)
        .map(i => ({
          ...i,
          member: members.find(m => m.id === i.memberId)!,
          inviter: members.find(m => m.id === i.invitedBy)!,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    hasPendingInvitation: (activityId, memberId) => {
      return get().invitations.some(
        i => i.activityId === activityId && i.memberId === memberId && i.status === 'pending'
      );
    },

    hasDeclinedInvitation: (activityId, memberId) => {
      return get().invitations.some(
        i => i.activityId === activityId && i.memberId === memberId && i.status === 'declined'
      );
    },

    getSignupsByActivity: (activityId) => {
      const { signups, members, activities, preferences } = get();
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return [];

      const allSignups = signups
        .filter(s => s.activityId === activityId)
        .map(s => {
          const member = members.find(m => m.id === s.memberId)!;
          const pref = preferences[member.id];
          const freshMatchScore = pref ? calculateMatchScore(pref.scores, activity.type) : s.matchScore;
          const isLowMatch = freshMatchScore < 50;
          return { ...s, matchScore: freshMatchScore, member, isLowMatch };
        });

      const sortedByTime = [...allSignups].sort(
        (a, b) => new Date(a.signedUpAt).getTime() - new Date(b.signedUpAt).getTime()
      );

      const formalSignups = sortedByTime.slice(0, activity.totalSlots);
      const waitlistSignups = sortedByTime.slice(activity.totalSlots);

      const sortedFormalByMatch = [...formalSignups].sort(
        (a, b) => b.matchScore - a.matchScore
      );

      let filledCoreSlots = 0;
      const coreSlots = Math.ceil(activity.totalSlots * 0.3);

      const result = [
        ...sortedFormalByMatch.map((signup) => {
          let tier: 'core' | 'experience' | 'substitute';
          if (signup.isLowMatch) {
            tier = 'substitute';
          } else {
            tier = determineTier(signup.matchScore, signup.member.level, filledCoreSlots, activity.totalSlots);
            if (tier === 'core') filledCoreSlots++;
          }
          return { ...signup, tier, isWaitlist: false };
        }),
        ...waitlistSignups.map((signup, idx) => ({
          ...signup,
          waitlistPosition: idx + 1,
          tier: 'substitute' as const,
          isWaitlist: true,
        })),
      ];

      return result as any;
    },

    getSignupsByMember: (memberId) => {
      const { signups, activities } = get();
      return signups
        .filter(s => s.memberId === memberId)
        .map(s => {
          const activity = activities.find(a => a.id === s.activityId)!;
          const activitySignups = get().getSignupsByActivity(s.activityId);
          const self = activitySignups.find(signup => signup.memberId === memberId);
          return {
            ...s,
            activity,
            isWaitlist: self?.isWaitlist || false,
            waitlistPosition: self?.waitlistPosition,
          };
        });
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

    isOnWaitlist: (activityId, memberId) => {
      const signups = get().getSignupsByActivity(activityId);
      const signup = signups.find(s => s.memberId === memberId);
      return signup?.isWaitlist || false;
    },

    calculateVeteranRatio: (activityId) => {
      const activity = get().activities.find(a => a.id === activityId);
      if (!activity) return { current: 0, required: 0, ok: false, veteranCount: 0, newbieCount: 0, needMoreVeterans: 0, needMoreNewbies: 0 };

      const signups = get().getSignupsByActivity(activityId);
      const formalSignups = signups.filter(s => !s.isWaitlist);
      const totalSignups = formalSignups.length;

      const veteranCount = formalSignups.filter(s => s.member.level !== 'new').length;
      const newbieCount = formalSignups.filter(s => s.member.level === 'new').length;

      const neededVeterans = Math.ceil(activity.totalSlots * activity.veteranRatio);
      const neededNewbies = activity.totalSlots - neededVeterans;

      const currentRatio = totalSignups > 0 ? veteranCount / totalSignups : 0;

      return {
        current: currentRatio,
        required: activity.veteranRatio,
        ok: currentRatio >= activity.veteranRatio,
        veteranCount,
        newbieCount,
        needMoreVeterans: Math.max(0, neededVeterans - veteranCount),
        needMoreNewbies: Math.max(0, neededNewbies - newbieCount),
      };
    },

    getActivityTypeFit: (memberId) => {
      const pref = get().preferences[memberId];
      if (!pref) {
        return { honkaku: 0, henkaku: 0, fun: 0, mixed: 0 };
      }
      return calculateActivityTypeFit(pref.scores);
    },

    getRecommendationsForActivity: (activityType, totalSlots, veteranRatio, activityId) => {
      const { members, preferences, signups, invitations } = get();

      const alreadyInvitedOrJoined = [
        ...signups.filter(s => s.activityId === activityId).map(s => s.memberId),
        ...invitations.filter(i => i.activityId === activityId && i.status !== 'declined').map(i => i.memberId),
      ];

      const declinedMemberIds = invitations
        .filter(i => i.activityId === activityId && i.status === 'declined')
        .map(i => i.memberId);

      const excludeMemberIds = [...alreadyInvitedOrJoined, ...declinedMemberIds];

      const membersWithScores = members
        .filter(m => preferences[m.id])
        .map(m => ({
          ...m,
          scores: preferences[m.id].scores,
        }));

      return getSmartRecommendations(membersWithScores, activityType, totalSlots, veteranRatio, excludeMemberIds);
    },
  };
});
