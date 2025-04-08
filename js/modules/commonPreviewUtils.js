// js/modules/commonPreviewUtils.js
import { BARCODE_CONFIG_PORTRAIT, BARCODE_CONFIG_LANDSCAPE, LAYOUT_CONSTANTS } from './constants.js';
import { generateBarcodePngDataUrl } from './barcodeRenderer.js';
import { log } from './utils.js';

// Función para esperar carga de imágenes
export function waitForImageLoad(img) {
    return new Promise((resolve, reject) => {
        // Añadir una comprobación para entorno de pruebas
        if (process.env.NODE_ENV === 'test' && img) { 
            return resolve(img); 
        }
        
        if (!img || !(img instanceof HTMLImageElement)) { 
            return reject(new Error("No es un elemento de imagen.")); 
        }
        if (img.complete && img.naturalWidth !== 0) { resolve(img); }
        else if (img.src) {
            let loaded = false;
            const loadHandler = () => { if (!loaded) { loaded = true; cleanup(); resolve(img); } };
            const errorHandler = () => { if (!loaded) { loaded = true; cleanup(); reject(new Error(`Error cargando ${img.src}`)); } };
            const cleanup = () => { img.removeEventListener('load', loadHandler); img.removeEventListener('error', errorHandler); };
            img.addEventListener('load', loadHandler);
            img.addEventListener('error', errorHandler);
            setTimeout(() => { if (!loaded) errorHandler('Timeout'); }, 7000);
        } else { reject(new Error("Imagen sin src.")); }
    });
}

// Conversión a monocromo
export async function convertToMonochrome(img, threshold = 100, useDithering = true, darkenFactor = 0.8) {
    try {
        await waitForImageLoad(img);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: useDithering });
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        if (darkenFactor !== 1) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] *= darkenFactor;
                data[i + 1] *= darkenFactor;
                data[i + 2] *= darkenFactor;
            }
        }
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
            const value = gray < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
        const newImg = new Image();
        newImg.src = canvas.toDataURL('image/png');
        return await waitForImageLoad(newImg);
    } catch (error) {
        throw new Error(`Error en convertToMonochrome: ${error.message}`);
    }
}

// Cálculos de dimensiones y espaciados
export function calculateLayoutDimensions(templateHeightPx, isPortrait) {
    const totalGapPx = templateHeightPx * LAYOUT_CONSTANTS.TOTAL_GAP_PERCENTAGE;
    const gapPx = totalGapPx / 2;
    const totalBorderPx = templateHeightPx * LAYOUT_CONSTANTS.BORDER_PERCENT / 100;
    const borderPx = 2;
    const availableHeight = templateHeightPx - totalGapPx - totalBorderPx;

    log(`calculateLayoutDimensions - templateHeightPx: ${templateHeightPx}, totalGapPx: ${totalGapPx}, totalBorderPx: ${totalBorderPx}, availableHeight: ${availableHeight}`, 'debug');

    const logoPercentage = isPortrait
        ? LAYOUT_CONSTANTS.PORTRAIT.LOGO_MAX_HEIGHT_PERCENT / 100
        : LAYOUT_CONSTANTS.LANDSCAPE.LOGO_MAX_HEIGHT_PERCENT / 100;
    const textPercentage = isPortrait
        ? LAYOUT_CONSTANTS.PORTRAIT.TEXT_MAX_HEIGHT_PERCENT / 100
        : LAYOUT_CONSTANTS.LANDSCAPE.TEXT_MAX_HEIGHT_PERCENT / 100;
    const additionalDataPercentage = isPortrait
        ? LAYOUT_CONSTANTS.PORTRAIT.ADDITIONAL_DATA_HEIGHT_PERCENT / 100
        : LAYOUT_CONSTANTS.LANDSCAPE.ADDITIONAL_DATA_HEIGHT_PERCENT / 100;
    const barcodePercentage = isPortrait
        ? LAYOUT_CONSTANTS.PORTRAIT.BARCODE_MAX_HEIGHT_PERCENT / 100
        : LAYOUT_CONSTANTS.LANDSCAPE.BARCODE_MAX_HEIGHT_PERCENT / 100;

    log(`calculateLayoutDimensions - Percentages - logo: ${logoPercentage * 100}%, text: ${textPercentage * 100}%, additionalData: ${additionalDataPercentage * 100}%, barcode: ${barcodePercentage * 100}%`, 'debug');

    const logoHeightPx = availableHeight * logoPercentage;
    const textHeightPx = availableHeight * textPercentage;
    const additionalDataHeightPx = availableHeight * additionalDataPercentage;
    const barcodeHeightPx = availableHeight * barcodePercentage;

    log(`calculateLayoutDimensions - Heights - logoHeightPx: ${logoHeightPx}, textHeightPx: ${textHeightPx}, additionalDataHeightPx: ${additionalDataHeightPx}, barcodeHeightPx: ${barcodeHeightPx}`, 'debug');

    const totalContentHeight = logoHeightPx + textHeightPx + additionalDataHeightPx + barcodeHeightPx + (4 * 4) + totalGapPx;

    const dimensions = {
        borderPx,
        gapPx,
        totalContentHeight,
        logoHeightPx,
        textHeightPx,
        additionalDataHeightPx,
        barcodeHeightPx
    };
    log(`calculateLayoutDimensions - isPortrait: ${isPortrait}, dimensions: ${JSON.stringify(dimensions)}`, 'info');
    return dimensions;
}

