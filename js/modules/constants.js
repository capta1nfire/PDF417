// js/modules/constants.js
import { state } from './state.js';

// Constantes Generales (aplican a ambas orientaciones)
const GENERAL_CONSTANTS = {
    // Configuración general del código de barras
    BCID: 'pdf417', // Tipo de código de barras
    INCLUDE_TEXT: false, // No incluir texto debajo del código
    ECLEVEL: 5, // Nivel de corrección de errores (5 para mejor legibilidad)

    // Dimensiones y proporciones generales
    CHILD_WIDTH_PERCENT: 100, // Ancho de los elementos hijos
    BORDER_PERCENT: 1, // Porcentaje del borde
    TOTAL_GAP_PERCENTAGE: 0.05, // Porcentaje de espacio entre elementos
    MIN_FONT_SIZE: 16.5, // Tamaño mínimo de fuente
    MAX_FONT_SIZE: 100, // Tamaño máximo de fuente
    MAX_SCALE_FACTOR: 1.0, // Factor máximo de escala
    DEFAULT_WIDTH: 4, // Ancho por defecto (pulgadas)
    DEFAULT_HEIGHT: 6 // Alto por defecto (pulgadas)
};

// Constantes de Diseño (porcentajes de altura para cada elemento)
export const LAYOUT_CONSTANTS = {
    // Portrait (Vertical)
    PORTRAIT: {
        LOGO_MAX_HEIGHT_PERCENT: 12, // Restaurado de 18 a 20
        TEXT_MAX_HEIGHT_PERCENT: 30, // Restaurado de 22 a 20
        ADDITIONAL_DATA_HEIGHT_PERCENT: 8, // Restaurado de 14 a 20
        BARCODE_MAX_HEIGHT_PERCENT: 45 // Restaurado de 45 a 35
    },
    // Landscape (Horizontal)
    LANDSCAPE: {
        LOGO_MAX_HEIGHT_PERCENT: 14, // Restaurado de 10 a 20
        TEXT_MAX_HEIGHT_PERCENT: 32, // Restaurado de 22 a 20
        ADDITIONAL_DATA_HEIGHT_PERCENT: 10, // Restaurado de 14 a 20
        BARCODE_MAX_HEIGHT_PERCENT: 35 // Ya estaba correcto
    },
    // Constantes generales (no dependen de la orientación)
    ...GENERAL_CONSTANTS
};

// Función para calcular la escala basada en DPI
const calculateScale = (dpi) => dpi / 72;

// Configuración del Código de Barras para Portrait (Vertical)
export const BARCODE_CONFIG_PORTRAIT = {
    BCID: GENERAL_CONSTANTS.BCID,
    INCLUDE_TEXT: GENERAL_CONSTANTS.INCLUDE_TEXT,
    ECLEVEL: GENERAL_CONSTANTS.ECLEVEL,
    get LEVEL_1() {
        const dpi = state.dpiLots;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 3, // Para textos muy cortos (≤ 3 caracteres)
            ROWS: 6, // Menos filas para menos densidad
            YHEIGHT: 6, // Altura del módulo en puntos (para legibilidad del escáner)
            SCALE: baseScale * 1.1 // Ajustar escala para ancho objetivo
        };
    },
    get LEVEL_2() {
        const dpi = state.dpiLots;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 3, // Para textos cortos (4-7 caracteres)
            ROWS: 6,
            YHEIGHT: 6,
            SCALE: baseScale * 1.1
        };
    },
    get LEVEL_3() {
        const dpi = state.dpiLots;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 3, // Para textos medianos a largos (> 7 caracteres)
            ROWS: 6,
            YHEIGHT: 6,
            SCALE: baseScale * 1.1
        };
    }
};

// Configuración del Código de Barras para Landscape (Horizontal)
export const BARCODE_CONFIG_LANDSCAPE = {
    BCID: GENERAL_CONSTANTS.BCID,
    INCLUDE_TEXT: GENERAL_CONSTANTS.INCLUDE_TEXT,
    ECLEVEL: GENERAL_CONSTANTS.ECLEVEL,
    get LEVEL_1() {
        const dpi = state.dpiShipping;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 6, // Para textos muy cortos (≤ 3 caracteres)
            ROWS: 5, // Menos filas para menos densidad
            YHEIGHT: 5,
            SCALE: baseScale * 1.1 // Ajustar escala para landscape
        };
    },
    get LEVEL_2() {
        const dpi = state.dpiShipping;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 6, // Para textos cortos (4-7 caracteres)
            ROWS: 6,
            YHEIGHT: 4,
            SCALE: baseScale * 1.1
        };
    },
    get LEVEL_3() {
        const dpi = state.dpiShipping;
        const baseScale = calculateScale(dpi);
        return { 
            COLUMNS: 6, // Para textos medianos a largos (> 7 caracteres)
            ROWS: 6,
            YHEIGHT: 4,
            SCALE: baseScale * 1.1
        };
    }
};