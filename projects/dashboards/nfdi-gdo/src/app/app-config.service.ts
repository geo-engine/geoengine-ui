import {Injectable} from '@angular/core';
import {Config, ConfigStructure, ConfigDefaults, ConfigMap, DEFAULT_CONFIG, mergeDeepOverrideLists} from '@geoengine/core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
}

interface AppConfigStructure extends ConfigStructure {
    readonly COMPONENTS: Components;
    readonly DEFAULTS: ConfigDefaults;
    readonly MAP: ConfigMap;
}

const APP_CONFIG_DEFAULTS = mergeDeepOverrideLists(DEFAULT_CONFIG, {
    COMPONENTS: {
        PLAYBACK: {
            AVAILABLE: false,
        },
    },
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '1991-01-01T00:00:00.000Z',
            TIMESTEP: '1 month',
            PROJECTION: 'EPSG:3857',
        },
        FOCUS_EXTENT: [6.98865807458, 47.3024876979, 15.0169958839, 54.983104153],
    },
    MAP: {
        // TODO: Geo Engine basemap!
        BACKGROUND_LAYER: 'OSM',
        VALID_CRS: ['EPSG:3857', 'EPSG:4326'],
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config!: AppConfigStructure;

    get COMPONENTS(): Components {
        return this.config.COMPONENTS;
    }

    get MAP(): ConfigMap {
        return this.config.MAP;
    }

    get DEFAULTS(): ConfigDefaults {
        return this.config.DEFAULTS;
    }

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
