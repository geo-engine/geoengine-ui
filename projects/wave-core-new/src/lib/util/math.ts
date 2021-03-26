/**
 * Clamp a `value` between `min` and `max`.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export const clamp = (value: number, min: number, max: number): number => {
    if (value <= min) {
        return min;
    } else if (value >= max) {
        return max;
    } else {
        return value;
    }
};
