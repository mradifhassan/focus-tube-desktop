/**
 * @file main.js
 * Entry point — boots FreeTubeApp once the DOM is ready.
 */

import './index.css';
import FreeTubeApp from './app.js';
import { initNativeUpdateChecker } from './updater.js';

window.addEventListener('DOMContentLoaded', () => {
  initNativeUpdateChecker();
  new FreeTubeApp();
});