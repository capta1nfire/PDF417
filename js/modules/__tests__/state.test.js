import { state, CONVERSION, MAX_PAGES } from '../state.js';

describe('State Module', () => {
    test('state should have correct initial properties', () => {
        expect(state).toHaveProperty('currentUnitLots', 'in');
        expect(state).toHaveProperty('currentUnitShipping', 'in');
        expect(state).toHaveProperty('dpiLots', 203);
        expect(state).toHaveProperty('dpiShipping', 203);
        expect(state).toHaveProperty('logoImageLots', null);
        expect(state).toHaveProperty('logoImageShipping', null);
        expect(state).toHaveProperty('isPortraitLots', true);
        expect(state).toHaveProperty('isPortraitShipping', true);
        expect(state).toHaveProperty('lotsPreviewsData', []);
        expect(state).toHaveProperty('shippingPreviewsData', []);
        expect(state).toHaveProperty('labelMargin', 2);
    });

    test('CONVERSION should have correct values', () => {
        expect(CONVERSION).toEqual({
            PIXELS_PER_INCH: 96,
            PIXELS_PER_CM: 37.8,
            MM_PER_INCH: 25.4,
            MM_PER_CM: 10,
        });
    });

    test('MAX_PAGES should be 1000', () => {
        expect(MAX_PAGES).toBe(1000);
    });
});