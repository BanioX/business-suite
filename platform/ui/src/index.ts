// The public entry of @onestrand/ui (P-08): the theme, the texts and the components of the kit.
// Import from here only; the styles come from `@onestrand/ui/kit.css`. The surface is pinned by
// test/index.test.ts.
export {
  CONTRAST_PAIRS,
  defineTheme,
  neutralTheme,
  SCHEME_ATTRIBUTE,
  SCHEMES,
  THEME_PROBLEM_CODES,
  ThemeError,
  themeCss,
  themeProblems,
  TOKENS,
  type ContrastPair,
  type Palette,
  type Scheme,
  type Theme,
  type ThemeCssOptions,
  type ThemeInput,
  type ThemeProblem,
  type ThemeProblemCode,
  type Token,
} from './theme';
export { uiMessages, type UiMessages } from './messages';
export {
  KitLink,
  UiProvider,
  useCurrency,
  useToday,
  useUiTexts,
  type KitLinkProps,
  type LinkComponent,
  type UiProviderProps,
} from './context';
export { toneClasses, type Tone, type ToneClasses } from './tones';
export {
  Button,
  ButtonLink,
  buttonClasses,
  IconButton,
  type ButtonLinkProps,
  type ButtonLook,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonProps,
} from './Button';
export {
  BOXED_INPUT_CLASS,
  controlClass,
  Field,
  FIELD_LABEL_CLASS,
  FieldError,
  FieldGroup,
  fieldLabelId,
  firstError,
  InputBox,
  joinIds,
  ParsedField,
  useParsedText,
  useSubmitGuard,
  withoutTrailingMark,
  type FieldBaseProps,
  type FieldControl,
  type FieldGroupProps,
  type FieldProps,
  type ParsedFieldProps,
  type ParsedText,
  type ParsedTextOptions,
  type SubmitGuard,
} from './Field';
export { TextArea, TextField, type TextAreaProps, type TextFieldProps } from './TextField';
export { NumberField, readWholeNumber, type NumberFieldProps } from './NumberField';
export { MoneyField, type MoneyFieldProps } from './MoneyField';
export { DateField, type DateFieldProps, type DatePreset } from './DateField';
export { CalendarButton } from './CalendarButton';
export { describeDate, describeRelative, nextDateText } from './date-text';
export { SelectField, type SelectFieldProps, type SelectOption } from './SelectField';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Switch, type SwitchProps } from './Switch';
export { SegmentedControl, type Segment, type SegmentedControlProps } from './SegmentedControl';
export {
  GROUPED_ROW_LINK,
  GroupedList,
  GroupedListItem,
  ListRow,
  type ListRowProps,
} from './GroupedList';
export { StatusChip, type StatusChipProps } from './StatusChip';
export { Card, type CardProps, type CardVariant } from './Card';
export { Notice, type NoticeProps, type NoticeTone } from './Notice';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { BackLink, PageHeader, type PageHeaderProps } from './PageHeader';
export { Section, type SectionAction, type SectionProps } from './Section';
export { ConfirmDialog, Sheet, type ConfirmDialogProps, type SheetProps } from './Sheet';
export { TOAST_MS, ToastProvider, useToast, type ShowToast, type ToastOptions } from './Toast';
export { KpiGrid, StatTile, type StatTileProps, type StatTone } from './StatTile';
