// The React part of @onestrand/web-device (P-10): the visible parts of the device, built with
// @onestrand/ui. The logic they use is the main entry (`@onestrand/web-device`); the surface is
// pinned by test/index.test.ts.
export { deviceMessages, type DeviceMessages } from './messages';
export { DeviceProvider, useDevice, useDeviceTexts, type DeviceProviderProps } from './context';
export { useActionCount, useWakeLock } from './hooks';
export {
  PrintButton,
  PrintNoticeSheet,
  ShareButton,
  usePrintAction,
  type PrintAction,
  type PrintButtonProps,
  type PrintNotice,
  type PrintPdf,
  type ShareButtonProps,
} from './print';
export { FilePickButton, type FilePickButtonProps } from './FilePickButton';
export { PhotoField, type PhotoFieldProps, type PhotoValue } from './PhotoField';
export { PhotoViewer, ZoomablePhoto, type PhotoViewerProps } from './PhotoViewer';
export { QR_SCAN_INTERVAL_MS, QrReaderPanel, type QrReaderProps } from './QrReader';
export { SignaturePad, type SignaturePadProps } from './SignaturePad';
