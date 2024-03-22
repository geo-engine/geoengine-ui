/* eslint-disable @typescript-eslint/naming-convention */

import {Injectable} from '@angular/core';
import {mergeDeepOverrideLists} from '@geoengine/common';
import {Config, ConfigStructure, DEFAULT_CONFIG} from '@geoengine/core';

interface Components {
    readonly PLAYBACK: {
        readonly AVAILABLE: boolean;
    };
    readonly REGISTRATION: {
        readonly AVAILABLE: boolean;
    };
    readonly MAP_RESOLUTION_EXTENT_OVERLAY: {
        readonly AVAILABLE: boolean;
    };
}

interface Branding {
    readonly LOGO_URL: string;
    readonly LOGO_ICON_URL: string;
    readonly LOGO_ALT_URL: string;
    readonly PAGE_TITLE: string;
    readonly HOMEPAGE?: Homepage;
}

interface Homepage {
    readonly URL: string;
    readonly BUTTON_IMAGE_URL: string;
    readonly BUTTON_ALT_TEXT: string;
    readonly BUTTON_TOOLTIP_TEXT: string;
}

interface AppConfigStructure extends ConfigStructure {
    readonly COMPONENTS: Components;
    readonly BRANDING: Branding;
}

const APP_CONFIG_DEFAULTS = mergeDeepOverrideLists(DEFAULT_CONFIG, {
    COMPONENTS: {
        PLAYBACK: {
            AVAILABLE: false,
        },
        REGISTRATION: {
            AVAILABLE: true,
        },
        MAP_RESOLUTION_EXTENT_OVERLAY: {
            AVAILABLE: true,
        },
    },
    BRANDING: {
        LOGO_URL: 'assets/geoengine.svg',
        LOGO_ICON_URL: 'assets/geoengine-favicon-white.svg',
        LOGO_ALT_URL: 'assets/geoengine-white.svg',
        PAGE_TITLE: 'Geo Engine',
    },
}) as AppConfigStructure;

@Injectable()
export class AppConfig extends Config {
    protected override config!: AppConfigStructure;

    get COMPONENTS(): Components {
        return this.config.COMPONENTS;
    }

    get BRANDING(): Branding {
        return this.config.BRANDING;
    }

    override load(): Promise<void> {
        return super.load(APP_CONFIG_DEFAULTS);
    }
}
