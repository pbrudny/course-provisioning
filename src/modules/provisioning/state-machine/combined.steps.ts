import { LECTURE_STEPS } from './lecture.steps';
import { LABORATORY_STEP_NAMES, LABORATORY_STEPS } from './laboratory.steps';

/**
 * Steps for a LABORATORY course:
 *   lecture steps first  (Discord server + lecture channels + shared GitHub repo)
 *   then group steps     (group roles + group channels + group repos)
 *
 * CREATE_DISCORD_SERVER is shared — the lecture step handles it, so we skip
 * the duplicate from the lab list to avoid two step records with the same name.
 */
export const COMBINED_STEPS = [
  ...LECTURE_STEPS,
  ...LABORATORY_STEPS.filter(
    (s) => s.name !== LABORATORY_STEP_NAMES.CREATE_DISCORD_SERVER,
  ),
];
