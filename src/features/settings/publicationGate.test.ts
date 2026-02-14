import { describe, expect, it } from 'vitest';
import {
  evaluatePublicationGate,
  P0_10_BLOCK_MESSAGE,
  P0_10_UNAVAILABLE_MESSAGE,
} from './publicationGate';

describe('evaluatePublicationGate', () => {
  it('blocks publication when no tests are imported', () => {
    const result = evaluatePublicationGate({ tests: [] });

    expect(result.blocked).toBe(true);
    expect(result.blockMessage).toBe(P0_10_BLOCK_MESSAGE);
  });

  it('allows publication when at least one test is imported', () => {
    const result = evaluatePublicationGate({ tests: [{ id: 't-1' }] });

    expect(result.blocked).toBe(false);
    expect(result.blockMessage).toBeNull();
  });

  it('blocks publication with explicit unavailable message when tests source is unavailable', () => {
    const result = evaluatePublicationGate({ testsSourceAvailable: false });

    expect(result.blocked).toBe(true);
    expect(result.blockMessage).toBe(P0_10_UNAVAILABLE_MESSAGE);
  });
});
