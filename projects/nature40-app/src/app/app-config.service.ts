import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface Nature40 {
    SSO_JWT_PROVIDER_URL: string;
    DEFAULT_VIEW_BBOX: [number, number, number, number];
}

interface AppConfigStructure extends WaveConfigStructure {
    readonly NATURE40: Nature40;
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
    NATURE40: {
        SSO_JWT_PROVIDER_URL: 'http://vhrz669.hrz.uni-marburg.de/nature40/sso?jws=',
        DEFAULT_VIEW_BBOX: [8.66, 50.82, 8.69, 50.84], // default to Uniwald
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config: AppConfigStructure;

    get NATURE40(): Nature40 {
        return this.config.NATURE40;
    }

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