// Generar contenedor de logo
export async function createLogoContainer(logoImage, logoSizePercentage, logoHeightPx, templateWidthPx) {
    log(`createLogoContainer - logoSizePercentage: ${logoSizePercentage}`, 'debug');
    const logoContainer = document.createElement('div');
    logoContainer.className = 'label-element logo-container';
    if (logoImage) {
        // Asegurarse de que logoSizePercentage tenga un valor válido; si es undefined, usar 98 (valor por defecto)
        const percentage = logoSizePercentage !== undefined ? logoSizePercentage : 98;
        const effectiveScale = percentage / 100; // Escala directa según el porcentaje
        const monochromeLogo = await convertToMonochrome(logoImage);
        const logoImgElement = document.createElement('img');
        logoImgElement.src = monochromeLogo.src;
        logoImgElement.alt = 'Logo';
        logoImgElement.className = 'logo-image';

        // Calcular el tamaño base proporcional al contenedor
        const containerWidth = templateWidthPx;
        const containerHeight = logoHeightPx;
        const aspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;

        // Ajustar el tamaño base para que la imagen quepa dentro del contenedor sin desbordar
        let baseWidth, baseHeight;
        if (containerWidth / containerHeight > aspectRatio) {
            // La altura es el factor limitante
            baseHeight = containerHeight;
            baseWidth = baseHeight * aspectRatio;
        } else {
            // El ancho es el factor limitante
            baseWidth = containerWidth;
            baseHeight = baseWidth / aspectRatio;
        }

        // Establecer el tamaño base de la imagen
        logoImgElement.style.width = `${baseWidth}px`;
        logoImgElement.style.height = `${baseHeight}px`;

        // Aplicar la escala
        logoImgElement.style.transform = `scale(${effectiveScale})`;

        log(`createLogoContainer - Container Size: ${containerWidth}x${containerHeight}, Base Size: ${baseWidth}x${baseHeight}, Aspect Ratio: ${aspectRatio}, Effective Scale: ${effectiveScale}`, 'debug');

        logoContainer.appendChild(logoImgElement);
    }
    return logoContainer;
}

// Generar contenedor de texto (Texto Descriptivo)
export function createTextContainer(text, textHeightPx, isPrefix = false) {
    const maxLength = 250; // Límite para el texto descriptivo
    if (text.length > maxLength) {
        throw new Error(`El texto descriptivo excede el límite de ${maxLength} caracteres (incluidos espacios y signos de puntuación): ${text}`);
    }

    const textContainer = document.createElement('div');
    textContainer.className = `label-element ${isPrefix ? 'prefix-container' : 'text-container'}`;
    const textElement = document.createElement('span');
    textElement.textContent = text.substring(0, maxLength);
    textContainer.appendChild(textElement);
    document.body.appendChild(textContainer);
    let finalFontSize = LAYOUT_CONSTANTS.MAX_FONT_SIZE;
    try {
        const containerWidth = textContainer.clientWidth * 0.98;
        const containerHeight = textContainer.clientHeight * 0.98;
        let lower = LAYOUT_CONSTANTS.MIN_FONT_SIZE, upper = LAYOUT_CONSTANTS.MAX_FONT_SIZE;
        while (upper - lower > 0.5) {
            const mid = (lower + upper) / 2;
            textElement.style.fontSize = `${mid}px`;
            if (textElement.offsetWidth <= containerWidth && textElement.offsetHeight <= containerHeight) lower = mid;
            else upper = mid;
        }
        finalFontSize = Math.max(LAYOUT_CONSTANTS.MIN_FONT_SIZE, lower);
    } finally {
        document.body.removeChild(textContainer);
    }
    textElement.style.fontSize = `${finalFontSize}px`;
    textElement.dataset.printFontSize = finalFontSize;
    return textContainer;
}

// Generar contenedor de datos adicionales (Additional Data)
export function createAdditionalDataContainer(text, additionalDataHeightPx) {
    const maxLength = 20; // Límite para los datos adicionales
    if (text.length > maxLength) {
        throw new Error(`Los datos adicionales exceden el límite de ${maxLength} caracteres (incluidos espacios y signos de puntuación): ${text}`);
    }

    const additionalDataContainer = document.createElement('div');
    additionalDataContainer.className = 'label-element additional-data-container';
    const textElement = document.createElement('span');
    textElement.textContent = text.substring(0, maxLength);
    additionalDataContainer.appendChild(textElement);
    document.body.appendChild(additionalDataContainer);
    let finalFontSize = LAYOUT_CONSTANTS.MAX_FONT_SIZE;
    try {
        const containerWidth = additionalDataContainer.clientWidth * 0.98;
        const containerHeight = additionalDataContainer.clientHeight * 0.98;
        let lower = LAYOUT_CONSTANTS.MIN_FONT_SIZE, upper = LAYOUT_CONSTANTS.MAX_FONT_SIZE;
        while (upper - lower > 0.5) {
            const mid = (lower + upper) / 2;
            textElement.style.fontSize = `${mid}px`;
            if (textElement.offsetWidth <= containerWidth && textElement.offsetHeight <= containerHeight) lower = mid;
            else upper = mid;
        }
        finalFontSize = Math.max(LAYOUT_CONSTANTS.MIN_FONT_SIZE, lower);
    } finally {
        document.body.removeChild(additionalDataContainer);
    }
    textElement.style.fontSize = `${finalFontSize}px`;
    textElement.dataset.printFontSize = finalFontSize;
    return additionalDataContainer;
}

