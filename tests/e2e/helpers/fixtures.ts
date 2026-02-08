/**
 * Test data fixtures for E2E tests.
 */

/** IR simulation test data */
export const IR_FIXTURES = {
  couple: {
    status: 'couple',
    children: [],
    incomes: {
      d1_salaries: 45000,
      d2_salaries: 35000,
    },
    expected: {
      // We just check the result is > 0 and formatted
      hasResult: true,
    },
  },
  single: {
    status: 'single',
    children: [],
    incomes: {
      d1_salaries: 30000,
    },
    expected: {
      hasResult: true,
    },
  },
};

/** Credit simulation test data */
export const CREDIT_FIXTURES = {
  simple: {
    capital: 200000,
    rate: 3.5,
    duration: 240, // months = 20 years
    insurance: 0.34,
    expected: {
      hasSchedule: true,
      hasMonthlyPayment: true,
    },
  },
};

/** Navigation routes to test */
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
