import {Injectable} from '@angular/core';
import {CommonConfigStructure, CommonConfig, Delays as CommonDelays, mergeDeepOverrideLists} from '@geoengine/common';

interface Wms {
    readonly VERSION: string;
    readonly FORMAT: string;
}

interface Wfs {
    readonly VERSION: string;
    readonly FORMAT: string;
}

interface Wcs {
    readonly SERVICE: string;
    readonly VERSION: string;
}

interface User {
    readonly GUEST: {
        readonly NAME: string;
        readonly PASSWORD: string;
    };
}

interface Delays extends CommonDelays {
    readonly LOADING: {
        readonly MIN: number;
    };
    readonly TOOLTIP: number;
    readonly DEBOUNCE: number;
    readonly STORAGE_DEBOUNCE: number;
    readonly GUEST_LOGIN_HINT: number;
}

export interface ConfigDefaults {
    readonly PROJECT: {
        readonly NAME: string;
        readonly TIME:
            | string
            | {
                  start: string;
                  end?: string;
              };
        readonly TIMESTEP: '15 minutes' | '1 hour' | '1 day' | '1 month' | '6 months' | '1 year';
        readonly PROJECTION: 'EPSG:3857' | 'EPSG:4326';
    };
    /**
     * The default extent to focus on in EPSG:4326.
     */
    readonly FOCUS_EXTENT: [number, number, number, number];
}

export interface ConfigMap {
    readonly BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted' | 'XYZ' | 'eumetview' | 'MVT' | 'fallback';
    readonly BACKGROUND_LAYER_URL: string;
    readonly HOSTED_BACKGROUND_SERVICE: string;
    readonly HOSTED_BACKGROUND_LAYER_NAME: string;
    readonly HOSTED_BACKGROUND_SERVICE_VERSION: string;
    readonly VECTOR_TILES: VectorTiles;
    readonly REFRESH_LAYERS_ON_CHANGE: boolean;
    readonly VALID_CRS: Array<string>;
}

export interface VectorTiles {
    readonly STYLE_URL: string;
    readonly SOURCE: string;
    readonly BACKGROUND_LAYER_EXTENTS: {[epsg: string]: [number, number, number, number]};
    readonly MAX_ZOOM: number;
}

interface Time {
    readonly ALLOW_RANGES: boolean;
}

interface SpatialReferenceConfig {
    readonly NAME: string;
    readonly SRS_STRING: string;
}

export interface CoreConfigStructure extends CommonConfigStructure {
    readonly DEFAULTS: ConfigDefaults;
    readonly DELAYS: Delays;
    readonly MAP: ConfigMap;
    readonly TIME: Time;
    readonly USER: User;
    readonly WCS: Wcs;
    readonly WFS: Wfs;
    readonly WMS: Wms;
    readonly SPATIAL_REFERENCES: Array<SpatialReferenceConfig>;
}

export const DEFAULT_CONFIG: CoreConfigStructure = {
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '2014-04-01T12:00:00.000Z',
            TIMESTEP: '1 month',
            PROJECTION: 'EPSG:4326', // TODO: change back to 'EPSG:3857'
        },
        FOCUS_EXTENT: [-180, -90, 180, 90],
    },
    DELAYS: {
        LOADING: {
            MIN: 500,
        },
        TOOLTIP: 400,
        DEBOUNCE: 400,
        STORAGE_DEBOUNCE: 1500,
        GUEST_LOGIN_HINT: 5000,
    },
    MAP: {
        BACKGROUND_LAYER: 'MVT',
        BACKGROUND_LAYER_URL: 'https://basemap.geoengine.io/natural-earth/{epsg}/{z}/{x}/{y}.pbf',
        HOSTED_BACKGROUND_SERVICE: '/mapcache/',
        HOSTED_BACKGROUND_LAYER_NAME: 'osm',
        HOSTED_BACKGROUND_SERVICE_VERSION: '1.1.1',
        VECTOR_TILES: {
            STYLE_URL: 'assets/mvt/ne-ge.json',
            SOURCE: 'ne',
            BACKGROUND_LAYER_EXTENTS: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'EPSG:4326': [-180, -180, 180, 180],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'EPSG:3857': [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892],
            },
            MAX_ZOOM: 22,
        },
        REFRESH_LAYERS_ON_CHANGE: false,
        VALID_CRS: ['EPSG:4326', 'EPSG:3857'],
    },
    API_URL: '/api',
    TIME: {
        ALLOW_RANGES: true,
    },
    USER: {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
    WCS: {
        SERVICE: 'WCS',
        VERSION: '2.0.1',
    },
    WFS: {
        VERSION: '2.0.0',
        FORMAT: 'application/json',
    },
    WMS: {
        VERSION: '1.3.0',
        FORMAT: 'image/png',
    },
    PLOTS: {
        THEME: 'excel',
    },
    SPATIAL_REFERENCES: [
        {
            NAME: 'WGS 84',
            SRS_STRING: 'EPSG:4326',
        },
        {
            NAME: 'WGS 84 / Pseudo-Mercator',
            SRS_STRING: 'EPSG:3857',
        },
        {
            NAME: 'WGS 84 / UTM zone 32N',
            SRS_STRING: 'EPSG:32632',
        },
        {
            NAME: 'WGS 84 / UTM zone 36N',
            SRS_STRING: 'EPSG:32636',
        },
        {
            NAME: 'WGS 84 / UTM zone 36S',
            SRS_STRING: 'EPSG:32736',
        },
        {
            NAME: 'WGS 84 / UTM zone 37N',
            SRS_STRING: 'EPSG:32637',
        },
        {
            NAME: 'WGS 84 / UTM zone 37S',
            SRS_STRING: 'EPSG:32737',
        },
    ],
};

/**
 * A service that provides config entries.
 * Loads a custom file at startup.
 */
@Injectable({
    providedIn: 'root',
})
export class CoreConfig extends CommonConfig {
    protected static override config: CoreConfigStructure;

    override get DELAYS(): Delays {
        return CoreConfig.config.DELAYS;
    }

    get WMS(): Wms {
        return CoreConfig.config.WMS;
    }

    get WFS(): Wfs {
        return CoreConfig.config.WFS;
    }

    get WCS(): Wcs {
        return CoreConfig.config.WCS;
    }

    get USER(): User {
        return CoreConfig.config.USER;
    }

    get DEFAULTS(): ConfigDefaults {
        return CoreConfig.config.DEFAULTS;
    }

    get MAP(): ConfigMap {
        return CoreConfig.config.MAP;
    }

    get TIME(): Time {
        return CoreConfig.config.TIME;
    }

    get SPATIAL_REFERENCES(): Array<SpatialReferenceConfig> {
        return CoreConfig.config.SPATIAL_REFERENCES;
    }

    /**
     * Initialize the config on app start.
     */
    static override async load(defaults: CoreConfigStructure = DEFAULT_CONFIG): Promise<void> {
        await CommonConfig.load();

        CoreConfig.config = mergeDeepOverrideLists(defaults, {...CommonConfig.config});

        console.log(CoreConfig.config);
    }
}
