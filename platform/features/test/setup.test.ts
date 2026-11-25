import { describe, expect, it } from 'vitest';
import { createFeatureRegistry } from '../src';
import { CORE, PLATFORM, REGISTRY, ids } from './support';

const KIND = ['muster.standard'];

describe('the questions of the setup', () => {
  it('are asked of every kind where they name none, and of the named kinds where they do', () => {
    expect(REGISTRY.questionsFor(['muster.standard']).map((question) => question.id)).toEqual([
      'team_size',
      'time_tracking',
      'muster.passes_wanted',
    ]);
    expect(REGISTRY.questionsFor(['muster.small']).map((question) => question.id)).toEqual([
      'team_size',
      'time_tracking',
    ]);
    expect(REGISTRY.questionsFor([]).map((question) => question.id)).toEqual([
      'team_size',
      'time_tracking',
    ]);
  });

  it('are asked once for a business of two kinds', () => {
    const both = REGISTRY.questionsFor(['muster.standard', 'muster.small']);
    expect(both.map((question) => question.id)).toEqual([
      'team_size',
      'time_tracking',
      'muster.passes_wanted',
    ]);
  });

  it('are a frozen list', () => {
    expect(Object.isFrozen(REGISTRY.questionsFor(KIND))).toBe(true);
  });
});

describe('the proposal', () => {
  it('starts from what the kind switches on, and nothing else, as the lean extent', () => {
    const proposal = REGISTRY.propose({ kinds: KIND });
    expect(proposal.lean).toEqual(ids('today data customers muster.visits'));
    expect(proposal.usual).toEqual(proposal.lean);
    expect(proposal.problems).toEqual([]);
  });

  it('completes what the kind names with everything it needs', () => {
    const register = createFeatureRegistry({
      industries: [{ id: 'muster' }],
      groups: [{ id: 'g' }, { id: 'muster.g' }],
      features: [
        { id: 'base', group: 'g' },
        { id: 'muster.top', group: 'muster.g', requires: ['base'] },
      ],
      kinds: [{ id: 'muster.k', on: ['muster.top'] }],
    });
    expect(register.propose({ kinds: ['muster.k'] }).lean).toEqual(['base', 'muster.top']);
  });

  it('adds what the answers switch on to the usual extent', () => {
    const proposal = REGISTRY.propose({
      kinds: KIND,
      answers: { team_size: ['large'], 'muster.passes_wanted': ['yes'] },
    });
    expect(proposal.lean).toEqual(ids('today data customers muster.visits'));
    expect(proposal.usual).toEqual(
      ids('today data customers team roster muster.visits muster.passes'),
    );
  });

  it('lets «off» win over «on»: what an answer switches off goes, with what needs it', () => {
    const proposal = REGISTRY.propose({
      kinds: KIND,
      answers: { time_tracking: ['sheet', 'other_program'], team_size: ['small'] },
    });
    expect(proposal.usual).toEqual(ids('today data customers team muster.visits'));
  });

  it('applies what an answer switches off to the lean extent too', () => {
    const register = PLATFORM.extend({
      industries: [{ id: 'muster' }],
      kinds: [{ id: 'muster.k', on: ['payroll_export', 'customers'] }],
    });
    const proposal = register.propose({
      kinds: ['muster.k'],
      answers: { time_tracking: ['other_program'] },
    });
    expect(proposal.lean).toEqual(ids('today data customers team'));
    expect(proposal.usual).toEqual(ids('today data customers team'));
  });

  it('takes a feature along when an answer switches off what it needs', () => {
    const proposal = REGISTRY.propose({
      kinds: ['muster.standard'],
      answers: { team_size: ['solo'], time_tracking: ['paper'] },
    });
    // `solo` switches `team` off; `time_clock` needs it, so it goes too.
    expect(proposal.usual).toEqual(ids('today data customers muster.visits'));
  });

  it('proposes every feature as the extent «all», answers or not', () => {
    const proposal = REGISTRY.propose({ kinds: KIND, answers: { team_size: ['solo'] } });
    expect(proposal.all).toEqual(REGISTRY.ids);
  });

  it('always holds the core, also with no kind', () => {
    const proposal = REGISTRY.propose({ kinds: [] });
    expect(proposal.lean).toEqual(CORE);
    expect(proposal.usual).toEqual(CORE);
  });

  it('joins what two kinds start with', () => {
    expect(REGISTRY.propose({ kinds: ['muster.small', 'muster.standard'] }).lean).toEqual(
      REGISTRY.propose({ kinds: KIND }).lean,
    );
    expect(REGISTRY.propose({ kinds: ['muster.small'] }).lean).toEqual(ids('today data customers'));
  });

  it('keeps lean within usual within all, and every extent complete', () => {
    const proposal = REGISTRY.propose({
      kinds: KIND,
      answers: { team_size: ['large'], time_tracking: ['paper', 'sheet'] },
    });
    for (const extent of [proposal.lean, proposal.usual, proposal.all]) {
      expect(REGISTRY.resolve(extent).features).toEqual(extent);
    }
    expect(proposal.usual).toEqual(expect.arrayContaining([...proposal.lean]));
    expect(proposal.all).toEqual(expect.arrayContaining([...proposal.usual]));
  });

  it('gives frozen results', () => {
    const proposal = REGISTRY.propose({ kinds: KIND });
    expect(Object.isFrozen(proposal)).toBe(true);
    expect(Object.isFrozen(proposal.lean)).toBe(true);
    expect(Object.isFrozen(proposal.usual)).toBe(true);
    expect(Object.isFrozen(proposal.problems)).toBe(true);
  });
});

