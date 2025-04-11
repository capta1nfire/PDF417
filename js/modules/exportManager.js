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
            
            // Determinar qué tab está activo (código igual que antes)
            const isShippingTabActive = resolvedElements.shippingTabContent.classList.contains('active');
            const templateWidthSlider = isShippingTabActive ? resolvedElements.templateWidthSliderShipping : resolvedElements.templateWidthSliderLots;
            const templateHeightSlider = isShippingTabActive ? resolvedElements.templateHeightSliderShipping : resolvedElements.templateHeightSliderLots;
            const currentUnit = isShippingTabActive ? state.currentUnitShipping : state.currentUnitLots;
            const isPortrait = isShippingTabActive ? state.isPortraitShipping : state.isPortraitLots;

            // Resto de los cálculos igual que antes...
            const inputWidth = parseFloat(templateWidthSlider.value) || LAYOUT_CONSTANTS.DEFAULT_WIDTH;
            const inputHeight = parseFloat(templateHeightSlider.value) || LAYOUT_CONSTANTS.DEFAULT_HEIGHT;
            const labelWidthMm = convertToMm(inputWidth, currentUnit);
            const labelHeightMm = convertToMm(inputHeight, currentUnit);
            
            // Calcular dimensiones y convertir a mm (igual que antes)
            const templateWidthPx = convertToPixels(inputWidth, currentUnit, CONVERSION);
            const templateHeightPx = convertToPixels(inputHeight, currentUnit, CONVERSION);
            
            const { 
                borderPx, 
                gapPx, 
                logoHeightPx, 
                textHeightPx, 
                additionalDataHeightPx, 
                barcodeHeightPx 
            } = calculateLayoutDimensions(templateHeightPx, isPortrait);
            
            const borderMm = convertToMm(borderPx, 'px');
            const gapMm = convertToMm(gapPx, 'px');
            const logoHeightMm = convertToMm(logoHeightPx, 'px');
            const textHeightMm = convertToMm(textHeightPx, 'px');
            const additionalDataHeightMm = convertToMm(additionalDataHeightPx, 'px');
            const barcodeHeightMm = convertToMm(barcodeHeightPx, 'px');
            
            // Obtener datos para la vista previa
            const previewsData = isShippingTabActive ? state.shippingPreviewsData : state.lotsPreviewsData;
            const showPageNumber = isShippingTabActive ? state.showPageNumberShipping : state.showPageNumberLots;
            
            if (!previewsData || previewsData.length === 0) {
                throw new Error('No hay datos para imprimir.');
            }
            
            // Guardar el índice actual
            const savedCurrentIndex = isShippingTabActive ? state.currentPreviewIndexShipping : state.currentPreviewIndexLots;
            
            // Crear ventana de impresión
            const printWindow = window.open('', '_blank', 'width=600,height=600');
            if (!printWindow) {
                throw new Error('No se pudo abrir la ventana de impresión. Por favor, permita ventanas emergentes.');
            }
            
            // Obtener la URL completa del CSS
            const cssUrl = new URL('/styles.css', window.location.origin).href;
            
            // Escribir encabezado HTML con estilos mejorados
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Imprimir etiquetas (${previewsData.length})</title>
                    <link rel="stylesheet" href="${cssUrl}">
                    <style>
                        @page { 
                            size: ${labelWidthMm}mm ${labelHeightMm}mm; 
                            margin: ${state.labelMargin}mm; 
                        }
                        
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
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
                            flex-direction: column;
                            align-items: center;
                        }
                        
                        .page-container {
                            width: 100%;
                            height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            page-break-after: always;
                            break-after: page;
                        }
                        
                        .page-container:last-child {
                            page-break-after: auto;
                            break-after: auto;
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
                            padding: 2mm 0 0 0; /* Añadir padding-top equivalente a la mitad del gap */
                            border: none !important; /* Sin borde */
                            width: ${isPortrait ? '96%' : '98%'};  
                            height: ${isPortrait ? '98%' : '96%'}; 
                            margin: 0;
                            position: relative;
                            gap: ${gapMm}mm; /* Mantener el gap del flexbox entre elementos */
                            
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
                        
                        /* Media query para impresión */
                        @media print {
                            .page-number {
                                background: #000000 !important;
                                color: #ffffff !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                        
                        /* Estilos mejorados para elementos internos */
                        .label-element {
                            width: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin: 0;
                            padding: 0;
                        }
                        
                        /* Control explícito de altura y espaciado para cada tipo de elemento */
                        .logo-container {
                            height: ${logoHeightMm}mm;
                            border: none !important; /* Eliminar borde del logo */
                        }
                        
                        .text-container {
                            height: ${textHeightMm}mm;
                            text-align: center;
                            width: 100%;
                        }
                        
                        .additional-data-container {
                            height: ${additionalDataHeightMm}mm;
                            text-align: center;
                            width: 100%;
                        }
                        
                        .barcode-container {
                            height: ${barcodeHeightMm}mm;
                            margin-bottom: 0;
                            border: none !important; /* Eliminar borde del código de barras */
                        }
                        
                        /* Ajuste para imágenes - asegurarse que las imágenes tampoco tengan bordes */
                        .logo-container img,
                        .barcode-container img {
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                            border: none !important; /* Eliminar borde de las imágenes */
                        }
                    </style>
                </head>
                <body>
            `);
            
            // Generar el HTML para cada etiqueta - iterando sobre los datos
            for (let i = 0; i < previewsData.length; i++) {
                // Actualizar el índice actual
                if (isShippingTabActive) {
                    state.currentPreviewIndexShipping = i;
                } else {
                    state.currentPreviewIndexLots = i;
                }
                
                // Actualizar la vista previa para la etiqueta actual
                await previewManager.updatePreview(null, resolvedElements);
                
                // Pequeña pausa para asegurar que la vista previa se actualice correctamente
                await new Promise(resolve => setTimeout(resolve, 100)); // Aumentado a 100ms
                
                // Obtener el HTML de la etiqueta actualizada
                const labelHTML = resolvedElements.LABEL_PREVIEW.innerHTML;
                
                // Añadir esta etiqueta como una página
                printWindow.document.write(`
                    <div class="page-container">
                        <div class="label-container">
                            <div class="label-preview ${isPortrait ? 'portrait' : 'landscape'}">
                                ${labelHTML}
                                ${(showPageNumber && previewsData.length > 1) ? 
                                  `<div class="page-number">${i + 1} OF ${previewsData.length}</div>` : 
                                  ''}
                            </div>
                        </div>
                    </div>
                `);
            }
            
            // Finalizar el HTML
            printWindow.document.write(`
                    <script>
                        window.onload = function() {
                            // Ajustar alturas explícitamente para preservar espaciado
                            document.querySelectorAll('.label-element').forEach(el => {
                                // Asegurar que elementos vacíos mantienen su altura
                                if (el.offsetHeight === 0 && el.classList.contains('logo-container')) {
                                    el.style.height = '${logoHeightMm}mm';
                                }
                                if (el.offsetHeight === 0 && el.classList.contains('text-container')) {
                                    el.style.height = '${textHeightMm}mm';
                                }
                                if (el.offsetHeight === 0 && el.classList.contains('additional-data-container')) {
                                    el.style.height = '${additionalDataHeightMm}mm';
                                }
                                if (el.offsetHeight === 0 && el.classList.contains('barcode-container')) {
                                    el.style.height = '${barcodeHeightMm}mm';
                                }
                            });
                            
                            setTimeout(function() {
                                window.focus();
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 1500); // Aumentado para dar más tiempo
                            }, 800); // Aumentado para asegurar carga completa
                        }
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Restaurar el índice original
            if (isShippingTabActive) {
                state.currentPreviewIndexShipping = savedCurrentIndex;
            } else {
                state.currentPreviewIndexLots = savedCurrentIndex;
            }
            
            // Actualizar la vista previa para mostrar la etiqueta original
            await previewManager.updatePreview(null, resolvedElements);
            
        } catch (error) {
            log(`Error al imprimir: ${error.message}`, 'error');
            const resolvedElements = await elementsPromise;
            showToast(resolvedElements.toastMessage, `Error al imprimir: ${error.message}`);
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