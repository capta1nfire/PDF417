// js/main.js
import { init } from './init.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] main.js cargado y DOMContentLoaded disparado");
    init();
    console.log("[DEBUG] init() llamado");
});