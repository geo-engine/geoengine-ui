import {BBoxDict} from '../backend/backend.model';
import {utc} from 'moment';

export function extentToBboxDict([minx, miny, maxx, maxy]: [number, number, number, number]): BBoxDict {
    return {
        lower_left_coordinate: {
            x: minx,
            y: miny,
        },
        upper_right_coordinate: {
            x: maxx,
            y: maxy,
        }
    };
}

export function bboxDictToExtent(extent: BBoxDict): [number, number, number, number] {
    const minx = extent.lower_left_coordinate.x;
    const miny = extent.lower_left_coordinate.y;
    const maxx = extent.upper_right_coordinate.x;
    const maxy = extent.upper_right_coordinate.y;

    return [minx, miny, maxx, maxy];
}

/**
 * Convert a unix timestamp in ms to an ISO timestamp string.
 */
export function unixTimestampToIsoString(unixTimestamp: number): string {
    return utc(unixTimestamp).toISOString();
}
