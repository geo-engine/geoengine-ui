import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface DTT {
    readonly TWITTER_APP_KEY: string;
    readonly USE_CASE_FILE: string;
}

interface AppConfigStructure extends WaveConfigStructure {
    DTT: DTT;
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
    MAP: {
        REFRESH_LAYERS_ON_CHANGE: false,
    },
    TIME: {
        ALLOW_RANGES: false,
    },
    DTT: {
        TWITTER_APP_KEY: 'hMxotEImo11IaafMdzTUMDY5R',
        USE_CASE_FILE: 'assets/use-cases.json',
    }
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config: AppConfigStructure;

    get DTT(): DTT {
        return this.config.DTT;
    }

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
