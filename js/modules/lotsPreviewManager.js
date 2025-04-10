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
            // NUEVO CÓDIGO: Actualizar inputs cuando se navega entre registros
            if (state.dataFromImport && state.lotsPreviewsData && state.lotsPreviewsData.length > 0) {
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                log(`Mostrando registro #${state.currentPreviewIndexLots + 1}: SKU=${currentRecord.barcodeData}`, 'debug');
                
                // Actualizar inputs con los valores del registro actual
                resolvedElements.lotsDataInput.value = currentRecord.barcodeData || '';
                resolvedElements.lotsAdditionalData.value = currentRecord.additionalData || '';
                
                if (currentRecord.labelText) {
                    resolvedElements.lotsLabelTextInput.value = currentRecord.labelText;
                }
            }
            
            // CONTINUAR CON EL CÓDIGO EXISTENTE
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

            // Primero verificar si tenemos datos importados
            if (state.dataFromImport && state.lotsPreviewsData && state.lotsPreviewsData.length > 0) {
                // Usar los datos ya importados - no sobrescribirlos
                if (previewsData !== state.lotsPreviewsData) {
                    previewsData.length = 0;
                    // Copiar solo los datos del código de barras
                    state.lotsPreviewsData.forEach(record => {
                        previewsData.push(record.barcodeData);
                    });
                }
                
                // Asegurar que previewNavigation sea visible para datos importados
                resolvedElements.previewNavigation.style.display = 'flex';
                resolvedElements.previewNavigation.classList.add('visible');
                
                // Obtener dato adicional para el índice actual
                const additionalDataValue = state.lotsPreviewsData[currentPreviewIndex]?.additionalData || '';
                
                log(`Usando datos importados: ${previewsData.length} registros`, 'debug');
            } else {
                // Comportamiento original para entrada manual
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
                
                log(`Usando datos de entrada manual: ${previewsData.length} registros`, 'debug');
            }

            const additionalDataRaw = additionalDataInput.value.trim();
            const additionalDataValue = additionalDataRaw ? additionalDataRaw.split('\n')[0] : '';

            let currentData = '';
            if (barcodeDataOverride) {
                currentData = barcodeDataOverride;
            } else if (previewsData[currentPreviewIndex]) {
                // Si estamos trabajando con datos importados, el objeto tiene una estructura anidada
                if (state.dataFromImport && typeof previewsData[currentPreviewIndex] === 'object') {
                    currentData = previewsData[currentPreviewIndex].barcodeData || '';
                    log(`Extrayendo barcodeData: ${currentData}`, 'debug');
                } else {
                    // Caso normal - previewsData contiene strings
                    currentData = previewsData[currentPreviewIndex];
                }
            }

            additionalData.length = 0;
            if (additionalDataValue) {
                additionalData.push(additionalDataValue);
            }

            // Determinar el texto de la etiqueta según el origen de los datos
            let labelText = '';
            
            if (state.dataFromImport && state.lotsPreviewsData && state.lotsPreviewsData.length > 0) {
                // Si los datos vienen de importación, usar el texto específico de cada registro
                const currentRecord = state.lotsPreviewsData[state.currentPreviewIndexLots];
                labelText = currentRecord.labelText || labelTextInput.value;
                
                // Actualizar el input con el texto del registro actual (para feedback visual)
                if (labelTextInput.value !== labelText) {
                    labelTextInput.value = labelText;
                    // Disparar evento para actualizar contador
                    labelTextInput.dispatchEvent(new Event('input'));
                }
            } else {
                // Si es entrada manual, usar el valor del input
                labelText = labelTextInput.value;
            }

            const fragment = document.createDocumentFragment();

            const logoContainer = await createLogoContainer(logoImage, state.logoSizeLots, logoHeightPx, isPortrait ? templateWidthPx : templateHeightPx);
            fragment.appendChild(logoContainer);

            if (labelText) {
                const textContainer = createTextContainer(labelText, textHeightPx);
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
    },

    // Al limpiar datos o cambiar a entrada manual, resetear flag
    resetState: function() {
        state.dataFromImport = false;
    }
};

export default lotsPreviewManager;