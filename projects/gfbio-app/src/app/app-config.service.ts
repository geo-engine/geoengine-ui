import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {Config, WaveConfigStructure, WAVE_DEFAULT_CONFIG} from 'wave-core';

interface Gfbio {
    readonly LIFERAY_PORTAL_URL: string;
    readonly SSO: SSO;
}

interface SSO {
    URL: string;
    CLIENT_ID: string;
}

interface AppConfigStructure extends WaveConfigStructure {
    readonly GFBIO: Gfbio;
}

const APP_CONFIG_DEFAULTS = mergeDeep(WAVE_DEFAULT_CONFIG, {
    GFBIO: {
        LIFERAY_PORTAL_URL: 'https://dev.gfbio.org/',
        SSO: {
            URL: 'https://sso.gfbio.org/simplesaml/module.php/oidc/authorize.php',
            CLIENT_ID: '_d6a8e839d7694e173683f2377d1669f2b3dd209679',
        }
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
