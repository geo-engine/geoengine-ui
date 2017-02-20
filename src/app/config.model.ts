export default {
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
    DEVELOPER_MODE: true,
    MAPPING_DEBUG_MODE: false,
    USER: {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        },
    },
    COLORS: {
        DEFAULT: 'whitesmoke',
        PRIMARY: '#009688',
        ACCENT: '#9c27b0',
        WARN: '#f44336',
        TEXT: {
            DEFAULT: 'rgba(0, 0, 0, 0.87)',
            PRIMARY: 'rgba(255, 255, 255, 0.870588)',
            ACCENT: 'rgba(255, 255, 255, 0.870588)',
            WARN: 'rgba(255, 255, 255, 0.870588)',
        },
    },
    DELAYS: {
        LOADING: {
            MIN: 500,
        },
        DEBOUNCE: 400,
    },
    REFRESH_LAYERS_ON_CHANGE: false,
    PROJECT: 'GFBio', // one of: GFBio, IDESSA
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '2000-06-06T12:00:00.000Z',
            PROJECTION: 'EPSG:3857',
        },
    },
    MAP: {
        BACKGROUND_LAYER: 'OSM', // one of: OSM, countries, hosted
        HOSTED_BACKGROUND_SERVICE: 'http://pc12388.mathematik.uni-marburg.de/mapcache/',
        HOSTED_BACKGROUND_LAYER_NAME: 'osm',
        HOSTED_BACKGROUND_SERVICE_VERSION: '1.1.1',
    },
    GFBIO: {
        LIFERAY_PORTAL_URL: 'http://gfbio-dev1.inf-bb.uni-jena.de:8080/',
    },
};
