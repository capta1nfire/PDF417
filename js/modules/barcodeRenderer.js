// js/modules/barcodeRenderer.js
import bwipjs from 'bwip-js';
import { log } from './utils.js';

export async function generateBarcodePngDataUrl(options) {
    log(`Generating barcode PNG with options: ${JSON.stringify(options)}`);

    if (!options || !options.bcid || typeof options.text === 'undefined') {
        throw new Error('generateBarcodePngDataUrl requiere al menos options.bcid y options.text');
    }

    try {
        const tempCanvas = document.createElement('canvas');

        log(`Versión de bwip-js: ${bwipjs.VERSION || "Desconocida"}`);

        const bwipOptions = {
            bcid: options.bcid || 'pdf417',
            text: options.text,
            includetext: false,
            monochrome: true,
            parsefnc: true,
            eclevel: options.eclevel || 5,
            columns: options.columns || 4,
            rows: options.rows || 30,
            yheight: options.yheight || 4, // Use yheight instead of rowheight
            scale: options.scale || 2.8194
        };

        const textLength = options.text.length;
        if (!bwipOptions.columns) {
            if (textLength <= 3) {
                bwipOptions.columns = 4; // Muy corto
            } else if (textLength <= 7) {
                bwipOptions.columns = 6; // Corto
            } else if (textLength <= 14) {
                bwipOptions.columns = 8; // Medio
            } else {
                bwipOptions.columns = 10; // Largo
            }
        }

        if (!bwipOptions.rows) {
            if (textLength <= 3) {
                bwipOptions.rows = 30; // Muy corto
            } else if (textLength <= 7) {
                bwipOptions.rows = 40; // Corto
            } else if (textLength <= 14) {
                bwipOptions.rows = 50; // Medio
            } else {
                bwipOptions.rows = 60; // Largo
            }
        }

        delete bwipOptions.scaleX;
        delete bwipOptions.scaleY;
        delete bwipOptions.aspectratio;
        delete bwipOptions.width;
        delete bwipOptions.height;
        delete bwipOptions.rowheight; // Remove rowheight

        log('Opciones finales para bwip-js:', bwipOptions);

        await bwipjs.toCanvas(tempCanvas, bwipOptions);
        log(`Canvas temporal dibujado para PNG: ${tempCanvas.width}x${tempCanvas.height}`);

        const dataUrl = tempCanvas.toDataURL('image/png');
        return dataUrl;

    } catch (e) {
        log(`Error generando barcode PNG con bwip-js: ${e.message || e}`, 'error');
        console.error('Detalles error bwip-js:', e);
        throw new Error(`Fallo al generar PNG del código de barras: ${e.message || e}`);
    }
}