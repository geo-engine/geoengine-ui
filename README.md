[![Build Status](https://travis-ci.org/umr-dbs/wave.svg?branch=master)](https://travis-ci.org/umr-dbs/wave)

# WAVE - Workflow, Analysis and Visualization Editor
*WAVE* is the official frontend of *VAT*.
It is a web application that is built via nodejs.
You can serve *WAVE* via any http server, e.g. Apache.

## Requirements
You need to have [Node.js](https://nodejs.org) installed.
Verify that you are running at least node v5.x.x and npm 3.x.x.
You can check this by running node -v and npm -v in a terminal/console window.

### Ubuntu 14.04 LTS and higher
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## How to build
### Production
```
rm -rf node_modules
npm install
npm run build-production
```
You can find the output in the `dist` directory.

### Development Live Server
You need to modify the `proxy.conf.json` file to point to a valid *MAPPING* instance.
```
rm -rf node_modules
npm install
npm start
```
You can visit `http://localhost:4200/`.


## Configuration
Under `assets/config.json` can be an (optional) configuration file.
You can override any of these default settings by specifying them.
```
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
        STORAGE_DEBOUNCE: 1500,
        GUEST_LOGIN_HINT: 5000,
    },
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
        REFRESH_LAYERS_ON_CHANGE: false,
    },
    GFBIO: {
        LIFERAY_PORTAL_URL: 'https://gfbio-dev1.inf-bb.uni-jena.de/',
    },
    TIME: {
        ALLOW_RANGES: true,
    }
```
*TODO: specify the options of each parameter in a tabular form.*
