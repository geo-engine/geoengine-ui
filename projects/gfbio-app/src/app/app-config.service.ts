/* eslint-disable @typescript-eslint/naming-convention */

import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, ConfigStructure, DEFAULT_CONFIG} from '@geoengine/core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
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

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
