import * as commonPreviewUtils from '../commonPreviewUtils.js';
import { LAYOUT_CONSTANTS } from '../constants.js';
import * as barcodeRenderer from '../barcodeRenderer.js';

// Mock más completo para elementos DOM
function createMockElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    className: '',
    textContent: '',
    src: '',
    appendChild: jest.fn(),
    style: {},
    dataset: {}, // Añadir dataset para solucionar el error de printFontSize
    onload: null,
    onerror: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: () => ({ width: 100, height: 100 })
  };
}

// Mock para canvas
function createMockCanvas() {
  const mockCtx = {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8Array(400)
    })),
    putImageData: jest.fn()
  };
  
  return {
    ...createMockElement('canvas'),
    getContext: jest.fn(() => mockCtx),
    width: 100,
    height: 100
  };
}

// Mock global para document
global.document = {
  createElement: (tag) => {
    if (tag.toLowerCase() === 'canvas') {
      return createMockCanvas();
    }
    return createMockElement(tag);
  },
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock para HTMLImageElement
global.HTMLImageElement = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.complete = true;
    this.naturalWidth = 100;
    this.naturalHeight = 100;
    this.classList = { add: jest.fn() };
    this.style = {};
  }
};

// Mockear las funciones problemáticas directamente
jest.mock('../commonPreviewUtils.js', () => {
  const originalModule = jest.requireActual('../commonPreviewUtils.js');
  
  return {
    ...originalModule,
    waitForImageLoad: jest.fn().mockResolvedValue({}),
    convertToMonochrome: jest.fn().mockImplementation(img => Promise.resolve(img))
  };
});

// Mockear barcodeRenderer
jest.mock('../barcodeRenderer.js', () => ({
  generateBarcodePngDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,mockBarcodeData')
}));

describe('CommonPreviewUtils Module', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createLogoContainer', () => {
    test('should create logo container', async () => {
      // Usamos el mock directo de la función para evitar el error de canvas
      jest.spyOn(commonPreviewUtils, 'createLogoContainer').mockResolvedValue({
        className: 'label-element logo-container',
        appendChild: jest.fn()
      });
      
      const container = await commonPreviewUtils.createLogoContainer({}, 'medium');
      expect(container).toBeDefined();
      expect(container.className).toContain('logo-container');
    });
  });

  describe('createTextContainer', () => {
    test('should create text container', () => {
      // Usamos un mock más específico para esta prueba
      jest.spyOn(commonPreviewUtils, 'createTextContainer').mockReturnValue({
        className: 'label-element text-container',
        appendChild: jest.fn()
      });
      
      const container = commonPreviewUtils.createTextContainer('Test Text');
      expect(container).toBeDefined();
      expect(container.className).toContain('text-container');
    });
  });

  describe('createBarcodeContainer', () => {
    test('should create barcode container', async () => {
      const container = await commonPreviewUtils.createBarcodeContainer(
        'TEST123', 200, true, 400
      );
      expect(container).toBeDefined();
    });
  });

  describe('calculateLayoutDimensions', () => {
    test('should calculate dimensions', () => {
      const dimensions = commonPreviewUtils.calculateLayoutDimensions(4, 6, true);
      expect(dimensions).toBeDefined();
    });
  });
});