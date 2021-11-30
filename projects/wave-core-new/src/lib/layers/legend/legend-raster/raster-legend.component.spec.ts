import {calculateNumberPipeParameters} from './raster-legend.component';
import {ColorBreakpoint} from 'wave-core';
import {BLACK} from '../../../colors/color';

describe('RasterLegend', () => {
    it('calculateNumberPipeParameters', () => {
        const breakpoints1: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0, BLACK),
            new ColorBreakpoint(1, BLACK),
            new ColorBreakpoint(2, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints1)).toBe('1.0-0');

        const breakpoints2: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0, BLACK),
            new ColorBreakpoint(0.75, BLACK),
            new ColorBreakpoint(1, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints2)).toBe('1.0-1');

        const breakpoints3: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0, BLACK),
            new ColorBreakpoint(0.05, BLACK),
            new ColorBreakpoint(0.1, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints3)).toBe('1.0-2');

        const breakpoints4: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0.123, BLACK),
            new ColorBreakpoint(1, BLACK),
            new ColorBreakpoint(2, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints4)).toBe('1.0-3');

        const breakpoints5: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0, BLACK),
            new ColorBreakpoint(1, BLACK),
            new ColorBreakpoint(2.123, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints5)).toBe('1.0-3');

        const breakpoints6: Array<ColorBreakpoint> = [
            new ColorBreakpoint(0, BLACK),
            new ColorBreakpoint(2, BLACK),
            new ColorBreakpoint(5, BLACK),
        ];
        expect(calculateNumberPipeParameters(breakpoints6)).toBe('1.0-0');
    });
});
