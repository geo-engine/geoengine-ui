import {Injectable} from '@angular/core';
import {Record} from 'immutable';
import {Http} from '@angular/http';

interface ConfigInterface {
    CONFIG_FILE: string;
    MAPPING_URL: string;
    WMS: {
        VERSION: string,
        FORMAT: string,
    };
    WFS: {
        VERSION: string,
        FORMAT: string,
    };
    WCS: {
        SERVICE: string,
        VERSION: string,
    };
    DEBUG_MODE: {
        WAVE: boolean,
        MAPPING: boolean,
    };
    USER: {
        GUEST: {
            NAME: string,
            PASSWORD: string,
        },
    };
    DELAYS: {
        LOADING: {
            MIN: number,
        },
        DEBOUNCE: number,
    };
    REFRESH_LAYERS_ON_CHANGE: boolean;
    PROJECT: 'GFBio' | 'IDESSA';
    DEFAULTS: {
        PROJECT: {
            NAME: string,
            TIME: string,
            PROJECTION: 'EPSG:3857' | 'EPSG:4326',
        },
    };
    MAP: {
        BACKGROUND_LAYER: 'OSM' | 'countries' | 'hosted',
        HOSTED_BACKGROUND_SERVICE: string,
        HOSTED_BACKGROUND_LAYER_NAME: string,
        HOSTED_BACKGROUND_SERVICE_VERSION: string,
    };
    GFBIO: {
        LIFERAY_PORTAL_URL: string,
    };
}

const Config = Record({
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

function load(http: Http): string {
    console.log("HTTP", http);
    return 'lalal';
}

@Injectable()
export class ConfigService extends Config implements ConfigInterface {

    CONFIG_FILE;
    MAPPING_URL;
    WMS;
    WFS;
    WCS;
    DEBUG_MODE;
    USER;
    DELAYS;
    REFRESH_LAYERS_ON_CHANGE;
    PROJECT;
    DEFAULTS;
    MAP;
    GFBIO;

    constructor(private http: Http) {
        // super(Config.defaultValues..merge({
        //     GFBIO: load(http),
        //     MAP: {
        //         HOSTED_BACKGROUND_SERVICE: 'foobar',
        //     }
        // }));

        super();

        super();


        // this.http.get(this.CONFIG_FILE)
        //     .map(result => result.json())
        //     .subscribe(data => this.load(data));

        console.log("CONFIG!!!", this.GFBIO, this.MAP.BACKGROUND_LAYER);
    }

    // private load(data: {[key: string]: any}) {
    //     for (const key in data) {
    //         if (data.hasOwnProperty(key)) {
    //             const value = data[key];
    //
    //             this.set(key, value);
    //         }
    //     }
    // }

}
