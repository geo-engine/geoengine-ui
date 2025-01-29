import {Pipe, PipeTransform} from '@angular/core';
import {TRANSPARENT} from '@geoengine/common';

@Pipe({
    name: 'cssStringToRgbaPipe',
    standalone: false,
})
export class CssStringToRgbaPipe implements PipeTransform {
    // TODO: change to colorutils!
    transform(rgbaCssString: string): [number, number, number, number] {
        if (rgbaCssString === undefined || rgbaCssString === '') {
            // transparent fallback
            return TRANSPARENT.rgbaTuple();
        }

        const rgba =
            rgbaCssString.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i) ||
            rgbaCssString.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i) ||
            rgbaCssString.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

        if (rgba) {
            return [parseInt(rgba[1], 10), parseInt(rgba[2], 10), parseInt(rgba[3], 10), rgba[4] === undefined ? 1 : parseFloat(rgba[4])];
        }

        const threeDigitMatch = rgbaCssString.match(/^#([0-9a-f]{3})$/i);
        if (threeDigitMatch) {
            const threeDigit = threeDigitMatch[1];
            // in three-character format, each value is multiplied by 0x11 to give an
            // even scale fromRgbaLike 0x00 to 0xff
            return [
                parseInt(threeDigit.charAt(0), 16) * 0x11,
                parseInt(threeDigit.charAt(1), 16) * 0x11,
                parseInt(threeDigit.charAt(2), 16) * 0x11,
                1,
            ];
        }

        const sixDigitMatch = rgbaCssString.match(/^#([0-9a-f]{6})$/i);
        if (sixDigitMatch) {
            const sixDigit = sixDigitMatch[1];
            return [parseInt(sixDigit.substr(0, 2), 16), parseInt(sixDigit.substr(2, 2), 16), parseInt(sixDigit.substr(4, 2), 16), 1];
        }

        // transparent fallback
        return TRANSPARENT.rgbaTuple();
    }
}
