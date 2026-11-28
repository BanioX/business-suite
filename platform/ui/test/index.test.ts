import { describe, expect, it } from 'vitest';
import * as ui from '../src/index';

/**
 * The public surface, name by name. The shell, every industry and every edition build on it: a
 * name that disappears or appears here is a decision, not an accident. Types are not listed;
 * `tsc` guards them where they are used.
 */
describe('@onestrand/ui', () => {
  it('exports exactly these values', () => {
    expect(Object.keys(ui).sort()).toEqual(
      [
        // the theme
        'CONTRAST_PAIRS',
        'defineTheme',
        'neutralTheme',
        'SCHEME_ATTRIBUTE',
        'SCHEMES',
        'THEME_PROBLEM_CODES',
        'ThemeError',
        'themeCss',
        'themeProblems',
        'TOKENS',
        // the texts and what the app hands in
        'uiMessages',
        'KitLink',
        'UiProvider',
        'useCurrency',
        'useToday',
        'useUiTexts',
        // tones
        'toneClasses',
        // buttons
        'Button',
        'ButtonLink',
        'buttonClasses',
        'IconButton',
        // fields
        'BOXED_INPUT_CLASS',
        'controlClass',
        'Field',
        'FIELD_LABEL_CLASS',
        'FieldError',
        'FieldGroup',
        'fieldLabelId',
        'firstError',
        'InputBox',
        'joinIds',
        'ParsedField',
        'useParsedText',
        'useSubmitGuard',
        'withoutTrailingMark',
        'TextArea',
        'TextField',
        'NumberField',
        'readWholeNumber',
        'MoneyField',
        'QuantityField',
        'readMilli',
        'formatMilli',
        'TimeField',
        'readTimeOfDay',
        'TIME_OF_DAY_PATTERN',
        'DateField',
        'CalendarButton',
        'describeDate',
        'describeRelative',
        'isMonthOnly',
        'nextDateText',
        'SelectField',
        'Checkbox',
        'Switch',
        'SegmentedControl',
        // lists and surfaces
        'GROUPED_ROW_LINK',
        'GroupedList',
        'GroupedListItem',
        'ListRow',
        'StatusChip',
        'Card',
        'Notice',
        'EmptyState',
        'BackLink',
        'PageHeader',
        'Section',
        // dialogs and toasts
        'ConfirmDialog',
        'Sheet',
        'TOAST_MIN_MS',
        'TOAST_MS',
        'ToastOutlet',
        'ToastProvider',
        'useToast',
        'useToastHost',
        // key figures
        'KpiGrid',
        'StatTile',
      ].sort(),
    );
  });

  it('keeps its helpers inside', () => {
    for (const name of [
      'PlainLink',
      'Content',
      'FieldNotes',
      'variantClasses',
      'DERIVED',
      'GROUNDS',
    ]) {
      expect(Object.keys(ui), name).not.toContain(name);
    }
  });

  it('carries no building block of a trade and nothing that needs a storage or a register', () => {
    // The words of a trade are the guard's (tools/guards/platform-words.guard.test.ts reads this
    // package); here the blocks that belong to the device, to the shell or to an industry.
    const elsewhere =
      /temperature|article|photo|camera|print|share|picker|feature|right|query|command/i;
    expect(Object.keys(ui).filter((name) => elsewhere.test(name))).toEqual([]);
  });
});
