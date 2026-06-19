import type { ActivityType, PreferenceScores, SignupTier, MemberLevel } from '@/types';

const TYPE_WEIGHTS: Record<ActivityType, Partial<Record<keyof PreferenceScores, number>>> = {
  honkaku: {
    logicReasoning: 0.4,
    worldBuilding: 0.1,
    npcAcceptance: 0.15,
    edgeRoleTolerance: 0.2,
    socialPreference: 0.15,
  },
  henkaku: {
    logicReasoning: 0.15,
    worldBuilding: 0.4,
    npcAcceptance: 0.25,
    edgeRoleTolerance: 0.1,
    socialPreference: 0.1,
  },
  fun: {
    logicReasoning: 0.1,
    worldBuilding: 0.15,
    npcAcceptance: 0.2,
    edgeRoleTolerance: 0.2,
    socialPreference: 0.35,
  },
  mixed: {
    logicReasoning: 0.25,
    worldBuilding: 0.25,
    npcAcceptance: 0.2,
    edgeRoleTolerance: 0.15,
    socialPreference: 0.15,
  },
};

export function calculateMatchScore(
  scores: PreferenceScores,
  activityType: ActivityType
): number {
  const weights = TYPE_WEIGHTS[activityType];
  let totalScore = 0;
  let totalWeight = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    const score = scores[dimension as keyof PreferenceScores];
    totalScore += (score / 5) * (weight as number) * 100;
    totalWeight += weight as number;
  }

  return Math.round(totalScore / totalWeight);
}

export function determineTier(
  matchScore: number,
  memberLevel: MemberLevel,
  filledCoreSlots: number,
  totalSlots: number
): SignupTier {
  const coreSlots = Math.ceil(totalSlots * 0.3);

  if (matchScore >= 80 && filledCoreSlots < coreSlots && memberLevel !== 'new') {
    return 'core';
  }

  if (matchScore >= 50) {
    return 'experience';
  }

  return 'substitute';
}

export function generateTags(scores: PreferenceScores): string[] {
  const tags: string[] = [];
  const { logicReasoning, worldBuilding, npcAcceptance, edgeRoleTolerance, socialPreference } = scores;

  if (logicReasoning >= 4.5) {
    tags.push('逻辑怪');
  } else if (logicReasoning >= 4) {
    tags.push('推理达人');
  }

  if (worldBuilding >= 4.5) {
    tags.push('脑洞王者');
  } else if (worldBuilding >= 4) {
    tags.push('变格爱好者');
  }

  if (npcAcceptance >= 4.5) {
    tags.push('戏精附体');
  } else if (npcAcceptance >= 4) {
    tags.push('沉浸体验派');
  }

  if (edgeRoleTolerance >= 4.5) {
    tags.push('边缘位专业户');
  } else if (edgeRoleTolerance >= 4) {
    tags.push('不挑角色');
  }

  if (socialPreference >= 4.5) {
    tags.push('社交达人');
  } else if (socialPreference >= 4) {
    tags.push('气氛担当');
  }

  if (tags.length === 0) {
    tags.push('全能选手');
  }

  return tags.slice(0, 4);
}

export function calculateVeteranRatio(
  signups: { memberLevel: MemberLevel }[],
  totalSlots: number
): number {
  const veterans = signups.filter(s => s.memberLevel !== 'new').length;
  return veterans / Math.min(signups.length, totalSlots);
}
