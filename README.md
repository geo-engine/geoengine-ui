[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fumr-dbs%2Fwave%2Fbadge&style=flat)](https://actions-badge.atrox.dev/umr-dbs/wave/goto)

# Geo Engine UI

This repository contains the official frontend of Geo Engine.
It is a web application that is built via nodejs.
You can serve it via any http server, e.g. Apache.

## Requirements

You need to have [Node.js](https://nodejs.org) installed.
Verify that you are running at least `node v14.x.x` and `npm 6.x.x`.
You can check this by running `node -v` and `npm -v` in a terminal or console window.

### Ubuntu 20.04 LTS and higher

```
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## How to build

### Production

```
rm -rf node_modules package-lock.json
npm install
npm run build-prod:core && npm run build-prod:wave
```

You can find the output in the `dist` directory.

### Development Live Server

You have to choose the app to use and the correct proxy configuration.

For instance, here is what you need to do to run the default app with a locally running Geo Engine backend:

For the first time:

```
rm -rf node_modules package-lock.json
npm install
```

Then:

```
npm install
npm run build-watch:core
npm run serve:geoengine:local
```

When the server is started, you can visit `http://localhost:4200/`.

### Apps

_TODO: describe whichs apps are there and how to build them_

## Configuration

Under `assets/config.json` can be an (optional) configuration file.
You can override any of these default settings by specifying them.

```
    API_URL: '/api',
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
    DELAYS: {
        LOADING: {
            MIN: 500,
        },
        TOOLTIP: 400,
        DEBOUNCE: 400,
        STORAGE_DEBOUNCE: 1500,
        GUEST_LOGIN_HINT: 5000,
    },
    PROJECT: 'GFBio',
    DEFAULTS: {
        PROJECT: {
            NAME: 'Default',
            TIME: '2014-04-01T12:00:00.000Z',
            TIMESTEP: '1 month',
            PROJECTION: 'EPSG:4326',
        },
    },
    MAP: {
        BACKGROUND_LAYER: 'eumetview',
        BACKGROUND_LAYER_URL: '',
        HOSTED_BACKGROUND_SERVICE: '/mapcache/',
        HOSTED_BACKGROUND_LAYER_NAME: 'osm',
        HOSTED_BACKGROUND_SERVICE_VERSION: '1.1.1',
        REFRESH_LAYERS_ON_CHANGE: false,
    },
    TIME: {
        ALLOW_RANGES: true,
    }
```

_TODO: specify the options of each parameter in a tabular form._

## Code-Style and CI

We format our code with [prettier](https://prettier.io/) and lint our code with [ESLint](https://eslint.org/).
This is also checked in our CI process.

You can check your PR beforehand by calling `npm run check`.

## Testing

You need to have either `Chrome` or `Chromium` installed.

Run tests with `npm test`.
