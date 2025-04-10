// js/modules/lotsPreviewManager.js
import { state, CONVERSION } from './state.js';
import { log, showToast, convertToPixels } from './utils.js';
import { calculateLayoutDimensions, createLogoContainer, createTextContainer, createBarcodeContainer, createPageNumberContainer, createAdditionalDataContainer } from './commonPreviewUtils.js';
import { LAYOUT_CONSTANTS } from './constants.js';

export async function updatePreview(event, resolvedElements) {
    try {
        console.log('Elements received:', Object.keys(resolvedElements));
        console.log('LABEL_PREVIEW:', resolvedElements.LABEL_PREVIEW);
        // ... rest of the function
    } catch (error) {
        console.error('Error in updatePreview:', error);
        throw error;
    }
}

const lotsPreviewManager = {
    // Propiedades para caché de recursos
    cachedBarcodes: {},
    cachedCanvas: null,
    cachedLogo: null,
    
    updatePreview: async (barcodeDataOverride, resolvedElements) => {
        try {
            const dataInput = resolvedElements.lotsDataInput;
            const additionalDataInput = resolvedElements.lotsAdditionalData;
            const labelTextInput = resolvedElements.lotsLabelTextInput;
            const templateWidthSlider = resolvedElements.templateWidthSliderLots;
            const templateHeightSlider = resolvedElements.templateHeightSliderLots;
            const logoImage = state.logoImageLots || resolvedElements.defaultLogoLots;
            const currentUnit = state.currentUnitLots;
            const previewsData = state.lotsPreviewsData;
            const additionalData = state.lotsAdditionalData;
            const currentPreviewIndex = state.currentPreviewIndexLots;
            const isPortrait = state.isPortraitLots;

            if (!dataInput || !templateWidthSlider || !templateHeightSlider) {
                throw new Error("Faltan elementos esenciales en el DOM.");
            }

            log(`isPortraitLots: ${isPortrait}`, 'info');
            log(`Input Values - Width: ${templateWidthSlider.value}, Height: ${templateHeightSlider.value}`, 'info');

            const inputWidth = templateWidthSlider.value.trim() ? parseFloat(templateWidthSlider.value) : LAYOUT_CONSTANTS.DEFAULT_WIDTH;
            const inputHeight = templateHeightSlider.value.trim() ? parseFloat(templateHeightSlider.value) : LAYOUT_CONSTANTS.DEFAULT_HEIGHT;

            const templateWidthPx = convertToPixels(inputWidth, currentUnit, CONVERSION);
            const templateHeightPx = convertToPixels(inputHeight, currentUnit, CONVERSION);

            // Almacenar en el estado
            state.templateWidthPxLots = templateWidthPx;
            state.templateHeightPxLots = templateHeightPx;

            log(`Calculated Pixels - templateWidthPx: ${templateWidthPx}, templateHeightPx: ${templateHeightPx}`, 'info');

            resolvedElements.previewContainer.style.width = `${templateWidthPx}px`;
            resolvedElements.previewContainer.style.height = `${templateHeightPx}px`;

            const marginPx = 10 * 2;
            const labelWidthPx = templateWidthPx - marginPx;
            const labelHeightPx = templateHeightPx - marginPx;
            resolvedElements.LABEL_PREVIEW.style.width = `${labelWidthPx}px`;
            resolvedElements.LABEL_PREVIEW.style.height = `${labelHeightPx}px`;
            log(`Applied Dimensions - Width: ${labelWidthPx}px, Height: ${labelHeightPx}px`, 'info');

            const computedStyle = window.getComputedStyle(resolvedElements.previewContainer);
            log(`Computed Style - Width: ${computedStyle.width}, Height: ${computedStyle.height}`, 'info');

            const workspaceRect = resolvedElements.workspace.getBoundingClientRect();
            const availableWidth = workspaceRect.width - 48;
            const availableHeight = workspaceRect.height - 48;
            const scaleX = availableWidth / templateWidthPx;
            const scaleY = availableHeight / templateHeightPx;
            const scale = Math.min(scaleX, scaleY, LAYOUT_CONSTANTS.MAX_SCALE_FACTOR);

            resolvedElements.previewContainer.style.transform = `scale(${scale})`;
            resolvedElements.LABEL_PREVIEW.style.transform = `scale(${scale})`;

            resolvedElements.previewContainer.style.display = 'none';
            resolvedElements.previewContainer.offsetHeight;
            resolvedElements.previewContainer.style.display = 'block';

            const { borderPx, gapPx, totalContentHeight, logoHeightPx, textHeightPx, additionalDataHeightPx, barcodeHeightPx } = calculateLayoutDimensions(templateHeightPx, isPortrait);

            resolvedElements.LABEL_PREVIEW.style.setProperty('--border-px', `${borderPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--gap-px', `${gapPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--logo-height-px', `${logoHeightPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--text-height-px', `${textHeightPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--additional-data-height-px', `${additionalDataHeightPx}px`);
            resolvedElements.LABEL_PREVIEW.style.setProperty('--barcode-height-px', `${barcodeHeightPx}px`);

            resolvedElements.LABEL_PREVIEW.className = `label-preview ${isPortrait ? 'portrait' : 'landscape'}`;

            resolvedElements.emptyBarcodeMsg.style.position = 'absolute';
            resolvedElements.emptyBarcodeMsg.style.top = '50%';
            resolvedElements.emptyBarcodeMsg.style.left = '50%';
            resolvedElements.emptyBarcodeMsg.style.transform = 'translate(-50%, -50%)';
            resolvedElements.emptyBarcodeMsg.style.width = '80%';
            resolvedElements.emptyBarcodeMsg.style.textAlign = 'center';

            resolvedElements.LABEL_PREVIEW.innerHTML = '';
            resolvedElements.emptyBarcodeMsg.style.display = 'block';

            console.log('LABEL_PREVIEW:', resolvedElements.LABEL_PREVIEW);
            console.log('LABEL_PREVIEW.style:', resolvedElements.LABEL_PREVIEW?.style);

            const rawData = dataInput.value.trim();
            const dataArray = rawData ? rawData.split('\n').filter(line => line.trim()) : [];
            if (dataArray.length === 0) {
                resolvedElements.LABEL_PREVIEW.appendChild(resolvedElements.emptyBarcodeMsg);
                resolvedElements.previewNavigation.style.display = 'none';
                return;
            } else {
                resolvedElements.emptyBarcodeMsg.style.display = 'none';
            }

            const additionalDataRaw = additionalDataInput.value.trim();
            const additionalDataValue = additionalDataRaw ? additionalDataRaw.split('\n')[0] : '';

            previewsData.length = 0;
            previewsData.push(...dataArray);
            const currentData = barcodeDataOverride || previewsData[currentPreviewIndex] || '';

            additionalData.length = 0;
            if (additionalDataValue) {
                additionalData.push(additionalDataValue);
            }

            const fragment = document.createDocumentFragment();

            const logoContainer = await createLogoContainer(logoImage, state.logoSizeLots, logoHeightPx, isPortrait ? templateWidthPx : templateHeightPx);
            fragment.appendChild(logoContainer);

            if (labelTextInput.value) {
                const textContainer = createTextContainer(labelTextInput.value, textHeightPx);
                fragment.appendChild(textContainer);
            }

            if (additionalDataValue) {
                const additionalDataContainer = createAdditionalDataContainer(additionalDataValue, additionalDataHeightPx);
                fragment.appendChild(additionalDataContainer);
            }

            if (currentData) {
                log(`Calling createBarcodeContainer - currentData: ${currentData}, barcodeHeightPx: ${barcodeHeightPx}, isPortrait: ${isPortrait}, typeof isPortrait: ${typeof isPortrait}`, 'info');
                const barcodeContainer = await createBarcodeContainer(currentData, barcodeHeightPx, isPortrait, templateWidthPx);
                fragment.appendChild(barcodeContainer);
            }

            if (state.showPageNumberLots && previewsData.length > 1) {
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
            log(`Error en lotsPreviewManager.updatePreview: ${error.message}`, 'error');
            if (resolvedElements && resolvedElements.toastMessage) {
                showToast(resolvedElements.toastMessage, 'Error actualizando vista previa.');
            }
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
            
            log('Recursos de lotsPreviewManager liberados', 'info');
        } catch (error) {
            log(`Error al liberar recursos: ${error.message}`, 'error');
        }
    }
};

export default lotsPreviewManager;