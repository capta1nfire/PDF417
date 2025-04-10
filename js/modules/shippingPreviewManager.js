// js/modules/shippingPreviewManager.js
import { LAYOUT_CONSTANTS } from './constants.js';
import { createLogoContainer, createTextContainer, createBarcodeContainer, createPageNumberContainer, calculateLayoutDimensions } from './commonPreviewUtils.js';
import { log, convertToPixels } from './utils.js';
import { state } from './state.js';

const shippingPreviewManager = {
    // Propiedades para caché de recursos
    cachedBarcodes: {},
    cachedCanvas: null,
    cachedLogo: null,
    
    updatePreview: async (barcodeDataOverride, resolvedElements) => {
        try {
            const dataInput = resolvedElements.shippingDataInput;
            const labelTextInput = resolvedElements.shippingLabelTextInput;
            const templateWidthSlider = resolvedElements.templateWidthSliderShipping;
            const templateHeightSlider = resolvedElements.templateHeightSliderShipping;
            const logoSizeSlider = resolvedElements.logoSizeSliderShipping;
            const logoImage = state.logoImageShipping || resolvedElements.defaultLogoShipping;
            const currentUnit = state.currentUnitShipping;
            const previewsData = state.shippingPreviewsData;
            const currentPreviewIndex = state.currentPreviewIndexShipping;
            const isPortrait = state.isPortraitShipping;

            const inputWidth = templateWidthSlider.value.trim() ? parseFloat(templateWidthSlider.value) : LAYOUT_CONSTANTS.DEFAULT_WIDTH;
            const inputHeight = templateHeightSlider.value.trim() ? parseFloat(templateHeightSlider.value) : LAYOUT_CONSTANTS.DEFAULT_HEIGHT;

            const templateWidthPx = convertToPixels(inputWidth, currentUnit, CONVERSION);
            const templateHeightPx = convertToPixels(inputHeight, currentUnit, CONVERSION);

            // Almacenar en el estado
            state.templateWidthPxShipping = templateWidthPx;
            state.templateHeightPxShipping = templateHeightPx;

            const marginPx = 10 * 2;
            const labelWidthPx = templateWidthPx - marginPx;
            const labelHeightPx = templateHeightPx - marginPx;
            resolvedElements.LABEL_PREVIEW.style.width = `${labelWidthPx}px`;
            resolvedElements.LABEL_PREVIEW.style.height = `${labelHeightPx}px`;

            const { borderPx, gapPx, totalContentHeight, logoHeightPx, textHeightPx, barcodeHeightPx } = calculateLayoutDimensions(templateHeightPx, isPortrait);

            const numTextElements = [
                state.shippingPrefix1,
                labelTextInput.value,
                state.shippingPrefix2 && state.shippingContainerNumber,
                state.shippingPrefix3 && state.shippingTransloadNumber,
                state.shippingCounter
            ].filter(Boolean).length;
            const adjustedTextHeightPx = numTextElements > 0 ? textHeightPx / numTextElements : textHeightPx;

            resolvedElements.LABEL_PREVIEW.style.setProperty('--border-px', `${borderPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--gap-px', `${gapPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--logo-height-px', `${logoHeightPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--text-height-px', `${adjustedTextHeightPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--barcode-height-px', `${barcodeHeightPx}px`);

            const rawData = dataInput.value.trim();
            const dataArray = rawData ? rawData.split('\n').filter(line => line.trim()) : [];
            if (dataArray.length === 0) {
                resolvedElements.LABEL_PREVIEW.appendChild(resolvedElements.emptyBarcodeMsg);
                resolvedElements.previewNavigation.style.display = 'none';
                return;
            } else {
                resolvedElements.emptyBarcodeMsg.style.display = 'none';
            }

            previewsData.length = 0;
            previewsData.push(...dataArray);
            const currentData = barcodeDataOverride || previewsData[currentPreviewIndex] || '';

            const fragment = document.createDocumentFragment();

            const logoContainer = await createLogoContainer(logoImage, parseFloat(logoSizeSlider.value), logoHeightPx, isPortrait ? templateWidthPx : templateHeightPx);
            fragment.appendChild(logoContainer);

            if (state.shippingPrefix1) {
                const prefixContainer = createTextContainer(state.shippingPrefix1, adjustedTextHeightPx, true);
                fragment.appendChild(prefixContainer);
            }

            if (labelTextInput.value) {
                const textContainer = createTextContainer(labelTextInput.value, adjustedTextHeightPx);
                fragment.appendChild(textContainer);
            }

            if (state.shippingPrefix2 && state.shippingContainerNumber) {
                const prefixContainer = createTextContainer(`${state.shippingPrefix2} ${state.shippingContainerNumber}`, adjustedTextHeightPx, true);
                fragment.appendChild(prefixContainer);
            }

            if (state.shippingPrefix3 && state.shippingTransloadNumber) {
                const prefixContainer = createTextContainer(`${state.shippingPrefix3} ${state.shippingTransloadNumber}`, adjustedTextHeightPx, true);
                fragment.appendChild(prefixContainer);
            }

            if (currentData) {
                const barcodeText = `${state.shippingPrefix1}${currentData}`;
                const barcodeContainer = await createBarcodeContainer(barcodeText, barcodeHeightPx, isPortrait, templateWidthPx);
                fragment.appendChild(barcodeContainer);
            }

            if (state.shippingCounter) {
                const counterContainer = createTextContainer(state.shippingCounter, adjustedTextHeightPx);
                fragment.appendChild(counterContainer);
            }

            if (state.showPageNumberShipping && previewsData.length > 1) {
                const pageNumberContainer = createPageNumberContainer(`${currentPreviewIndex + 1} OF ${previewsData.length}`);
                fragment.appendChild(pageNumberContainer);
            }

            resolvedElements.LABEL_PREVIEW.appendChild(fragment);

            resolvedElements.previewNavigation.style.display = previewsData.length > 1 ? 'flex' : 'none';
            resolvedElements.previewCounter.textContent = `${currentPreviewIndex + 1} / ${previewsData.length}`;

            const firstBtn = resolvedElements.firstPreviewBtn;
            const prevBtn = resolvedElements.prevPreviewBtn;
            const nextBtn = resolvedElements.nextPreviewBtn;
            const lastBtn = resolvedElements.lastPreviewBtn;

            if (currentPreviewIndex === 0) {
                firstBtn.disabled = true;
                prevBtn.disabled = true;
            } else {
                firstBtn.disabled = false;
                prevBtn.disabled = false;
            }

            if (currentPreviewIndex === previewsData.length - 1) {
                nextBtn.disabled = true;
                lastBtn.disabled = true;
            } else {
                nextBtn.disabled = false;
                lastBtn.disabled = false;
            }
        } catch (error) {
            log(`Error en shippingPreviewManager.updatePreview: ${error.message}`, 'error');
        }
    },
    
    // Función para liberar recursos
    dispose: function() {
        try {
            // Limpieza de referencias a canvas
            if (this.cachedCanvas) {
                this.cachedCanvas.width = 0;
                this.cachedCanvas.height = 0;
                this.cachedCanvas = null;
            }
            
            // Limpieza de imágenes grandes en memoria
            if (this.cachedLogo) {
                this.cachedLogo.src = '';
                this.cachedLogo = null;
            }
            
            // Limpieza de datos almacenados en caché
            this.cachedBarcodes = {};
            
            log('Recursos de shippingPreviewManager liberados', 'info');
        } catch (error) {
            log(`Error al liberar recursos: ${error.message}`, 'error');
        }
    }
};

export default shippingPreviewManager;