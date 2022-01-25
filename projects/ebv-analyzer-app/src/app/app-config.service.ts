import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
}

interface AppConfigStructure extends WaveConfigStructure {
    readonly COMPONENTS: Components;
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
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
