// js/modules/state.js
export const state = {
    // Estado general
    currentUnitLots: 'in',
    currentUnitShipping: 'in',
    dpiLots: 203,
    dpiShipping: 203,
    logoImageLots: null,
    logoImageShipping: null,
    defaultLogoLotsSrc: 'img/logo-columbia-shipping.png',
    defaultLogoShippingSrc: 'img/logo-columbia-shipping.png',
    bwipjsLoaded: false,
    isPortraitLots: true,
    isPortraitShipping: true,
    defaultDimensions: {
        in: { width: 4, height: 6 },
        cm: { width: 10.16, height: 15.24 },
        px: { width: 384, height: 576 }
    },
    labelMargin: 2,
    templateWidthPxLots: 384,
    templateHeightPxLots: 576,
    templateWidthPxShipping: 384,
    templateHeightPxShipping: 576,
    logoSizeLots: 98, // Valor inicial para el tamaño del logo en "Lotes" (98%)
    logoSizeShipping: 98, // Valor inicial para el tamaño del logo en "Shipping" (98%)

    // Estado para Lotes
    lotsPreviewsData: [],
    lotsAdditionalData: [],
    currentPreviewIndexLots: 0,
    showPageNumberLots: true,

    // Estado para Shipping
    shippingPreviewsData: [],
    currentPreviewIndexShipping: 0,
    shippingPrefix1: 'LAXWH',
    shippingPrefix2: 'CONTAINER',
    shippingPrefix3: 'TRANSLOAD',
    shippingContainerNumber: '',
    shippingTransloadNumber: '',
    shippingCounter: '',
    showPageNumberShipping: true
};

export const CONVERSION = {
    PIXELS_PER_INCH: 96,
    PIXELS_PER_CM: 37.8,
    MM_PER_INCH: 25.4,
    MM_PER_CM: 10
};

export const MAX_PAGES = 1000;