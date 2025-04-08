import { log, convertToPixels, convertFromMm, swapDimensions } from '../utils.js';

describe('Utils Module', () => {
    // Mock para console.log, console.warn y console.error
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('log() should log messages with correct type and timestamp', () => {
        const message = 'Test message';
        log(message, 'info');
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Test message'));

        log(message, 'warn');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] Test message'));

        log(message, 'error');
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Test message'));
    });

    test('convertToPixels() should convert values correctly', () => {
        const conversion = { PIXELS_PER_INCH: 96, PIXELS_PER_CM: 37.8 };
        expect(convertToPixels(1, 'in', conversion)).toBe(96);
        expect(convertToPixels(1, 'cm', conversion)).toBe(37.8);
        expect(convertToPixels(1, 'px', conversion)).toBe(1);
        expect(convertToPixels('invalid', 'in', conversion)).toBe(0);
    });

    test('convertFromMm() should convert values correctly', () => {
        const conversion = { MM_PER_INCH: 25.4, MM_PER_CM: 10, PIXELS_PER_INCH: 96 };
        expect(convertFromMm(25.4, 'in', conversion)).toBe(1);
        expect(convertFromMm(10, 'cm', conversion)).toBe(1);
        expect(convertFromMm(25.4, 'px', conversion)).toBe(96);
        expect(convertFromMm('invalid', 'in', conversion)).toBe(0);
    });

    test('swapDimensions() should swap width and height values', () => {
        const elements = {
            templateWidthSliderLots: { value: '4' },
            templateHeightSliderLots: { value: '6' },
            templateWidthValueLots: { textContent: '' },
            templateHeightValueLots: { textContent: '' }
        };
        const state = { currentUnitLots: 'in' };

        swapDimensions(false, elements, state);

        expect(elements.templateWidthSliderLots.value).toBe('6');
        expect(elements.templateHeightSliderLots.value).toBe('4');
        expect(elements.templateWidthValueLots.textContent).toBe('6 in');
        expect(elements.templateHeightValueLots.textContent).toBe('4 in');
    });
});