describe('an input of the setup that is wrong', () => {
  const kinds = (input: Parameters<typeof REGISTRY.propose>[0]) =>
    REGISTRY.propose(input).problems.map((problem) => `${problem.kind} ${problem.id}`);

  it('reports a kind that is not registered and goes on with the others', () => {
    const proposal = REGISTRY.propose({ kinds: ['muster.nowhere', 'muster.small'] });
    expect(proposal.problems).toEqual([
      {
        kind: 'unknown_kind',
        id: 'muster.nowhere',
        message: 'the register has no kind «muster.nowhere»',
      },
    ]);
    expect(proposal.lean).toEqual(ids('today data customers'));
  });

  it('takes a kind given twice as one', () => {
    const proposal = REGISTRY.propose({ kinds: [...KIND, ...KIND] });
    expect(proposal.problems).toEqual([]);
    expect(proposal.lean).toEqual(ids('today data customers muster.visits'));
  });

  it('reports a question that is not registered', () => {
    expect(kinds({ kinds: KIND, answers: { nowhere: ['a'] } })).toEqual([
      'unknown_question nowhere',
    ]);
  });

  it('reports a question that is not asked of the kind, and does not count its answers', () => {
    const proposal = REGISTRY.propose({
      kinds: ['muster.small'],
      answers: { 'muster.passes_wanted': ['yes'] },
    });
    expect(proposal.problems.map((problem) => problem.kind)).toEqual(['not_asked']);
    expect(proposal.usual).toEqual(ids('today data customers'));
  });

  it('reports an answer the question does not have, and counts the others', () => {
    const proposal = REGISTRY.propose({
      kinds: KIND,
      answers: { time_tracking: ['nowhere', 'paper'] },
    });
    expect(proposal.problems.map((problem) => `${problem.kind} ${problem.id}`)).toEqual([
      'unknown_answer nowhere',
    ]);
    expect(proposal.usual).toEqual(ids('today data customers team time_clock muster.visits'));
  });

  it('reports several answers to a question of one choice, and counts none of them', () => {
    const proposal = REGISTRY.propose({
      kinds: KIND,
      answers: { team_size: ['small', 'large'] },
    });
    expect(proposal.problems).toEqual([
      {
        kind: 'too_many_answers',
        id: 'team_size',
        message: 'the question «team_size» takes one answer, got 2',
      },
    ]);
    expect(proposal.usual).toEqual(proposal.lean);
  });

  it('takes the same answer given twice as one', () => {
    const proposal = REGISTRY.propose({ kinds: KIND, answers: { team_size: ['small', 'small'] } });
    expect(proposal.problems).toEqual([]);
    expect(proposal.usual).toContain('team');
  });

  it('takes an empty answer as no answer', () => {
    const proposal = REGISTRY.propose({ kinds: KIND, answers: { team_size: [] } });
    expect(proposal.problems).toEqual([]);
    expect(proposal.usual).toEqual(proposal.lean);
  });

  it('is no obstacle to the extents: every one is still complete', () => {
    const proposal = REGISTRY.propose({
      kinds: ['x.y', ...KIND],
      answers: { a: ['b'], team_size: ['small', 'large'], 'muster.passes_wanted': ['maybe'] },
    });
    expect(proposal.problems).toHaveLength(4);
    for (const extent of [proposal.lean, proposal.usual, proposal.all]) {
      expect(REGISTRY.resolve(extent).features).toEqual(extent);
    }
  });
});

describe('the extent a list of features is', () => {
  const proposal = REGISTRY.propose({
    kinds: KIND,
    answers: { team_size: ['small'] },
  });

  it('is named «usual», «lean» or «all» where it matches, in any order', () => {
    expect(REGISTRY.extentOf(proposal, [...proposal.usual].reverse())).toBe('usual');
    expect(REGISTRY.extentOf(proposal, proposal.lean)).toBe('lean');
    expect(REGISTRY.extentOf(proposal, REGISTRY.ids)).toBe('all');
  });

  it('is judged by what the list means, not by how it was written', () => {
    expect(REGISTRY.extentOf(proposal, ['muster.visits'])).toBe('lean');
    expect(REGISTRY.extentOf(proposal, ['team', 'muster.visits'])).toBe('usual');
  });

  it('is «custom» as soon as one switch differs', () => {
    expect(REGISTRY.extentOf(proposal, ['muster.visits', 'team', 'jobs'])).toBe('custom');
    expect(REGISTRY.extentOf(proposal, [])).toBe('custom');
  });

  it('names the usual one where two extents are the same list', () => {
    const same = REGISTRY.propose({ kinds: KIND });
    expect(same.lean).toEqual(same.usual);
    expect(REGISTRY.extentOf(same, same.lean)).toBe('usual');
  });

  it('names «lean» for a list that is the lean one and not the usual one', () => {
    expect(proposal.lean).not.toEqual(proposal.usual);
    expect(REGISTRY.extentOf(proposal, proposal.lean)).toBe('lean');
  });
});
