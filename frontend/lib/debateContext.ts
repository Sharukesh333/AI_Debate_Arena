/**
 * Debate Context Interface forwarder (to avoid duplicate definitions)
 */

export * from './types';
export type PersonalityTraits = import('./types').Persona;
export type { DebateMessage, DebateContext } from './types';
