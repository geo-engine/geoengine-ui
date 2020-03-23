import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface Gfbio {
    readonly LIFERAY_PORTAL_URL: string;
}

interface AppConfigStructure extends WaveConfigStructure {
    readonly GFBIO: Gfbio;
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
    GFBIO: {
        LIFERAY_PORTAL_URL: 'https://dev.gfbio.org/',
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected config: AppConfigStructure;

    get GFBIO(): Gfbio {
        return this.config.GFBIO;
    }

    load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
