import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'virtual:theme.css';
import './gallery.css';
import { Gallery } from './Gallery';

const root = document.getElementById('root');
if (root === null) {
  throw new Error('The gallery needs an element with the id «root».');
}
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
