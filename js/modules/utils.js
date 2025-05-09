// js/modules/utils.js
export function log(message, type = 'info') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    switch (type) {
        case 'warn':
            console.warn(`[${timestamp}] [WARN] ${message}`);
            break;
        case 'error':
            console.error(`[${timestamp}] [ERROR] ${message}`);
            break;
        default:
            console.log(`[${timestamp}] [DEBUG] ${message}`);
    }
}

// Mejorar la función showToast para que busque el elemento si no se proporciona

export function showToast(toastElement, message) {
    // Si no se proporciona el elemento, intentar obtenerlo del DOM
    if (!toastElement) {
        toastElement = document.getElementById('toast-message');
        if (!toastElement) {
            log(`Toast element no válido, mensaje no mostrado: ${message}`, 'warn');
            return;
        }
    }
    
    toastElement.textContent = message;
    toastElement.classList.add('show');
    
    // Eliminar clase show después de 3 segundos
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

export function convertToPixels(value, unit, conversion) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    switch (unit) {
        case 'in':
            return numValue * conversion.PIXELS_PER_INCH;
        case 'cm':
            return numValue * conversion.PIXELS_PER_CM;
        case 'px':
            return numValue;
        default:
            return numValue; // Fallback a px si la unidad es desconocida
    }
}

export function convertFromMm(value, unit, conversion) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    switch (unit) {
        case 'in':
            return numValue / conversion.MM_PER_INCH;
        case 'cm':
            return numValue / conversion.MM_PER_CM;
        case 'px':
            return numValue * (conversion.PIXELS_PER_INCH / conversion.MM_PER_INCH);
        default:
            return numValue; // Fallback a px si la unidad es desconocida
    }
}

export function swapDimensions(isBatchTab, elements, state) {
    const widthSlider = isBatchTab ? elements.templateWidthSliderBatch : elements.templateWidthSliderLots;
    const heightSlider = isBatchTab ? elements.templateHeightSliderBatch : elements.templateHeightSliderLots;
    const widthValue = isBatchTab ? elements.templateWidthValueBatch : elements.templateWidthValueLots;
    const heightValue = isBatchTab ? elements.templateHeightValueBatch : elements.templateHeightValueLots;
    const tempWidth = widthSlider.value;
    widthSlider.value = heightSlider.value;
    heightSlider.value = tempWidth;
    const unit = isBatchTab ? state.currentUnitBatch : state.currentUnitLots;
    widthValue.textContent = `${widthSlider.value} ${unit}`;
    heightValue.textContent = `${heightSlider.value} ${unit}`;
}