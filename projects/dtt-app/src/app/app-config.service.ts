import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

// tslint:disable-next-line:no-empty-interface
interface AppConfigStructure extends WaveConfigStructure {
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
    MAP: {
        REFRESH_LAYERS_ON_CHANGE: false,
    },
    TIME: {
        ALLOW_RANGES: false,
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config: AppConfigStructure;

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
