import {of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {mergeDeep} from 'immutable';
import {HttpClient} from '@angular/common/http';

type MappingUrlType = string;

interface Wms {
    readonly VERSION: string;
    readonly FORMAT: string;
}

interface Wfs {
    readonly VERSION: string;
    readonly FORMAT: string;
}

interface Wcs {
    readonly SERVICE: string;
    readonly VERSION: string;
}

interface DebugMode {
    readonly WAVE: boolean;
    readonly MAPPING: boolean;
}

interface User {
    readonly GUEST: {
        readonly NAME: string,
        readonly PASSWORD: string,
    };
}

interface Delays {
    readonly LOADING: {
        readonly MIN: number,
    };
    readonly TOOLTIP: number;
    readonly DEBOUNCE: number;
    readonly STORAGE_DEBOUNCE: number;
    readonly GUEST_LOGIN_HINT: number;
}

export type ProjectNameConfig = 'EUMETSAT' | 'GFBio' | 'GeoBon' | 'Nature40';

interface Defaults {
    readonly PROJECT: {
        readonly NAME: string,
        readonly TIME: string,
        readonly TIMESTEP: '15 minutes' | '1 hour' | '1 day' | '1 month' | '6 months' | '1 year',
        readonly PROJECTION: 'EPSG:3857' | 'EPSG:4326',
    };
}

interface Map {
    readonly BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted' | 'XYZ';
    readonly BACKGROUND_LAYER_URL: string;
    readonly HOSTED_BACKGROUND_SERVICE: string;
    readonly HOSTED_BACKGROUND_LAYER_NAME: string;
    readonly HOSTED_BACKGROUND_SERVICE_VERSION: string;
    readonly REFRESH_LAYERS_ON_CHANGE: boolean;
}

interface Gfbio {
    readonly LIFERAY_PORTAL_URL: string;
}

interface Nature40 {
    SSO_JWT_PROVIDER_URL: string;
}

interface Time {
    readonly ALLOW_RANGES: boolean;
}

export interface WaveConfigStructure {
    readonly DEBUG_MODE: DebugMode;
    readonly DEFAULTS: Defaults;
    readonly DELAYS: Delays;
    readonly GFBIO: Gfbio;
    readonly MAP: Map;
    readonly MAPPING_URL: MappingUrlType;
    readonly NATURE40: Nature40;
    readonly PROJECT: ProjectNameConfig;
    readonly TIME: Time;
    readonly USER: User;
    readonly WCS: Wcs;
    readonly WFS: Wfs;
    readonly WMS: Wms;
}

export const WAVE_DEFAULT_CONFIG: WaveConfigStructure = {
    DEBUG_MODE: {
        WAVE: false,
        MAPPING: false,
    },
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '2000-06-06T12:00:00.000Z',
            TIMESTEP: '1 month',
            PROJECTION: 'EPSG:3857',
        },
    },
    DELAYS: {
        LOADING: {
            MIN: 500,
        },
        TOOLTIP: 400,
        DEBOUNCE: 400,
        STORAGE_DEBOUNCE: 1500,
        GUEST_LOGIN_HINT: 5000,
    },
    GFBIO: {
        LIFERAY_PORTAL_URL: 'https://dev.gfbio.org/',
    },
    MAP: {
        BACKGROUND_LAYER: 'OSM',
        BACKGROUND_LAYER_URL: '',
        HOSTED_BACKGROUND_SERVICE: '/mapcache/',
        HOSTED_BACKGROUND_LAYER_NAME: 'osm',
        HOSTED_BACKGROUND_SERVICE_VERSION: '1.1.1',
        REFRESH_LAYERS_ON_CHANGE: false,
    },
    MAPPING_URL: '/cgi-bin/mapping_cgi',
    NATURE40: {
        SSO_JWT_PROVIDER_URL: 'http://vhrz669.hrz.uni-marburg.de/nature40/sso?jws=',
    },
    PROJECT: 'GFBio',
    TIME: {
        ALLOW_RANGES: true,
    },
    USER: {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
    WCS: {
        SERVICE: 'WCS',
        VERSION: '2.0.1',
    },
    WFS: {
        VERSION: '2.0.0',
        FORMAT: 'application/json',
    },
    WMS: {
        VERSION: '1.3.0',
        FORMAT: 'image/png',
    },
};

/**
 * A service that provides config entries.
 * Loads a custom file at startup.
 */
@Injectable()
export class Config {
    static readonly CONFIG_FILE = 'assets/config.json';

    protected config: WaveConfigStructure;

    get MAPPING_URL(): MappingUrlType {
        return this.config.MAPPING_URL;
    }

    get WMS(): Wms {
        return this.config.WMS;
    }

    get WFS(): Wfs {
        return this.config.WFS;
    }

    get WCS(): Wcs {
        return this.config.WCS;
    }

    get DEBUG_MODE(): DebugMode {
        return this.config.DEBUG_MODE;
    }

    get USER(): User {
        return this.config.USER;
    }

    get DELAYS(): Delays {
        return this.config.DELAYS;
    }

    get PROJECT(): ProjectNameConfig {
        return this.config.PROJECT;
    }

    get DEFAULTS(): Defaults {
        return this.config.DEFAULTS;
    }

    get MAP(): Map {
        return this.config.MAP;
    }

    get GFBIO(): Gfbio {
        return this.config.GFBIO;
    }

    get NATURE40(): Nature40 {
        return this.config.NATURE40;
    }

    get TIME(): Time {
        return this.config.TIME;
    }

    constructor(protected http: HttpClient) {
    }

    // noinspection JSUnusedGlobalSymbols <- function used in parent app
    /**
     * Initialize the config on app start.
     */
    load(defaults?: WaveConfigStructure): Promise<void> {
        if (!defaults) {
            defaults = WAVE_DEFAULT_CONFIG;
        }
        return this.http
            .get<WaveConfigStructure>(Config.CONFIG_FILE).pipe(
                tap(
                    appConfig => {
                        this.config = mergeDeep(defaults, appConfig);
                    },
                    () => { // error
                        this.config = defaults;
                    }),
                catchError(() => of(undefined)))
            .toPromise();
    }

}
