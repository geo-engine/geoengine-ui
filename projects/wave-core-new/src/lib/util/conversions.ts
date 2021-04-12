import {BBoxDict} from '../backend/backend.model';
import {utc} from 'moment';
import {Feature as OlFeature} from 'ol';
import OlFormatGeoJson from 'ol/format/GeoJSON';

export const extentToBboxDict = ([minx, miny, maxx, maxy]: [number, number, number, number]): BBoxDict => ({
    lower_left_coordinate: {
        x: minx,
        y: miny,
    },
    upper_right_coordinate: {
        x: maxx,
        y: maxy,
    },
});

export const bboxDictToExtent = (extent: BBoxDict): [number, number, number, number] => {
    const minx = extent.lower_left_coordinate.x;
    const miny = extent.lower_left_coordinate.y;
    const maxx = extent.upper_right_coordinate.x;
    const maxy = extent.upper_right_coordinate.y;

    return [minx, miny, maxx, maxy];
};

/**
 * Convert a unix timestamp in ms to an ISO timestamp string.
 */
export const unixTimestampToIsoString = (unixTimestamp: number): string => utc(unixTimestamp).toISOString();

export function hashCode(str: string): number {
    // java String#hashCode
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line no-bitwise
    }
    return hash;
}

// TODO: use a faster hash function
export function featureToHash(feature: OlFeature): number {
    const sortObjKeys = (obj: {[_: string]: any}): any => {
        Object.keys(obj)
            .sort()
            .reduce((x, key) => {
                x[key] = obj[key];
                return x;
            }, {} as {[_: string]: any});
    };

    const jsonObj: {[_: string]: any} = new OlFormatGeoJson().writeFeatureObject(feature);
    if (jsonObj['properties']) {
        jsonObj['properties'] = sortObjKeys(jsonObj['properties']);
    }
    const json = JSON.stringify(jsonObj);

    return hashCode(json);
}
