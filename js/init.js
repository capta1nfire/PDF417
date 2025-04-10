// js/init.js
import { elements } from './modules/elements.js';
import { state, CONVERSION, MAX_PAGES } from './modules/state.js';
import lotsPreviewManager from './modules/lotsPreviewManager.js';
import shippingPreviewManager from './modules/shippingPreviewManager.js';
import previewManager from './modules/previewManager.js';
import { convertToPixels, log, showToast } from './modules/utils.js';
import { exportManager } from './modules/exportManager.js';
import { LAYOUT_CONSTANTS } from './modules/constants.js';
import { importManager } from './modules/importManager.js';

// Definir previewManager como una variable global para que se actualice al cambiar de pestaña
let currentPreviewManager = lotsPreviewManager;

function resolveElements() {
    const elements = {
        // Elementos comunes...
        
        // Elementos de pestañas - con comprobación de existencia
        lotsTabBtn: document.getElementById('lots-tab-btn'),
        shippingTabBtn: document.getElementById('shipping-tab-btn'),
        lotsTabContent: document.getElementById('lots-tab'),
        shippingTabContent: document.getElementById('shipping-tab'),
        
        // Otros elementos...
    };
    
    // Verificar elementos críticos
    const criticalElements = ['LABEL_PREVIEW', 'preview-container'];
    for (const elementId of criticalElements) {
        if (!elements[elementId]) {
            console.error(`Elemento crítico no encontrado: ${elementId}`);
        }
    }
    
    log('Elementos resueltos:', 'debug');
    log(`LABEL_PREVIEW: ${elements.LABEL_PREVIEW ? 'Encontrado' : 'No encontrado'}`, 'debug');
    log(`lotsTabBtn: ${elements.lotsTabBtn ? 'Encontrado' : 'No encontrado'}`, 'debug');
    log(`shippingTabBtn: ${elements.shippingTabBtn ? 'Encontrado' : 'No encontrado'}`, 'debug');
    
    return elements;
}

