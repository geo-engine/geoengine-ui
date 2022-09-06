import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, ConfigStructure, DEFAULT_CONFIG, VectorTiles} from '@geoengine/core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
}

interface Map {
    readonly BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted' | 'XYZ' | 'eumetview';
    readonly BACKGROUND_LAYER_URL: string;
    readonly HOSTED_BACKGROUND_SERVICE: string;
    readonly HOSTED_BACKGROUND_LAYER_NAME: string;
    readonly HOSTED_BACKGROUND_SERVICE_VERSION: string;
    readonly VECTOR_TILES: VectorTiles;
    readonly REFRESH_LAYERS_ON_CHANGE: boolean;
    readonly VALID_CRS: Array<string>;
}

interface AppConfigStructure extends ConfigStructure {
    readonly COMPONENTS: Components;
}

const APP_CONFIG_DEFAULTS = mergeDeep(DEFAULT_CONFIG, {
    COMPONENTS: {
        PLAYBACK: {
            AVAILABLE: false,
        },
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config!: AppConfigStructure;

    get COMPONENTS(): Components {
        return this.config.COMPONENTS;
    }

    get MAP(): Map {
        return {
            BACKGROUND_LAYER: 'OSM',
            BACKGROUND_LAYER_URL: '',
            HOSTED_BACKGROUND_SERVICE: '',
            HOSTED_BACKGROUND_LAYER_NAME: '',
            HOSTED_BACKGROUND_SERVICE_VERSION: '',
            VECTOR_TILES: {
                STYLE_URL: 'assets/mvt/ne-ge.json',
                SOURCE: 'ne',
                BACKGROUND_LAYER_EXTENT: [-180, -180, 180, 180],
                MAX_ZOOM: 22,
            },
            REFRESH_LAYERS_ON_CHANGE: false,
            VALID_CRS: ['EPSG:3857', 'EPSG:4326'],
        };
    }

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
