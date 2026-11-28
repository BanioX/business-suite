import { catalogueGaps, defineTranslation } from '@onestrand/i18n';
import {
  catalogueTexts,
  DE_CH_OPENING_SIE_RULE,
  DE_CH_TEXT_RULES,
  textProblems,
} from '@onestrand/testing';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, uiMessages, UiProvider, useUiTexts } from '../src/index';

/**
 * The standard test of the texts of the kit (suite ADR-0007; platform/i18n/api.md, «Der
 * Texttest»): de-CH with «du» and «ss», no exclamation mark, no buzzword, no emoji. The guard over
 * `platform/` reads the catalogue as well (no word of a trade, no product name).
 */
describe('the catalogue of the kit', () => {
  it('follows the rules of de-CH', () => {
    expect(
      textProblems(uiMessages, { rules: [...DE_CH_TEXT_RULES, DE_CH_OPENING_SIE_RULE] }),
    ).toEqual([]);
  });

  it('reads every text of its message functions too', () => {
    const texts = catalogueTexts(uiMessages).map((entry) => entry.text);
    expect(texts).toContain('Hier fehlt eine Angabe.');
    expect(texts).toContain('Trag mindestens {} ein.');
    expect(texts.length).toBeGreaterThan(40);
  });

  it('turns red for a text that breaks a rule', () => {
    const broken = { ...uiMessages, dialog: { ...uiMessages.dialog, close: 'Schließen Sie das!' } };
    const rules = textProblems(broken, { rules: DE_CH_TEXT_RULES }).map((problem) => problem.rule);
    expect(rules).toEqual(expect.arrayContaining(['eszett', 'exclamation', 'formal_address']));
  });

  it('is the source: a translation falls back to it key by key, and its gaps are data', () => {
    const pt = defineTranslation(uiMessages, { dialog: { close: 'Fechar' } });
    const gaps = catalogueGaps(uiMessages, pt, 'pt');
    const leaves = (tree: object): number =>
      Object.values(tree as Record<string, unknown>).reduce<number>(
        (count, value) => count + (typeof value === 'object' && value !== null ? leaves(value) : 1),
        0,
      );
    expect(gaps.length).toBe(leaves(uiMessages) - 1);
    expect(gaps.map((gap) => gap.path)).not.toContain('dialog.close');
    expect(gaps.every((gap) => gap.rule === 'missing')).toBe(true);
  });
});

describe('UiProvider', () => {
  it('hands the components the texts of another language, the rest in de-CH', () => {
    const translation = defineTranslation(uiMessages, { dialog: { cancel: 'Cancelar' } });
    render(
      <UiProvider translation={translation}>
        <ConfirmDialog
          open
          title="Apagar?"
          text="Texto."
          confirmLabel="Apagar"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('speaks de-CH without a provider', () => {
    function Shown() {
      return <p>{useUiTexts().dialog.close}</p>;
    }
    render(<Shown />);
    expect(screen.getByText('Schliessen')).toBeTruthy();
  });
});
