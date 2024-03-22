/* eslint-disable @typescript-eslint/naming-convention */

import {Injectable} from '@angular/core';
import {mergeDeepOverrideLists} from '@geoengine/common';
import {Config, ConfigStructure, DEFAULT_CONFIG} from '@geoengine/core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
    readonly MAP_RESOLUTION_EXTENT_OVERLAY: {
        readonly AVAILABLE: boolean;
    };
}

interface AppConfigStructure extends ConfigStructure {
    readonly COMPONENTS: Components;
}

const APP_CONFIG_DEFAULTS = mergeDeepOverrideLists(DEFAULT_CONFIG, {
    COMPONENTS: {
        PLAYBACK: {
            AVAILABLE: false,
        },
        MAP_RESOLUTION_EXTENT_OVERLAY: {
            AVAILABLE: true,
        },
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected override config!: AppConfigStructure;

    get COMPONENTS(): Components {
        return this.config.COMPONENTS;
    }

    override load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
