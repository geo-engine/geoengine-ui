import {Injectable} from '@angular/core';
import * as Immutable from 'immutable';
import {Http} from '@angular/http';

/**
 * The default config
 * @type {any}
 */
const ConfigDefault = Immutable.fromJS({
    CONFIG_FILE: 'assets/config.json',
    MAPPING_URL: '/cgi-bin/mapping_cgi',
    WMS: {
        VERSION: '1.3.0',
        FORMAT: 'image/png',
    },
    WFS: {
        VERSION: '2.0.0',
        FORMAT: 'application/json',
    },
    WCS: {
        SERVICE: 'WCS',
        VERSION: '2.0.1',
    },
    DEBUG_MODE: {
        WAVE: false,
        MAPPING: false,
    },
    USER: {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
    DELAYS: {
        LOADING: {
            MIN: 500,
        },
        DEBOUNCE: 400,
    },
    REFRESH_LAYERS_ON_CHANGE: false,
    PROJECT: 'GFBio',
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '2000-06-06T12:00:00.000Z',
            PROJECTION: 'EPSG:3857',
        },
    },
    MAP: {
        BACKGROUND_LAYER: 'OSM',
        HOSTED_BACKGROUND_SERVICE: '/mapcache/',
        HOSTED_BACKGROUND_LAYER_NAME: 'osm',
        HOSTED_BACKGROUND_SERVICE_VERSION: '1.1.1',
    },
    GFBIO: {
        LIFERAY_PORTAL_URL: 'http://gfbio-dev1.inf-bb.uni-jena.de:8080/',
    },
});

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
    };

    private _MAPPING_URL: string;
    private _WMS: {
        VERSION: string,
        FORMAT: string,
    };
    private _WFS: {
        VERSION: string,
        FORMAT: string,
    };
    private _WCS: {
        SERVICE: string,
        VERSION: string,
    };
    private _DEBUG_MODE: {
        WAVE: boolean,
        MAPPING: boolean,
    };
    private _USER: {
        GUEST: {
            NAME: string,
            PASSWORD: string,
        },
    };
    private _DELAYS: {
        LOADING: {
            MIN: number,
        },
        DEBOUNCE: number,
    };
    private _PROJECT: 'GFBio' | 'IDESSA';
    private _DEFAULTS: {
        PROJECT: {
            NAME: string,
            TIME: string,
            PROJECTION: 'EPSG:3857' | 'EPSG:4326',
        },
    };
    private _MAP: {
        BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted',
        HOSTED_BACKGROUND_SERVICE: string,
        HOSTED_BACKGROUND_LAYER_NAME: string,
        HOSTED_BACKGROUND_SERVICE_VERSION: string,
        REFRESH_LAYERS_ON_CHANGE: boolean,
    };
    private _GFBIO: {
        LIFERAY_PORTAL_URL: string,
    };


    get MAPPING_URL() {
        return this._MAPPING_URL;
    }

    get WMS() {
        return this._WMS;
    }

    get WFS() {
        return this._WFS;
    }

    get WCS() {
        return this._WCS;
    }

    get DEBUG_MODE() {
        return this._DEBUG_MODE;
    }

    get USER() {
        return this._USER;
    }

    get DELAYS() {
        return this._DELAYS;
    }

    get PROJECT() {
        return this._PROJECT;
    }

    get DEFAULTS() {
        return this._DEFAULTS;
    }

    get MAP() {
        return this._MAP;
    }

    get GFBIO() {
        return this._GFBIO;
    }

    constructor(private http: Http) {
    }

    /**
     * Initialize the config on app start.
     */
    load(): Promise<void> {
        return this.http.get(Config.CONFIG_FILE)
            .map(response => response.json())
            .do(
                appConfig => {
                    const config = ConfigDefault.mergeDeep(Immutable.fromJS(appConfig)).toJS();

                    this.handleConfig(config);
                },
                error => {
                    this.handleConfig(ConfigDefault.toJS());
                })
            .toPromise();
    }

    private handleConfig(config: {[key: string]: any}) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                const value = deepFreeze(config[key]);

                switch (key.toUpperCase()) {
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
                    default:
                        break;
                }
            }
        }
    }

}
