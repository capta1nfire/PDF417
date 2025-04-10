// js/modules/previewManager.js
import { elements as elementsPromise } from './elements.js';
import { state } from './state.js';
import { log, showToast } from './utils.js';
import lotsPreviewManager from './lotsPreviewManager.js';
import shippingPreviewManager from './shippingPreviewManager.js';

const previewManager = {
    updatePreview: async (barcodeDataOverride, resolvedElements) => {
        try {
            log("Actualizando vista previa...");
            state.bwipjsLoaded = true;

            // Si resolvedElements no se proporcionó, obtenlo
            if (!resolvedElements) {
                resolvedElements = await elementsPromise;
            }

            log("Elements resueltos en previewManager:", {
                shippingTabContent: resolvedElements.shippingTabContent ? 'Encontrado' : 'No encontrado',
                lotsTabContent: resolvedElements.lotsTabContent ? 'Encontrado' : 'No encontrado',
                previewContainer: resolvedElements.previewContainer ? 'Encontrado' : 'No encontrado',
                LABEL_PREVIEW: resolvedElements.LABEL_PREVIEW ? 'Encontrado' : 'No encontrado',
                emptyBarcodeMsg: resolvedElements.emptyBarcodeMsg ? 'Encontrado' : 'No encontrado',
                workspace: resolvedElements.workspace ? 'Encontrado' : 'No encontrado'
            });

            if (!resolvedElements || !resolvedElements.shippingTabContent || !resolvedElements.lotsTabContent || 
                !resolvedElements.previewContainer || !resolvedElements.LABEL_PREVIEW || !resolvedElements.emptyBarcodeMsg || !resolvedElements.workspace) {
                throw new Error("Elementos del DOM no están definidos: " + 
                    JSON.stringify({
                        elements: !!resolvedElements,
                        shippingTabContent: !!resolvedElements?.shippingTabContent,
                        lotsTabContent: !!resolvedElements?.lotsTabContent,
                        previewContainer: !!resolvedElements?.previewContainer,
                        LABEL_PREVIEW: !!resolvedElements?.LABEL_PREVIEW,
                        emptyBarcodeMsg: !!resolvedElements?.emptyBarcodeMsg,
                        workspace: !!resolvedElements?.workspace
                    }));
            }

            const isShippingTabActive = resolvedElements.shippingTabContent.classList.contains('active');
            if (isShippingTabActive) {
                const isPortrait = state.isPortraitShipping;
                log(`Calling shippingPreviewManager.updatePreview - barcodeDataOverride: ${barcodeDataOverride}, isPortrait: ${isPortrait}`, 'info');
                await shippingPreviewManager.updatePreview(barcodeDataOverride, resolvedElements);
            } else {
                const isPortrait = state.isPortraitLots;
                log(`Calling lotsPreviewManager.updatePreview - barcodeDataOverride: ${barcodeDataOverride}, isPortrait: ${isPortrait}`, 'info');
                await lotsPreviewManager.updatePreview(barcodeDataOverride, resolvedElements);
            }

        } catch (error) {
            log(`Error en previewManager.updatePreview: ${error.message}`, 'error');
            const resolvedElementsLocal = await elementsPromise;
            if (resolvedElementsLocal && resolvedElementsLocal.toastMessage) {
                showToast(resolvedElementsLocal.toastMessage, 'Error actualizando vista previa.');
            }
        }
    },

    toggleOrientation: async (isShippingTab) => {
        log("Cambiando orientación");
        const resolvedElements = await elementsPromise;
        const currentIsPortrait = isShippingTab ? state.isPortraitShipping : state.isPortraitLots;
        if (isShippingTab) state.isPortraitShipping = !currentIsPortrait;
        else state.isPortraitLots = !currentIsPortrait;
        const newIsPortrait = !currentIsPortrait;

        // Ajustar dimensiones
        const templateWidthSlider = isShippingTab ? resolvedElements.templateWidthSliderShipping : resolvedElements.templateWidthSliderLots;
        const templateHeightSlider = isShippingTab ? resolvedElements.templateHeightSliderShipping : resolvedElements.templateHeightSliderLots;
        const tempWidth = templateWidthSlider.value;
        templateWidthSlider.value = templateHeightSlider.value;
        templateHeightSlider.value = tempWidth;

        // Ajustar alineación
        resolvedElements.workspace.className = `workspace ${newIsPortrait ? 'portrait' : 'landscape'}`;
        resolvedElements.previewContainer.className = `preview-container ${newIsPortrait ? 'portrait' : 'landscape'}`;

        log(`Orientación cambiada a: ${newIsPortrait ? 'Portrait' : 'Landscape'}`);
        await previewManager.updatePreview(null, resolvedElements);
        const orientationBtn = isShippingTab ? resolvedElements.orientationBtnShipping : resolvedElements.orientationBtnLots;
        if (orientationBtn) orientationBtn.title = newIsPortrait ? 'Cambiar a Horizontal' : 'Cambiar a Vertical';
        if (resolvedElements && resolvedElements.toastMessage) {
            showToast(resolvedElements.toastMessage, `Orientación: ${newIsPortrait ? 'Vertical' : 'Horizontal'}`);
        }
    },

    cleanupResources: async (isShippingTabActive) => {
        try {
            // Limpiar recursos del gestor que no se usará
            if (isShippingTabActive) {
                // Si shipping está activo, limpiar lotes
                lotsPreviewManager.dispose();
                log("Recursos de lotsPreviewManager liberados durante cambio de pestaña", 'info');
            } else {
                // Si lotes está activo, limpiar shipping
                shippingPreviewManager.dispose();
                log("Recursos de shippingPreviewManager liberados durante cambio de pestaña", 'info');
            }
        } catch (error) {
            log(`Error al limpiar recursos: ${error.message}`, 'error');
        }
    }
};

export default previewManager;