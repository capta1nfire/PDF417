// js/modules/elements.js
const elementsPromise = new Promise((resolve) => {
    const elements = {
        lotsTabBtn: document.getElementById('lots-tab-btn'),
        shippingTabBtn: document.getElementById('shipping-tab-btn'),
        lotsTabContent: document.getElementById('lots-tab'),
        shippingTabContent: document.getElementById('shipping-tab'),
        lotsDataInput: document.getElementById('lots-data'),
        lotsAdditionalData: document.getElementById('lots-additional-data'),
        shippingDataInput: document.getElementById('shipping-data'),
        lotsLabelTextInput: document.getElementById('lots-label-text'),
        lotsLabelTextCounter: document.getElementById('lots-label-text-counter'),
        // Nuevas referencias para los contadores
        lotsDataCounter: document.getElementById('lots-data-counter'),
        lotsAdditionalDataCounter: document.getElementById('lots-additional-data-counter'),
        shippingDataCounter: document.getElementById('shipping-data-counter'),
        shippingLabelTextCounter: document.getElementById('shipping-label-text-counter'),
        shippingLabelTextInput: document.getElementById('shipping-label-text'),
        templateWidthSliderLots: document.getElementById('template-width-lots'),
        templateHeightSliderLots: document.getElementById('template-height-lots'),
        templateWidthSliderShipping: document.getElementById('template-width-shipping'),
        templateHeightSliderShipping: document.getElementById('template-height-shipping'),
        templateWidthUnitLots: document.getElementById('template-width-unit-lots'),
        templateHeightUnitLots: document.getElementById('template-height-unit-lots'),
        templateWidthUnitShipping: document.getElementById('template-width-unit-shipping'),
        templateHeightUnitShipping: document.getElementById('template-height-unit-shipping'),
        barcodeScaleSliderLots: document.getElementById('barcode-size-lots'),
        barcodeScaleSliderShipping: document.getElementById('barcode-size-shipping'),
        barcodeScaleValueLots: document.getElementById('barcode-size-value-lots'),
        barcodeScaleValueShipping: document.getElementById('barcode-size-value-shipping'),
        logoSizeSliderLots: document.getElementById('logo-size-lots'),
        logoSizeSliderShipping: document.getElementById('logo-size-shipping'),
        logoSizeValueLots: document.getElementById('logo-size-value-lots'),
        logoSizeValueShipping: document.getElementById('logo-size-value-shipping'),
        uploadLogoBtnLots: document.getElementById('upload-logo-btn-lots'),
        uploadLogoBtnShipping: document.getElementById('upload-logo-btn-shipping'),
        logoUploadLots: document.getElementById('logo-upload-lots'),
        logoUploadShipping: document.getElementById('logo-upload-shipping'),
        defaultLogoLots: document.getElementById('default-logo-lots'),
        defaultLogoShipping: document.getElementById('default-logo-shipping'),
        orientationBtnLots: document.getElementById('toggle-orientation-btn-lots'),
        orientationBtnShipping: document.getElementById('toggle-orientation-btn-shipping'),
        unitSelectorLots: document.getElementById('unit-selector-lots'),
        unitSelectorShipping: document.getElementById('unit-selector-shipping'),
        dpiSelectorLots: document.getElementById('dpi-selector-lots'),
        dpiSelectorShipping: document.getElementById('dpi-selector-shipping'),
        dpiLots: document.getElementById('dpi-lots'),
        dpiShipping: document.getElementById('dpi-shipping'),
        showPageNumberLotsCheckbox: document.getElementById('show-page-number-lots'),
        showPageNumberShippingCheckbox: document.getElementById('show-page-number-shipping'),
        shippingPrefix1Input: document.getElementById('shipping-prefix1'),
        shippingPrefix2Input: document.getElementById('shipping-prefix2'),
        shippingContainerNumberInput: document.getElementById('shipping-container-number'),
        shippingPrefix3Input: document.getElementById('shipping-prefix3'),
        shippingTransloadNumberInput: document.getElementById('shipping-transload-number'),
        shippingCounterInput: document.getElementById('shipping-counter'),
        workspace: document.querySelector('.workspace'),
        previewContainer: document.getElementById('preview-container'),
        LABEL_PREVIEW: document.getElementById('label-preview'),
        emptyBarcodeMsg: document.getElementById('empty-barcode-msg'),
        previewNavigation: document.getElementById('preview-navigation'),
        previewCounter: document.getElementById('preview-counter'),
        firstPreviewBtn: document.getElementById('first-preview'),
        prevPreviewBtn: document.getElementById('prev-preview'),
        nextPreviewBtn: document.getElementById('next-preview'),
        lastPreviewBtn: document.getElementById('last-preview'),
        printBtn: document.getElementById('print-btn'),
        downloadPdfBtn: document.getElementById('download-pdf-btn'),
        generateBatchBtn: document.getElementById('generate-batch-btn'),
        toastMessage: document.getElementById('toast-message')
    };

    const checkElements = () => {
        const allElementsLoaded = Object.values(elements).every(el => el !== null && el !== undefined);
        if (allElementsLoaded) {
            resolve(elements);
        } else {
            setTimeout(checkElements, 100);
        }
    };
    checkElements();
});

export { elementsPromise as elements };