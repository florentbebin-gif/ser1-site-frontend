/**
 * Test data fixtures for E2E tests.
 */

/** Navigation routes to test */
// TODO: Add E2E coverage for /strategy route (currently defined but untested)
export const ROUTES = {
  home: '/',
  login: '/login',
  ir: '/sim/ir',
  credit: '/sim/credit',
  placement: '/sim/placement',
  audit: '/audit',
  strategy: '/strategy',
  settings: '/settings',
} as const;
