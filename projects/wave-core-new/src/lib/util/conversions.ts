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

// TODO: use a faster hash function
export const featureToHash = (feature: OlFeature): number => {
    const hashFn = function (str: string): number {
        let hash = 0;
        let i;
        let chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            // eslint-disable-next-line no-bitwise
            hash = (hash << 5) - hash + chr;
            // eslint-disable-next-line no-bitwise
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    const sortObjKeys = (obj: any): any => {
        Object.keys(obj)
            .sort()
            .reduce((x, key) => {
                x[key] = obj[key];
                return x;
            }, {});
    };

    const jsonObj = new OlFormatGeoJson().writeFeatureObject(feature);
    if ('properties' in jsonObj) {
        jsonObj['properties'] = sortObjKeys(jsonObj['properties']);
    }
    const json = JSON.stringify(jsonObj);
    return hashFn(json);
};
