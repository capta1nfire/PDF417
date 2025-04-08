// js/modules/exportManager.js
import { elements as elementsPromise } from './elements.js';
import { state, CONVERSION } from './state.js';
import { log, showToast, convertToPixels } from './utils.js';
import previewManager from './previewManager.js';
import { calculateLayoutDimensions } from './commonPreviewUtils.js';

function convertToMm(value, unit) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    switch (unit) {
        case 'in':
            return numValue * 25.4;
        case 'cm':
            return numValue * 10;
        case 'px':
            return numValue * (25.4 / 96); // Asume 96 DPI
        default:
            return numValue;
    }
}

export const exportManager = {
    printLabel: async () => {
        log("Iniciando impresión...");
        const resolvedElements = await elementsPromise;

        try {
            await previewManager.updatePreview();
            const isShippingTabActive = resolvedElements.shippingTabContent.classList.contains('active');
            const templateWidthSlider = isShippingTabActive ? resolvedElements.templateWidthSliderShipping : resolvedElements.templateWidthSliderLots;
            const templateHeightSlider = isShippingTabActive ? resolvedElements.templateHeightSliderShipping : resolvedElements.templateHeightSliderLots;
            const currentUnit = isShippingTabActive ? state.currentUnitShipping : state.currentUnitLots;
            const isPortrait = isShippingTabActive ? state.isPortraitShipping : state.isPortraitLots;

            const labelWidthMm = convertToMm(templateWidthSlider.value, currentUnit);
            const labelHeightMm = convertToMm(templateHeightSlider.value, currentUnit);
            const marginTop = isPortrait ? '64px' : '0px'; // 4rem = 64px en impresión
            const { borderPx, gapPx, totalContentHeight } = calculateLayoutDimensions(convertToPixels(parseFloat(templateHeightSlider.value), currentUnit, CONVERSION), isPortrait);
            const borderMm = convertToMm(borderPx, 'px');
            const gapMm = convertToMm(gapPx, 'px');
            const totalContentHeightMm = convertToMm(totalContentHeight, 'px');

            const printWindow = window.open('', '_blank', 'width=600,height=400');
            printWindow.document.write(`
                <html>
                <head>
                    <link rel="stylesheet" href="/styles.css">
                    <style>
                        @page { size: ${labelWidthMm}mm ${labelHeightMm}mm; margin: ${state.labelMargin}mm; }
                        body { margin: 0; padding: 0; width: ${labelWidthMm}mm; height: ${labelHeightMm}mm; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: ${isPortrait ? 'flex-start' : 'center'}; }
                        .label-content { width: 100%; height: ${totalContentHeightMm}mm; margin-top: ${marginTop}; padding: ${borderMm}mm; display: flex; flex-direction: column; align-items: center; justify-content: space-around; gap: ${gapMm}mm; box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <div class="label-content ${isPortrait ? 'portrait' : 'landscape'}">
                        ${resolvedElements.LABEL_PREVIEW.innerHTML}
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            await new Promise(resolve => printWindow.onload = resolve);
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            showToast(resolvedElements.toastMessage, 'Etiqueta impresa.');
        } catch (error) {
            log(`Error al imprimir: ${error.message}`, 'error');
            showToast(resolvedElements.toastMessage, 'Error al imprimir.');
        }
    },

    downloadPDF: async () => {
        log("Descarga de PDF no implementada aún.");
        const resolvedElements = await elementsPromise;
        showToast(resolvedElements.toastMessage, 'Función downloadPDF no implementada.');
    },

    generateBatchZip: async () => {
        log("Generación de ZIP no implementada aún.");
        const resolvedElements = await elementsPromise;
        showToast(resolvedElements.toastMessage, 'Función generateBatchZip no implementada.');
    }
};