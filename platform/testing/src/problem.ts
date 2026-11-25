/**
 * What every standard test of this package reports. The factories never throw for what they
 * find and never assert: they return a list of problems, and the test that calls them expects
 * `[]`. So one failing run shows every finding at once, and the same functions serve a guard
 * over the whole repository and the test of one package.
 */
export interface StandardProblem {
  /** Which rule was broken, as a short id that never changes, e.g. `eszett` or `csp.source`. */
  rule: string;
  /** What is wrong and what to do about it, in English, for whoever reads the failed test. */
  message: string;
}
