import {of as observableOf} from 'rxjs';

import {catchError, tap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import * as Immutable from 'immutable';
import {HttpClient} from '@angular/common/http';

type MappingUrlType = string;

interface Wms {
    VERSION: string;
    FORMAT: string;
}

interface Wfs {
    VERSION: string;
    FORMAT: string;
}

interface Wcs {
    SERVICE: string;
    VERSION: string;
}

interface DebugMode {
    WAVE: boolean;
    MAPPING: boolean;
}

interface User {
    GUEST: {
        NAME: string,
        PASSWORD: string,
    };
}

interface Delays {
    LOADING: {
        MIN: number,
    };
    TOOLTIP: number;
    DEBOUNCE: number;
    STORAGE_DEBOUNCE: number;
    GUEST_LOGIN_HINT: number;
}

export type Project = 'EUMETSAT' | 'GFBio' | 'GeoBon' | 'Nature40';

interface Defaults {
    PROJECT: {
        NAME: string,
        TIME: string,
        TIMESTEP: '15 minutes' | '1 hour' | '1 day' | '1 month' | '6 months' | '1 year',
        PROJECTION: 'EPSG:3857' | 'EPSG:4326',
    };
}

interface Map {
    BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted' | 'XYZ';
    BACKGROUND_LAYER_URL: string;
    HOSTED_BACKGROUND_SERVICE: string;
    HOSTED_BACKGROUND_LAYER_NAME: string;
    HOSTED_BACKGROUND_SERVICE_VERSION: string;
    REFRESH_LAYERS_ON_CHANGE: boolean;
}

interface Gfbio {
    LIFERAY_PORTAL_URL: string;
}

interface Nature40 {
    SSO_JWT_PROVIDER_URL: string;
}

interface Time {
    ALLOW_RANGES: boolean;
}

interface Components {
    PLAYBACK: {
        AVAILABLE: boolean,
    };
}

interface ConfigStructure {
    COMPONENTS: Components;
    CONFIG_FILE: string;
    DEBUG_MODE: DebugMode;
    DEFAULTS: Defaults;
    DELAYS: Delays;
    GFBIO: Gfbio;
    MAP: Map;
    MAPPING_URL: MappingUrlType;
    NATURE40: Nature40;
    PROJECT: Project;
    TIME: Time;
    USER: User;
    WCS: Wcs;
    WFS: Wfs;
    WMS: Wms;
}

/**
 * The default config
 * @type {any}
 */
const ConfigDefault = Immutable.fromJS({
    COMPONENTS: {
        PLAYBACK: {
            AVAILABLE: false,
        }
    },
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
} as ConfigStructure);

/**
 * Calls a recursive Object.freeze on an object.
 * @param o
 * @returns {any}
 */
function deepFreeze(o) {
    Object.freeze(o);
    if (o === undefined) {
        return o;
    }

    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (o[prop] !== null
            && (typeof o[prop] === 'object' || typeof o[prop] === 'function')
            && !Object.isFrozen(o[prop])) {
            deepFreeze(o[prop]);
        }
    });

    return o;
}

/**
 * A service that provides config entries.
 * Loads a custom file at startup.
 */
@Injectable()
export class Config {
    static get CONFIG_FILE(): string {
        return 'assets/config.json';
    }

    private _COMPONENTS: Components;
    private _MAPPING_URL: MappingUrlType;
    private _WMS: Wms;
    private _WFS: Wfs;
    private _WCS: Wcs;
    private _DEBUG_MODE: DebugMode;
    private _USER: User;
    private _DELAYS: Delays;
    private _PROJECT: Project;
    private _DEFAULTS: Defaults;
    private _MAP: Map;
    private _GFBIO: Gfbio;
    private _NATURE40: Nature40;
    private _TIME: Time;

    get COMPONENTS(): Components {
        return this._COMPONENTS;
    }

    get MAPPING_URL(): MappingUrlType {
        return this._MAPPING_URL;
    }

    get WMS(): Wms {
        return this._WMS;
    }

    get WFS(): Wfs {
        return this._WFS;
    }

    get WCS(): Wcs {
        return this._WCS;
    }

    get DEBUG_MODE(): DebugMode {
        return this._DEBUG_MODE;
    }

    get USER(): User {
        return this._USER;
    }

    get DELAYS(): Delays {
        return this._DELAYS;
    }

    get PROJECT(): Project {
        return this._PROJECT;
    }

    get DEFAULTS(): Defaults {
        return this._DEFAULTS;
    }

    get MAP(): Map {
        return this._MAP;
    }

    get GFBIO(): Gfbio {
        return this._GFBIO;
    }

    get NATURE40(): Nature40 {
        return this._NATURE40;
    }

    get TIME(): Time {
        return this._TIME;
    }

    constructor(private http: HttpClient) {
    }

    /**
     * Initialize the config on app start.
     */
    load(): Promise<void> {
        return this.http
            .get<ConfigStructure>(Config.CONFIG_FILE).pipe(
                tap(
                    appConfig => {
                        const config = ConfigDefault.mergeDeep(Immutable.fromJS(appConfig)).toJS();

                        this.handleConfig(config);
                    },
                    () => { // error
                        this.handleConfig(ConfigDefault.toJS());
                    }),
                catchError(() => observableOf(undefined)))
            .toPromise();
    }

    private handleConfig(config: { [key: string]: any }) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = deepFreeze(config[key]);

                switch (key.toUpperCase()) {
                    case 'COMPONENTS':
                        this._COMPONENTS = value;
                        break;
                    case 'MAPPING_URL':
                        this._MAPPING_URL = value;
                        break;
                    case 'WMS':
                        this._WMS = value;
                        break;
                    case 'WFS':
                        this._WFS = value;
                        break;
                    case 'WCS':
                        this._WCS = value;
                        break;
                    case 'DEBUG_MODE':
                        this._DEBUG_MODE = value;
                        break;
                    case 'USER':
                        this._USER = value;
                        break;
                    case 'DELAYS':
                        this._DELAYS = value;
                        break;
                    case 'PROJECT':
                        this._PROJECT = value;
                        break;
                    case 'DEFAULTS':
                        this._DEFAULTS = value;
                        break;
                    case 'MAP':
                        this._MAP = value;
                        break;
                    case 'GFBIO':
                        this._GFBIO = value;
                        break;
                    case 'NATURE40':
                        this._NATURE40 = value;
                        break;
                    case 'TIME':
                        this._TIME = value;
                        break;
                    default:
                        break;
                }
            }
        }
    }

}
