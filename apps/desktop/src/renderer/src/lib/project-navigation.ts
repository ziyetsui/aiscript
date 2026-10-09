import type { IconName } from './icon-paths.ts';

/** Shared by the project rail and project-selection sidebar. */
export const PROJECT_NAV = [
  ['write', 'pen', '写作'],
  ['production', 'film', '制作'],
  ['characters', 'users', '角色'],
  ['locations', 'map', '地点'],
  ['props', 'box', '道具'],
  ['topics', 'bulb', '选题池'],
  ['knowledge', 'book', '知识库'],
] as const satisfies readonly (readonly [string, IconName, string])[];

export type Tab = (typeof PROJECT_NAV)[number][0];
