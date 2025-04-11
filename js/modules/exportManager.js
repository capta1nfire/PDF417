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
        try {
            const resolvedElements = await elementsPromise;
            
            // Determinar qué tab está activo
            const isShippingTabActive = resolvedElements.shippingTabContent.classList.contains('active');
            const templateWidthSlider = isShippingTabActive ? resolvedElements.templateWidthSliderShipping : resolvedElements.templateWidthSliderLots;
            const templateHeightSlider = isShippingTabActive ? resolvedElements.templateHeightSliderShipping : resolvedElements.templateHeightSliderLots;
            const currentUnit = isShippingTabActive ? state.currentUnitShipping : state.currentUnitLots;
            const isPortrait = isShippingTabActive ? state.isPortraitShipping : state.isPortraitLots;

            // Obtener dimensiones exactas
            const inputWidth = parseFloat(templateWidthSlider.value) || LAYOUT_CONSTANTS.DEFAULT_WIDTH;
            const inputHeight = parseFloat(templateHeightSlider.value) || LAYOUT_CONSTANTS.DEFAULT_HEIGHT;
            const labelWidthMm = convertToMm(inputWidth, currentUnit);
            const labelHeightMm = convertToMm(inputHeight, currentUnit);
            
            // Calcular dimensiones en píxeles (como en lotsPreviewManager)
            const templateWidthPx = convertToPixels(inputWidth, currentUnit, CONVERSION);
            const templateHeightPx = convertToPixels(inputHeight, currentUnit, CONVERSION);
            
            // Usar la misma función calculateLayoutDimensions para asegurar proporciones idénticas
            const { 
                borderPx, 
                gapPx, 
                logoHeightPx, 
                textHeightPx, 
                additionalDataHeightPx, 
                barcodeHeightPx 
            } = calculateLayoutDimensions(templateHeightPx, isPortrait);
            
            // Convertir a mm para CSS (manteniendo las mismas proporciones)
            const borderMm = convertToMm(borderPx, 'px');
            const gapMm = convertToMm(gapPx, 'px');
            const logoHeightMm = convertToMm(logoHeightPx, 'px');
            const textHeightMm = convertToMm(textHeightPx, 'px');
            const additionalDataHeightMm = convertToMm(additionalDataHeightPx, 'px');
            const barcodeHeightMm = convertToMm(barcodeHeightPx, 'px');
            
            // Crear ventana de impresión
            const printWindow = window.open('', '_blank', 'width=600,height=600');
            if (!printWindow) {
                throw new Error('No se pudo abrir la ventana de impresión. Por favor, permita ventanas emergentes para este sitio.');
            }
            
            // Obtener la URL completa del CSS
            const cssUrl = new URL('/styles.css', window.location.origin).href;

            // Obtener datos adicionales para la vista previa
            const previewsData = isShippingTabActive ? state.shippingPreviewsData : state.lotsPreviewsData;
            const currentPreviewIndex = isShippingTabActive ? state.currentPreviewIndexShipping : state.currentPreviewIndexLots;
            const showPageNumber = isShippingTabActive ? state.showPageNumberShipping : state.showPageNumberLots;

            // HTML para la ventana de impresión
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Imprimir etiqueta</title>
                    <link rel="stylesheet" href="${cssUrl}">
                    <style>
                        @page { 
                            size: ${labelWidthMm}mm ${labelHeightMm}mm; 
                            margin: ${state.labelMargin}mm; 
                        }
                        
                        * {
                            box-sizing: border-box;
                        }
                        
                        html, body { 
                            margin: 0; 
                            padding: 0; 
                            width: 100%;
                            height: 100%;
                            background-color: white;
                        }
                        
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            overflow: hidden;
                        }
                        
                        .label-container {
                            width: 100%;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 0;
                            margin: 0;
                        }
                        
                        .label-preview {
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            align-items: center;
                            padding: 0;
                            border: ${borderMm}mm solid #000;
                            width: ${isPortrait ? '96%' : '98%'};  
                            height: ${isPortrait ? '98%' : '96%'}; 
                            margin: 0;
                            position: relative; /* Añadir esta línea */
                            
                            /* Variables CSS igual que en la vista previa */
                            --border-px: ${borderMm}mm;
                            --gap-px: ${gapMm}mm;
                            --logo-height-px: ${logoHeightMm}mm;
                            --text-height-px: ${textHeightMm}mm;
                            --additional-data-height-px: ${additionalDataHeightMm}mm;
                            --barcode-height-px: ${barcodeHeightMm}mm;
                        }
                        /* Estilos para el contador de páginas */
                        .page-number {
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: #000000 !important;
                            color: #ffffff !important;
                            padding: 3px 5px;
                            border-radius: 5px;
                            font-size: 11px;
                            font-weight: bold;
                            z-index: 100;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Añadir también un bloque @media print para reforzar */
                        @media print {
                            .page-number {
                                background: #000000 !important;
                                color: #ffffff !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                        
                        .label-element {
                            width: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin-bottom: 0;
                        }
                        
                        .label-element:last-child {
                            margin-bottom: 0;
                        }
                        
                        .logo-container {
                            height: ${logoHeightMm}mm;
                        }
                        
                        .text-container {
                            height: ${textHeightMm}mm;
                        }
                        
                        .additional-data-container {
                            height: ${additionalDataHeightMm}mm;
                        }
                        
                        .barcode-container {
                            height: ${barcodeHeightMm}mm;
                        }
                        
                        .logo-container img,
                        .barcode-container img {
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="label-preview ${isPortrait ? 'portrait' : 'landscape'}">
                            ${resolvedElements.LABEL_PREVIEW.innerHTML}
                            ${(showPageNumber && previewsData && previewsData.length > 1) ? 
                              `<div class="page-number">${currentPreviewIndex + 1} OF ${previewsData.length}</div>` : 
                              ''}
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.focus();
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 500);
                            }, 300);
                        }
                    </script>
                </body>
                </html>
            `);

            printWindow.document.close();
        } catch (error) {
            log(`Error al imprimir: ${error.message}`, 'error');
            const resolvedElements = await elementsPromise;
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