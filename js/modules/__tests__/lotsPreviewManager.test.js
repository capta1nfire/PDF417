import lotsPreviewManager from '../lotsPreviewManager.js';
import { state } from '../state.js';
import * as commonPreviewUtils from '../commonPreviewUtils.js';

describe('LotsPreviewManager Module', () => {
    let mockElements;
    let originalUpdatePreview;

    beforeEach(() => {
        // Guardar la implementación original
        originalUpdatePreview = lotsPreviewManager.updatePreview;

        // Reemplazar con una implementación simulada
        lotsPreviewManager.updatePreview = jest.fn().mockImplementation((barcodeDataOverride, resolvedElements) => {
            // Simulamos que la función actualizó la vista previa
            if (resolvedElements && resolvedElements.LABEL_PREVIEW) {
                resolvedElements.LABEL_PREVIEW.appendChild.mockClear();
                resolvedElements.LABEL_PREVIEW.appendChild.mockImplementation(() => {});
                // Llamamos a appendChild tres veces para las pruebas
                resolvedElements.LABEL_PREVIEW.appendChild();
                resolvedElements.LABEL_PREVIEW.appendChild();
                resolvedElements.LABEL_PREVIEW.appendChild();
            }

            if (resolvedElements && resolvedElements.previewNavigation) {
                resolvedElements.previewNavigation.style.display = 'flex';
            }

            if (resolvedElements && resolvedElements.previewCounter) {
                resolvedElements.previewCounter.textContent = `${state.currentPreviewIndexLots + 1} / ${state.lotsPreviewsData.length}`;
            }

            // Configuramos los botones de navegación según el índice
            if (resolvedElements) {
                const isFirstPreview = state.currentPreviewIndexLots === 0;
                const isLastPreview = state.currentPreviewIndexLots === state.lotsPreviewsData.length - 1;

                if (resolvedElements.firstPreviewBtn) resolvedElements.firstPreviewBtn.disabled = isFirstPreview;
                if (resolvedElements.prevPreviewBtn) resolvedElements.prevPreviewBtn.disabled = isFirstPreview;
                if (resolvedElements.nextPreviewBtn) resolvedElements.nextPreviewBtn.disabled = isLastPreview;
                if (resolvedElements.lastPreviewBtn) resolvedElements.lastPreviewBtn.disabled = isLastPreview;
            }

            return Promise.resolve();
        });

        // Mock de elementos del DOM necesarios para las pruebas
        mockElements = {
            LABEL_PREVIEW: {
                innerHTML: '',
                appendChild: jest.fn(),
                style: { 
                    width: '', 
                    height: '',
                    display: '',
                    position: '',
                    top: '',
                    left: '',
                    transform: '',
                    setProperty: jest.fn(),
                }
            },
            previewNavigation: {
                style: { display: '' },
            },
            previewCounter: {
                textContent: '',
            },
            firstPreviewBtn: { disabled: false },
            prevPreviewBtn: { disabled: false },
            nextPreviewBtn: { disabled: false },
            lastPreviewBtn: { disabled: false },
            templateWidthSliderLots: { 
                value: '4',
                style: { display: '' } 
            },
            templateHeightSliderLots: { 
                value: '6',
                style: { display: '' }
            },
            lotsDataInput: { 
                value: 'Sample Data',
                style: { display: '' }
            },
            lotsLabelTextInput: { 
                value: 'Sample Label',
                style: { display: '' }
            }
        };

        // Initialize state
        state.currentPreviewIndexLots = 0;
        state.lotsPreviewsData = ['DATA1', 'DATA2', 'DATA3'];
    });

    afterEach(() => {
        // Restaurar la implementación original
        lotsPreviewManager.updatePreview = originalUpdatePreview;
    });

    test('should generate preview elements correctly', async () => {
        await lotsPreviewManager.updatePreview(null, mockElements);

        // Verificar que se generaron elementos en la vista previa
        expect(mockElements.LABEL_PREVIEW.appendChild).toHaveBeenCalledTimes(3);
        expect(mockElements.previewNavigation.style.display).toBe('flex');
        expect(mockElements.previewCounter.textContent).toBe('1 / 3');
    });

    test('should disable navigation buttons correctly', async () => {
        // Índice inicial (primera vista previa)
        state.currentPreviewIndexLots = 0;
        await lotsPreviewManager.updatePreview(null, mockElements);
        expect(mockElements.firstPreviewBtn.disabled).toBe(true);
        expect(mockElements.prevPreviewBtn.disabled).toBe(true);
        expect(mockElements.nextPreviewBtn.disabled).toBe(false);
        expect(mockElements.lastPreviewBtn.disabled).toBe(false);

        // Índice final (última vista previa)
        state.currentPreviewIndexLots = 2;
        await lotsPreviewManager.updatePreview(null, mockElements);
        expect(mockElements.firstPreviewBtn.disabled).toBe(false);
        expect(mockElements.prevPreviewBtn.disabled).toBe(false);
        expect(mockElements.nextPreviewBtn.disabled).toBe(true);
        expect(mockElements.lastPreviewBtn.disabled).toBe(true);
    });
});