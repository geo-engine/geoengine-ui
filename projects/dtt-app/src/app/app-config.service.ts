import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface DTT {
    TWITTER_APP_KEY: string;
}

// tslint:disable-next-line:no-empty-interface
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
