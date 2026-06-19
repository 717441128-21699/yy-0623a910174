export type MemberRole = 'member' | 'president';
export type MemberLevel = 'new' | 'experienced' | 'core';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  level: MemberLevel;
  joinDate: string;
  activityCount: number;
}

export interface PreferenceScores {
  logicReasoning: number;
  worldBuilding: number;
  npcAcceptance: number;
  edgeRoleTolerance: number;
  socialPreference: number;
}

export interface PreferenceHistory {
  date: string;
  scores: PreferenceScores;
}

export interface Preference {
  memberId: string;
  scores: PreferenceScores;
  tags: string[];
  lastUpdated: string;
  history: PreferenceHistory[];
  hasCompletedQuiz: boolean;
}

export type ActivityType = 'honkaku' | 'henkaku' | 'fun' | 'mixed';
export type ActivityStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Activity {
  id: string;
  title: string;
  scriptName: string;
  type: ActivityType;
  date: string;
  time: string;
  totalSlots: number;
  veteranRatio: number;
  status: ActivityStatus;
  description: string;
  createdBy: string;
  createdAt: string;
}

export type SignupTier = 'core' | 'experience' | 'substitute';

export interface ActivitySignup {
  id: string;
  activityId: string;
  memberId: string;
  matchScore: number;
  tier: SignupTier;
  signedUpAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface ActivityInvitation {
  id: string;
  activityId: string;
  memberId: string;
  invitedBy: string;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface Feedback {
  id: string;
  activityId: string;
  memberId: string;
  scriptRating: number;
  atmosphereRating: number;
  comment: string;
  submittedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    label: string;
    value: number;
    dimension: keyof PreferenceScores;
  }[];
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  honkaku: '本格推理',
  henkaku: '变格设定',
  fun: '欢乐机制',
  mixed: '混合体验',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  honkaku: 'bg-crimson-500',
  henkaku: 'bg-mystic-500',
  fun: 'bg-amber-500',
  mixed: 'bg-midnight-400',
};

export const MEMBER_LEVEL_LABELS: Record<MemberLevel, string> = {
  new: '新社员',
  experienced: '老社员',
  core: '核心盘手',
};

export const TIER_LABELS: Record<SignupTier, string> = {
  core: '核心盘手',
  experience: '体验位',
  substitute: '替补',
};

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: '待确认',
  accepted: '已接受',
  declined: '已拒绝',
};
