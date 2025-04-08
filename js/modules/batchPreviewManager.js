// js/modules/batchPreviewManager.js
import { elements } from './elements.js';
import { state, MAX_PAGES } from './state.js';
import { log, showToast } from './utils.js';
import { previewManager } from './previewManager.js'; // Importar como objeto

/**
 * Gestiona las vistas previas de lotes.
 * @type {Object}
 */
export const batchPreviewManager = {
    /**
     * Genera las vistas previas para los datos de lotes ingresados.
     */
    generateBatchPreviews: () => {
        const batchData = elements.batchDataTextarea.value.trim();
        log(`Datos del lote: "${batchData}"`);

        if (!batchData) {
            log("No hay datos en el lote, limpiando vistas previas");
            state.previewsData = [];
            state.currentPreviewIndex = 0;
            state.currentBarcodeData = '';
            elements.previewNavigation.style.display = 'none';
            previewManager.updatePreview();
            return;
        }

        let dataLines = batchData.split('\n')
            .map(line => line.trim())
            .filter(line => line);

        if (dataLines.length === 0) {
            log("No hay datos válidos en el lote, limpiando vistas previas");
            state.previewsData = [];
            state.currentPreviewIndex = 0;
            state.currentBarcodeData = '';
            elements.previewNavigation.style.display = 'none';
            previewManager.updatePreview();
            return;
        }

        if (dataLines.length > MAX_PAGES) {
            log(`Número de etiquetas excede el máximo de ${MAX_PAGES}. Recortando...`);
            dataLines = dataLines.slice(0, MAX_PAGES);
            showToast(elements.toastMessage, `Se han limitado las etiquetas a un máximo de ${MAX_PAGES}.`);
        }

        state.previewsData = dataLines;
        state.currentPreviewIndex = 0;

        if (dataLines.length > 1) {
            elements.previewNavigation.style.display = 'flex';
            batchPreviewManager.updatePreviewCounter();
            batchPreviewManager.updateNavigationButtons();
        } else {
            elements.previewNavigation.style.display = 'none';
        }

        batchPreviewManager.showPreviewAtIndex(0);
    },

    /**
     * Muestra la vista previa en el índice especificado.
     * @param {number} index - Índice de la etiqueta a mostrar.
     */
    showPreviewAtIndex: (index) => {
        if (index < 0 || index >= state.previewsData.length || state.previewsData.length === 0) {
            log(`Índice inválido: ${index}, longitud de previewsData: ${state.previewsData.length}`);
            return;
        }

        state.currentBarcodeData = state.previewsData[index];
        state.currentPreviewIndex = index;
        batchPreviewManager.updatePreviewCounter();
        previewManager.updatePreview();
        batchPreviewManager.updateNavigationButtons();
    },

    /**
     * Actualiza el contador de vistas previas.
     */
    updatePreviewCounter: () => {
        if (elements.previewCounter && state.previewsData.length > 0) {
            elements.previewCounter.textContent = `${state.currentPreviewIndex + 1} / ${state.previewsData.length}`;
        }
    },

    /**
     * Actualiza el estado de los botones de navegación.
     */
    updateNavigationButtons: () => {
        elements.firstPreviewBtn.disabled = state.currentPreviewIndex === 0;
        elements.prevPreviewBtn.disabled = state.currentPreviewIndex === 0;
        elements.nextPreviewBtn.disabled = state.currentPreviewIndex === state.previewsData.length - 1;
        elements.lastPreviewBtn.disabled = state.currentPreviewIndex === state.previewsData.length - 1;
    },

    /**
     * Navega a la primera etiqueta.
     */
    navigateToFirst: () => {
        batchPreviewManager.showPreviewAtIndex(0);
    },

    /**
     * Navega a la etiqueta anterior.
     */
    navigatePrevious: () => {
        batchPreviewManager.showPreviewAtIndex(state.currentPreviewIndex - 1);
    },

    /**
     * Navega a la siguiente etiqueta.
     */
    navigateNext: () => {
        batchPreviewManager.showPreviewAtIndex(state.currentPreviewIndex + 1);
    },

    /**
     * Navega a la última etiqueta.
     */
    navigateToLast: () => {
        batchPreviewManager.showPreviewAtIndex(state.previewsData.length - 1);
    },

    /**
     * Configura los eventos de la pestaña Lotes.
     */
    setupBatchPreviewEvents: () => {
        log("Inicializando eventos para vista previa de lotes");

        elements.batchDataTextarea.addEventListener('input', () => {
            log("Cambio en datos del lote detectado");
            batchPreviewManager.generateBatchPreviews();
        });

        elements.firstPreviewBtn.addEventListener('click', () => {
            log("Navegando a la primera etiqueta");
            batchPreviewManager.navigateToFirst();
        });

        elements.prevPreviewBtn.addEventListener('click', () => {
            log("Navegando a etiqueta anterior");
            batchPreviewManager.navigatePrevious();
        });

        elements.nextPreviewBtn.addEventListener('click', () => {
            log("Navegando a etiqueta siguiente");
            batchPreviewManager.navigateNext();
        });

        elements.lastPreviewBtn.addEventListener('click', () => {
            log("Navegando a la última etiqueta");
            batchPreviewManager.navigateToLast();
        });

        document.addEventListener('keydown', (e) => {
            const isBatchTabActive = elements.batchTabContent.classList.contains('active');
            if (!isBatchTabActive || state.previewsData.length <= 1) return;

            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                    log("Navegando a etiqueta anterior con tecla");
                    batchPreviewManager.navigatePrevious();
                    break;
                case 'ArrowRight':
                    log("Navegando a etiqueta siguiente con tecla");
                    batchPreviewManager.navigateNext();
                    break;
                case 'Home':
                    log("Navegando a la primera etiqueta con tecla");
                    batchPreviewManager.navigateToFirst();
                    break;
                case 'End':
                    log("Navegando a la última etiqueta con tecla");
                    batchPreviewManager.navigateToLast();
                    break;
            }
        });

        elements.batchLabelTextInput.addEventListener('input', function() {
            if (this.value.length > 250) {
                this.value = this.value.substring(0, 250);
                showToast(elements.toastMessage, 'El texto descriptivo no puede exceder los 250 caracteres.');
            }
            previewManager.updatePreview();
        });

        elements.showPageNumberCheckbox.addEventListener('change', () => {
            state.showPageNumber = elements.showPageNumberCheckbox.checked;
            log(`Mostrar número de página: ${state.showPageNumber}`);
            previewManager.updatePreview();
        });
    }
};