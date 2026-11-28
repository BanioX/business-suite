import { themeCss } from '@onestrand/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './gallery.css';
import { Gallery } from './Gallery';
import { galleryTheme } from './theme';

const root = document.getElementById('root');
if (root === null) {
  throw new Error('The gallery needs an element with the id «root».');
}
// Only in this page for development: an edition writes the CSS of its theme into a file when it
// builds, because its CSP allows no style in the document.
const style = document.createElement('style');
style.textContent = themeCss(galleryTheme);
document.head.append(style);
// `?scheme=dark` or `?scheme=light` sets the choice of the person, as the shell will.
const scheme = new URLSearchParams(window.location.search).get('scheme');
if (scheme === 'dark' || scheme === 'light') {
  document.documentElement.setAttribute('data-scheme', scheme);
}
createRoot(root).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
