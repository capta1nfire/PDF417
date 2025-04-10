// js/init.js
import { elements } from './modules/elements.js';
import { state, CONVERSION, MAX_PAGES } from './modules/state.js';
import lotsPreviewManager from './modules/lotsPreviewManager.js';
import shippingPreviewManager from './modules/shippingPreviewManager.js';
import previewManager from './modules/previewManager.js';
import { convertToPixels, log, showToast } from './modules/utils.js';
import { exportManager } from './modules/exportManager.js';
import { LAYOUT_CONSTANTS } from './modules/constants.js';

// Definir previewManager como una variable global para que se actualice al cambiar de pestaña
let currentPreviewManager = lotsPreviewManager;

async function initializeApp() {
    try {
        const resolvedElements = await elements;

        // Verificar que los elementos del slider estén disponibles
        if (!resolvedElements.logoSizeSliderLots || !resolvedElements.logoSizeSliderShipping) {
            log('Error: logoSizeSliderLots o logoSizeSliderShipping no están disponibles en el DOM', 'error');
            throw new Error('Elementos del slider no encontrados');
        }

        // Configuración inicial de la pestaña activa
        resolvedElements.lotsTabBtn.classList.add('active');
        resolvedElements.lotsTabContent.classList.add('active');

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
        resolvedElements.lotsTabBtn.addEventListener('click', () => switchTab('lots', resolvedElements));
        resolvedElements.shippingTabBtn.addEventListener('click', () => switchTab('shipping', resolvedElements));

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

        resolvedElements.firstPreviewBtn.addEventListener('click', () => navigatePreview('first', resolvedElements));
        resolvedElements.prevPreviewBtn.addEventListener('click', () => navigatePreview('prev', resolvedElements));
        resolvedElements.nextPreviewBtn.addEventListener('click', () => navigatePreview('next', resolvedElements));
        resolvedElements.lastPreviewBtn.addEventListener('click', () => navigatePreview('last', resolvedElements));

        resolvedElements.printBtn.addEventListener('click', () => exportManager.printLabel());
        resolvedElements.downloadPdfBtn.addEventListener('click', () => exportManager.downloadPDF());
        resolvedElements.generateBatchBtn.addEventListener('click', () => exportManager.generateBatchZip());

        // Actualización inicial
        updatePreviewWithDebounce(resolvedElements);
    } catch (error) {
        log(`Error en initializeApp: ${error.message}`, 'error');
        showToast(null, 'Error inicializando la aplicación.');
    }
}

function switchTab(tab, resolvedElements) {
    resolvedElements.lotsTabBtn.classList.toggle('active', tab === 'lots');
    resolvedElements.shippingTabBtn.classList.toggle('active', tab === 'shipping');
    resolvedElements.lotsTabContent.classList.toggle('active', tab === 'lots');
    resolvedElements.shippingTabContent.classList.toggle('active', tab === 'shipping');
    
    // Limpiar recursos del gestor que ya no se usará
    const isShippingTabActive = tab === 'shipping';
    previewManager.cleanupResources(isShippingTabActive);
    
    // Actualizar el gestor actual después de la limpieza
    currentPreviewManager = isShippingTabActive ? shippingPreviewManager : lotsPreviewManager;
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