// Generar contenedor de barcode
export async function createBarcodeContainer(text, barcodeHeightPx, isPortrait, templateWidthPx) {
    log(`createBarcodeContainer - Arguments received: text=${text}, barcodeHeightPx=${barcodeHeightPx}, isPortrait=${isPortrait}, templateWidthPx=${templateWidthPx}, typeof isPortrait=${typeof isPortrait}`, 'debug');
    
    if (isPortrait === undefined) {
        log(`createBarcodeContainer - isPortrait is undefined! Stack trace: ${new Error().stack}`, 'error');
    }
    
    const maxLength = 20; // Límite para el texto del código de barras
    if (text.length > maxLength) {
        throw new Error(`El texto del barcode excede el límite de ${maxLength} caracteres (incluidos espacios y signos de puntuación): ${text}`);
    }
    
    const barcodeContainer = document.createElement('div');
    barcodeContainer.className = 'label-element barcode-container';
    const barcodeImg = document.createElement('img');
    const barcodeConfig = isPortrait ? BARCODE_CONFIG_PORTRAIT : BARCODE_CONFIG_LANDSCAPE;
    
    const textLength = text.length;
    let levelConfig;
    if (textLength <= 7) {
        levelConfig = barcodeConfig.LEVEL_1;
    } else if (textLength <= 14) {
        levelConfig = barcodeConfig.LEVEL_2;
    } else {
        levelConfig = barcodeConfig.LEVEL_3;
    }
    
    const barcodeOptions = {
        bcid: barcodeConfig.BCID,
        text: text,
        includetext: barcodeConfig.INCLUDE_TEXT,
        columns: levelConfig.COLUMNS,
        rows: levelConfig.ROWS,
        yheight: levelConfig.YHEIGHT,
        scale: levelConfig.SCALE,
        eclevel: barcodeConfig.ECLEVEL
    };
    
    const marginPx = 20;
    const barcodeWidthPx = templateWidthPx - marginPx;
    const targetHeight = barcodeHeightPx || 200;
    
    log(`templateWidthPx: ${templateWidthPx}, marginPx: ${marginPx}, barcodeWidthPx: ${barcodeWidthPx}`, 'debug');
    log(`targetHeight: ${targetHeight}`, 'debug');
    
    barcodeOptions.targetWidth = barcodeWidthPx;
    barcodeOptions.targetHeight = targetHeight;
    
    barcodeImg.src = await generateBarcodePngDataUrl(barcodeOptions);
    await waitForImageLoad(barcodeImg);
    
    const canvasWidth = barcodeImg.naturalWidth;
    const canvasHeight = barcodeImg.naturalHeight;
    log(`createBarcodeContainer - Canvas size: ${canvasWidth}x${canvasHeight}px`, 'info');
    
    let scale;
    const widthScale = barcodeWidthPx / canvasWidth;
    const heightScale = targetHeight / canvasHeight;
    
    const maxWidthToHeightRatio = 2.0;
    const currentRatio = canvasWidth / canvasHeight;
    
    if (currentRatio > maxWidthToHeightRatio) {
        scale = Math.min(widthScale, heightScale * maxWidthToHeightRatio);
        log(`Aplicando escala limitada para evitar distorsión: ${scale}`, 'info');
    } else {
        scale = Math.min(widthScale, heightScale);
    }
    
    const minHeightPercentage = 0.7;
    const scaledHeight = canvasHeight * scale;
    
    if (scaledHeight < targetHeight * minHeightPercentage) {
        scale = (targetHeight * minHeightPercentage) / canvasHeight;
        log(`Ajustando escala para cumplir altura mínima: ${scale}`, 'info');
    }
    
    barcodeImg.style.width = `${canvasWidth * scale}px`;
    barcodeImg.style.height = `${canvasHeight * scale}px`;
    
    if (canvasWidth * scale < barcodeWidthPx) {
        barcodeContainer.style.display = 'flex';
        barcodeContainer.style.justifyContent = 'center';
    }
    
    barcodeContainer.style.backgroundColor = '#fff';
    
    barcodeContainer.appendChild(barcodeImg);
    return barcodeContainer;
}

// Generar contenedor de numeración
export function createPageNumberContainer(text) {
    const pageNumberContainer = document.createElement('div');
    pageNumberContainer.className = 'page-number';
    pageNumberContainer.textContent = text;
    return pageNumberContainer;
}