async function initializeApp() {
    try {
        const resolvedElements = await elements;

        // Activar la pestaña Lotes por defecto
        document.getElementById('lots-tab').classList.add('active');
        if (document.getElementById('lots-tab-btn')) {
            document.getElementById('lots-tab-btn').classList.add('active');
        }

        // Establecer el gestor de vista previa por defecto
        currentPreviewManager = lotsPreviewManager;

        // Verificar que los elementos del slider estén disponibles
        if (!resolvedElements.logoSizeSliderLots || !resolvedElements.logoSizeSliderShipping) {
            log('Error: logoSizeSliderLots o logoSizeSliderShipping no están disponibles en el DOM', 'error');
            throw new Error('Elementos del slider no encontrados');
        }

        // Modificar esta parte para comprobar si el botón existe antes de asignar eventos
        const lotsTabBtn = document.getElementById('lots-tab-btn');
        const shippingTabBtn = document.getElementById('shipping-tab-btn');

        if (lotsTabBtn) {
            lotsTabBtn.addEventListener('click', () => switchTab('lots', resolvedElements));
            // Asegurarse de que la pestaña Lotes esté activa al inicio
            lotsTabBtn.classList.add('active');
            document.getElementById('lots-tab').classList.add('active');
        }

        if (shippingTabBtn) {
            shippingTabBtn.addEventListener('click', () => switchTab('shipping', resolvedElements));
        } else {
            // Si no existe la pestaña Shipping, asegúrate de que currentPreviewManager sea lotsPreviewManager
            currentPreviewManager = lotsPreviewManager;
        }

        // Configuración de las unidades por defecto
        resolvedElements.unitSelectorLots.querySelector(`[data-unit="${state.currentUnitLots}"]`).classList.add('active');
        resolvedElements.unitSelectorShipping.querySelector(`[data-unit="${state.currentUnitShipping}"]`).classList.add('active');

        // Configuración de DPI por defecto
        resolvedElements.dpiLots.value = state.dpiLots;
        resolvedElements.dpiShipping.value = state.dpiShipping;

        // Configuración de dimensiones iniciales con valores por defecto
        resolvedElements.templateWidthSliderLots.value = LAYOUT_CONSTANTS.DEFAULT_WIDTH.toString();
        resolvedElements.templateHeightSliderLots.value = LAYOUT_CONSTANTS.DEFAULT_HEIGHT.toString();
        resolvedElements.templateWidthSliderShipping.value = LAYOUT_CONSTANTS.DEFAULT_WIDTH.toString();
        resolvedElements.templateHeightSliderShipping.value = LAYOUT_CONSTANTS.DEFAULT_HEIGHT.toString();

        resolvedElements.templateWidthUnitLots.textContent = state.currentUnitLots;
        resolvedElements.templateHeightUnitLots.textContent = state.currentUnitLots;
        resolvedElements.templateWidthUnitShipping.textContent = state.currentUnitShipping;
        resolvedElements.templateHeightUnitShipping.textContent = state.currentUnitShipping;

        // Configuración de los sliders
        resolvedElements.barcodeScaleValueLots.textContent = `${resolvedElements.barcodeScaleSliderLots.value}%`;
        resolvedElements.barcodeScaleValueShipping.textContent = `${resolvedElements.barcodeScaleSliderShipping.value}%`;
        resolvedElements.logoSizeValueLots.textContent = `${resolvedElements.logoSizeSliderLots.value}%`;
        resolvedElements.logoSizeValueShipping.textContent = `${resolvedElements.logoSizeSliderShipping.value}%`;

        // Configuración de eventos
        resolvedElements.unitSelectorLots.addEventListener('click', (e) => handleUnitChange(e, 'lots', resolvedElements));
        resolvedElements.unitSelectorShipping.addEventListener('click', (e) => handleUnitChange(e, 'shipping', resolvedElements));

        resolvedElements.dpiLots.addEventListener('change', () => {
            state.dpiLots = parseInt(resolvedElements.dpiLots.value);
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.dpiShipping.addEventListener('change', () => {
            state.dpiShipping = parseInt(resolvedElements.dpiShipping.value);
            updatePreviewWithDebounce(resolvedElements);
        });

        resolvedElements.templateWidthSliderLots.addEventListener('input', () => updatePreviewWithDebounce(resolvedElements));
        resolvedElements.templateHeightSliderLots.addEventListener('input', () => updatePreviewWithDebounce(resolvedElements));
        resolvedElements.templateWidthSliderShipping.addEventListener('input', () => updatePreviewWithDebounce(resolvedElements));
        resolvedElements.templateHeightSliderShipping.addEventListener('input', () => updatePreviewWithDebounce(resolvedElements));

        resolvedElements.barcodeScaleSliderLots.addEventListener('input', () => {
            resolvedElements.barcodeScaleValueLots.textContent = `${resolvedElements.barcodeScaleSliderLots.value}%`;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.barcodeScaleSliderShipping.addEventListener('input', () => {
            resolvedElements.barcodeScaleValueShipping.textContent = `${resolvedElements.barcodeScaleSliderShipping.value}%`;
            updatePreviewWithDebounce(resolvedElements);
        });

        // Configurar eventos del slider del logo con depuración
        resolvedElements.logoSizeSliderLots.addEventListener('input', () => {
            log(`logoSizeSliderLots - Valor: ${resolvedElements.logoSizeSliderLots.value}`, 'debug');
            resolvedElements.logoSizeValueLots.textContent = `${resolvedElements.logoSizeSliderLots.value}%`;
            state.logoSizeLots = parseInt(resolvedElements.logoSizeSliderLots.value);
            log(`state.logoSizeLots actualizado a: ${state.logoSizeLots}`, 'debug');
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.logoSizeSliderShipping.addEventListener('input', () => {
            log(`logoSizeSliderShipping - Valor: ${resolvedElements.logoSizeSliderShipping.value}`, 'debug');
            resolvedElements.logoSizeValueShipping.textContent = `${resolvedElements.logoSizeSliderShipping.value}%`;
            state.logoSizeShipping = parseInt(resolvedElements.logoSizeSliderShipping.value);
            log(`state.logoSizeShipping actualizado a: ${state.logoSizeShipping}`, 'debug');
            updatePreviewWithDebounce(resolvedElements);
        });

        // Contador para el texto del código de barras en "Lotes" (lots-data)
        resolvedElements.lotsDataInput.addEventListener('input', () => {
            updatePreviewWithDebounce(resolvedElements);
            const maxLength = resolvedElements.lotsDataInput.getAttribute('maxlength') || 20;
            const lines = resolvedElements.lotsDataInput.value.split('\n');
            const longestLineLength = Math.max(...lines.map(line => line.length), 0);
            const remaining = maxLength - longestLineLength;
            resolvedElements.lotsDataCounter.textContent = `${remaining} caracteres restantes`;
        });

        // Contador para los datos adicionales en "Lotes" (lots-additional-data)
        resolvedElements.lotsAdditionalData.addEventListener('input', () => {
            updatePreviewWithDebounce(resolvedElements);
            const maxLength = resolvedElements.lotsAdditionalData.getAttribute('maxlength') || 20;
            const lines = resolvedElements.lotsAdditionalData.value.split('\n');
            const longestLineLength = Math.max(...lines.map(line => line.length), 0);
            const remaining = maxLength - longestLineLength;
            resolvedElements.lotsAdditionalDataCounter.textContent = `${remaining} caracteres restantes`;
        });

        // Contador para el texto del código de barras en "Shipping" (shipping-data)
        resolvedElements.shippingDataInput.addEventListener('input', () => {
            updatePreviewWithDebounce(resolvedElements);
            const maxLength = resolvedElements.shippingDataInput.getAttribute('maxlength') || 20;
            const lines = resolvedElements.shippingDataInput.value.split('\n');
            const longestLineLength = Math.max(...lines.map(line => line.length), 0);
            const remaining = maxLength - longestLineLength;
            resolvedElements.shippingDataCounter.textContent = `${remaining} caracteres restantes`;
        });

        // Contador para el texto descriptivo en "Lotes" (ya existente)
        resolvedElements.lotsLabelTextInput.addEventListener('input', () => {
            updatePreviewWithDebounce(resolvedElements);
            const maxLength = resolvedElements.lotsLabelTextInput.getAttribute('maxlength') || 300;
            const currentLength = resolvedElements.lotsLabelTextInput.value.length;
            const remaining = maxLength - currentLength;
            resolvedElements.lotsLabelTextCounter.textContent = `${remaining} caracteres restantes`;
        });

        // Contador para el texto descriptivo en "Shipping" (shipping-label-text)
        resolvedElements.shippingLabelTextInput.addEventListener('input', () => {
            updatePreviewWithDebounce(resolvedElements);
            const maxLength = resolvedElements.shippingLabelTextInput.getAttribute('maxlength') || 250;
            const currentLength = resolvedElements.shippingLabelTextInput.value.length;
            const remaining = maxLength - currentLength;
            resolvedElements.shippingLabelTextCounter.textContent = `${remaining} caracteres restantes`;
        });

        resolvedElements.shippingPrefix1Input.addEventListener('input', () => {
            state.shippingPrefix1 = resolvedElements.shippingPrefix1Input.value;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.shippingPrefix2Input.addEventListener('input', () => {
            state.shippingPrefix2 = resolvedElements.shippingPrefix2Input.value;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.shippingContainerNumberInput.addEventListener('input', () => {
            state.shippingContainerNumber = resolvedElements.shippingContainerNumberInput.value;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.shippingPrefix3Input.addEventListener('input', () => {
            state.shippingPrefix3 = resolvedElements.shippingPrefix3Input.value;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.shippingTransloadNumberInput.addEventListener('input', () => {
            state.shippingTransloadNumber = resolvedElements.shippingTransloadNumberInput.value;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.shippingCounterInput.addEventListener('input', () => {
            state.shippingCounter = resolvedElements.shippingCounterInput.value;
            updatePreviewWithDebounce(resolvedElements);
        });

        resolvedElements.showPageNumberLotsCheckbox.addEventListener('change', () => {
            state.showPageNumberLots = resolvedElements.showPageNumberLotsCheckbox.checked;
            updatePreviewWithDebounce(resolvedElements);
        });
        resolvedElements.showPageNumberShippingCheckbox.addEventListener('change', () => {
            state.showPageNumberShipping = resolvedElements.showPageNumberShippingCheckbox.checked;
            updatePreviewWithDebounce(resolvedElements);
        });

        resolvedElements.orientationBtnLots.addEventListener('click', () => {
            log('Botón orientationBtnLots clickeado', 'info');
            state.isPortraitLots = !state.isPortraitLots;
            resolvedElements.workspace.classList.toggle('landscape', !state.isPortraitLots);
            resolvedElements.previewContainer.classList.toggle('portrait', state.isPortraitLots);
            resolvedElements.previewContainer.classList.toggle('landscape', !state.isPortraitLots);
            log(`Clase del preview-container: ${resolvedElements.previewContainer.className}`, 'info');

            const tempWidth = resolvedElements.templateWidthSliderLots.value;
            resolvedElements.templateWidthSliderLots.value = resolvedElements.templateHeightSliderLots.value;
            resolvedElements.templateHeightSliderLots.value = tempWidth;

            resolvedElements.templateWidthSliderLots.dispatchEvent(new Event('input'));
            resolvedElements.templateHeightSliderLots.dispatchEvent(new Event('input'));

            updatePreviewWithDebounce(resolvedElements);
        });

        resolvedElements.orientationBtnShipping.addEventListener('click', () => {
            log('Botón orientationBtnShipping clickeado', 'info');
            state.isPortraitShipping = !state.isPortraitShipping;
            resolvedElements.workspace.classList.toggle('landscape', !state.isPortraitShipping);
            resolvedElements.previewContainer.classList.toggle('portrait', state.isPortraitShipping);
            resolvedElements.previewContainer.classList.toggle('landscape', !state.isPortraitShipping);
            log(`Clase del preview-container: ${resolvedElements.previewContainer.className}`, 'info');

            const tempWidth = resolvedElements.templateWidthSliderShipping.value;
            resolvedElements.templateWidthSliderShipping.value = resolvedElements.templateHeightSliderShipping.value;
            resolvedElements.templateHeightSliderShipping.value = tempWidth;

            resolvedElements.templateWidthSliderShipping.dispatchEvent(new Event('input'));
            resolvedElements.templateHeightSliderShipping.dispatchEvent(new Event('input'));

            updatePreviewWithDebounce(resolvedElements);
        });

        resolvedElements.uploadLogoBtnLots.addEventListener('click', () => resolvedElements.logoUploadLots.click());
        resolvedElements.uploadLogoBtnShipping.addEventListener('click', () => resolvedElements.logoUploadShipping.click());

        resolvedElements.logoUploadLots.addEventListener('change', (e) => handleLogoUpload(e, 'lots', resolvedElements));
        resolvedElements.logoUploadShipping.addEventListener('change', (e) => handleLogoUpload(e, 'shipping', resolvedElements));

        resolvedElements.firstPreviewBtn.addEventListener('click', () => {
            navigatePreview('first', resolvedElements);
            // Si los datos provienen de importación, actualizar también los inputs
            if (state.dataFromImport && state.lotsPreviewsData.length > 0) {
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                resolvedElements.lotsDataInput.value = currentRecord.barcodeData || '';
                resolvedElements.lotsAdditionalData.value = currentRecord.additionalData || '';
            }
        });

        resolvedElements.prevPreviewBtn.addEventListener('click', () => {
            navigatePreview('prev', resolvedElements);
            // Si los datos provienen de importación, actualizar también los inputs
            if (state.dataFromImport && state.lotsPreviewsData.length > 0) {
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                resolvedElements.lotsDataInput.value = currentRecord.barcodeData || '';
                resolvedElements.lotsAdditionalData.value = currentRecord.additionalData || '';
            }
        });

        resolvedElements.nextPreviewBtn.addEventListener('click', () => {
            navigatePreview('next', resolvedElements);
            // Si los datos provienen de importación, actualizar también los inputs
            if (state.dataFromImport && state.lotsPreviewsData.length > 0) {
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                resolvedElements.lotsDataInput.value = currentRecord.barcodeData || '';
                resolvedElements.lotsAdditionalData.value = currentRecord.additionalData || '';
            }
        });

        resolvedElements.lastPreviewBtn.addEventListener('click', () => {
            navigatePreview('last', resolvedElements);
            // Si los datos provienen de importación, actualizar también los inputs
            if (state.dataFromImport && state.lotsPreviewsData.length > 0) {
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                resolvedElements.lotsDataInput.value = currentRecord.barcodeData || '';
                resolvedElements.lotsAdditionalData.value = currentRecord.additionalData || '';
            }
        });

        // Añadir después de la configuración de los botones de navegación

        // Navegación con teclado para etiquetas
        document.addEventListener('keydown', (event) => {
            // Solo procesar cuando hay múltiples etiquetas
            if (!state.lotsPreviewsData || state.lotsPreviewsData.length <= 1) return;
            
            // Asegurarse de que no estamos en un campo de entrada de texto
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
            
            const currentIndex = state.currentPreviewIndexLots;
            const lastIndex = state.lotsPreviewsData.length - 1;
            
            switch (event.key) {
                case 'ArrowLeft': // Flecha izquierda
                case 'ArrowUp':   // Flecha arriba
                    if (currentIndex > 0) {
                        navigatePreview('prev', resolvedElements);
                    }
                    break;
                    
                case 'ArrowRight': // Flecha derecha
                case 'ArrowDown':  // Flecha abajo
                    if (currentIndex < lastIndex) {
                        navigatePreview('next', resolvedElements);
                    }
                    break;
                    
                case 'Home': // Tecla Inicio
                    if (currentIndex !== 0) {
                        navigatePreview('first', resolvedElements);
                    }
                    break;
                    
                case 'End': // Tecla Fin
                    if (currentIndex !== lastIndex) {
                        navigatePreview('last', resolvedElements);
                    }
                    break;
                    
                default:
                    return; // No hacer nada para otras teclas
            }
        });

        resolvedElements.printBtn.addEventListener('click', () => exportManager.printLabel());
        resolvedElements.downloadPdfBtn.addEventListener('click', () => exportManager.downloadPDF());
        resolvedElements.generateBatchBtn.addEventListener('click', () => exportManager.generateBatchZip());

        // Configurar el botón de importación
        const importDataBtn = document.getElementById('import-data-btn');
        const fileUploadInput = document.getElementById('file-upload');

        if (importDataBtn && fileUploadInput) {
            importDataBtn.addEventListener('click', () => {
                fileUploadInput.click();
            });
            
            fileUploadInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    // Mostrar spinner durante la importación
                    document.getElementById('loading-overlay').style.display = 'flex';
                    
                    const success = await importManager.processFile(file, resolvedElements);
                    
                    // Ocultar spinner
                    document.getElementById('loading-overlay').style.display = 'none';
                    
                    if (success) {
                        showToast(resolvedElements.toastMessage, 'Archivo importado correctamente');
                        updatePreviewWithDebounce(resolvedElements);
                    } else {
                        showToast(resolvedElements.toastMessage, 'Error al importar el archivo');
                    }
                    
                    // Limpiar el input
                    fileUploadInput.value = '';
                }
            });
        }

        // Actualización inicial
        updatePreviewWithDebounce(resolvedElements);
    } catch (error) {
        log(`Error en initializeApp: ${error.message}`, 'error');
        showToast(null, 'Error inicializando la aplicación.');
    }
}

function switchTab(tab, resolvedElements) {
    const lotsTabBtn = resolvedElements.lotsTabBtn || document.getElementById('lots-tab-btn');
    const shippingTabBtn = resolvedElements.shippingTabBtn || document.getElementById('shipping-tab-btn');
    const lotsTabContent = resolvedElements.lotsTabContent || document.getElementById('lots-tab');
    const shippingTabContent = resolvedElements.shippingTabContent || document.getElementById('shipping-tab');

    // Solo modifica clases si los elementos existen
    if (lotsTabBtn) lotsTabBtn.classList.toggle('active', tab === 'lots');
    if (shippingTabBtn) shippingTabBtn.classList.toggle('active', tab === 'shipping');
    if (lotsTabContent) lotsTabContent.classList.toggle('active', tab === 'lots');
    if (shippingTabContent) shippingTabContent.classList.toggle('active', tab === 'shipping');

    // Actualizar el gestor de vista previa actual
    const isShippingTabActive = tab === 'shipping' && shippingTabBtn;

    // Si estamos limpiando recursos, asegurémonos de que exista el manager antes de llamar a dispose
    if (previewManager.cleanupResources) {
        previewManager.cleanupResources(isShippingTabActive);
    }

    // Establecer el manager de vista previa correcto
    currentPreviewManager = isShippingTabActive ? shippingPreviewManager : lotsPreviewManager;

    // Actualizar la vista previa
    updatePreviewWithDebounce(resolvedElements);
}

function handleUnitChange(event, tab, resolvedElements) {
    const unit = event.target.dataset.unit;
    if (!unit) return;

    const unitSelector = tab === 'lots' ? resolvedElements.unitSelectorLots : resolvedElements.unitSelectorShipping;
    const widthSlider = tab === 'lots' ? resolvedElements.templateWidthSliderLots : resolvedElements.templateWidthSliderShipping;
    const heightSlider = tab === 'lots' ? resolvedElements.templateHeightSliderLots : resolvedElements.templateHeightSliderShipping;
    const widthUnitDisplay = tab === 'lots' ? resolvedElements.templateWidthUnitLots : resolvedElements.templateWidthUnitShipping;
    const heightUnitDisplay = tab === 'lots' ? resolvedElements.templateHeightUnitLots : resolvedElements.templateHeightUnitShipping;

    unitSelector.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const currentUnit = tab === 'lots' ? state.currentUnitLots : state.currentUnitShipping;
    const newUnit = unit;

    if (currentUnit !== newUnit) {
        const currentWidth = parseFloat(widthSlider.value) || LAYOUT_CONSTANTS.DEFAULT_WIDTH;
        const currentHeight = parseFloat(heightSlider.value) || LAYOUT_CONSTANTS.DEFAULT_HEIGHT;

        if (currentUnit === 'in' && newUnit === 'cm') {
            widthSlider.value = (currentWidth * 2.54).toFixed(2);
            heightSlider.value = (currentHeight * 2.54).toFixed(2);
        } else if (currentUnit === 'in' && newUnit === 'px') {
            widthSlider.value = Math.round(currentWidth * CONVERSION.PIXELS_PER_INCH);
            heightSlider.value = Math.round(currentHeight * CONVERSION.PIXELS_PER_INCH);
        } else if (currentUnit === 'cm' && newUnit === 'in') {
            widthSlider.value = (currentWidth / 2.54).toFixed(2);
            heightSlider.value = (currentHeight / 2.54).toFixed(2);
        } else if (currentUnit === 'cm' && newUnit === 'px') {
            widthSlider.value = Math.round(currentWidth * CONVERSION.PIXELS_PER_CM);
            heightSlider.value = Math.round(currentHeight * CONVERSION.PIXELS_PER_CM);
        } else if (currentUnit === 'px' && newUnit === 'in') {
            widthSlider.value = (currentWidth / CONVERSION.PIXELS_PER_INCH).toFixed(2);
            heightSlider.value = (currentHeight / CONVERSION.PIXELS_PER_INCH).toFixed(2);
        } else if (currentUnit === 'px' && newUnit === 'cm') {
            widthSlider.value = (currentWidth / CONVERSION.PIXELS_PER_CM).toFixed(2);
            heightSlider.value = (currentHeight / CONVERSION.PIXELS_PER_CM).toFixed(2);
        }

        if (tab === 'lots') {
            state.currentUnitLots = newUnit;
        } else {
            state.currentUnitShipping = newUnit;
        }

        widthUnitDisplay.textContent = newUnit;
        heightUnitDisplay.textContent = newUnit;
        updatePreviewWithDebounce(resolvedElements);
    }
}

function handleLogoUpload(event, tab, resolvedElements) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                if (tab === 'lots') {
                    state.logoImageLots = img;
                } else {
                    state.logoImageShipping = img;
                }
                updatePreviewWithDebounce(resolvedElements);
            };
        };
        reader.readAsDataURL(file);
    }
}

function navigatePreview(direction, resolvedElements) {
    const previewsData = currentPreviewManager === lotsPreviewManager ? state.lotsPreviewsData : state.shippingPreviewsData;
    let currentIndex = currentPreviewManager === lotsPreviewManager ? state.currentPreviewIndexLots : state.currentPreviewIndexShipping;

    if (direction === 'first') {
        currentIndex = 0;
    } else if (direction === 'prev') {
        currentIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'next') {
        currentIndex = Math.min(previewsData.length - 1, currentIndex + 1);
    } else if (direction === 'last') {
        currentIndex = previewsData.length - 1;
    }

    if (currentPreviewManager === lotsPreviewManager) {
        state.currentPreviewIndexLots = currentIndex;
    } else {
        state.currentPreviewIndexShipping = currentIndex;
    }

    updatePreviewWithDebounce(resolvedElements);
}

let debounceTimer;
function updatePreviewWithDebounce(resolvedElements) {
    clearTimeout(debounceTimer);
    log('updatePreviewWithDebounce ejecutado', 'info');
    debounceTimer = setTimeout(() => {
        log(`updatePreviewWithDebounce - Calling previewManager.updatePreview - resolvedElements: ${resolvedElements ? 'Defined' : 'Undefined'}`, 'info');
        currentPreviewManager.updatePreview(null, resolvedElements);
    }, 300);
}

initializeApp();