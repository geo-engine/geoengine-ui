import {effect, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Basemap, Basemaps, CoreConfig} from '../config.service';

const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_'); // TODO: de-duplicate with user service?
const STORAGE_KEY = 'basemap';

interface NamedBasemap extends Basemap {
    name: string;
}

@Injectable({providedIn: 'root'})
export class BasemapService {
    protected readonly config = inject(CoreConfig);

    protected selectedBasemap: WritableSignal<NamedBasemap>;

    constructor() {
        const basemaps = this.config.MAP.BASEMAPS;
        const defaultBasemap = this.config.MAP.DEFAULT_BASEMAP;
        checkBasemaps(basemaps, defaultBasemap);

        let basemap = basemaps[defaultBasemap];

        const preferredBasemap = loadBasemapPreferenceFromBrowser();
        if (preferredBasemap && basemaps[preferredBasemap]) {
            basemap = basemaps[preferredBasemap];
        }

        this.selectedBasemap = signal<NamedBasemap>({
            name: defaultBasemap,
            ...basemaps[defaultBasemap],
        } as NamedBasemap);

        effect(() => {
            const currentBasemap = this.selectedBasemap();
            if (!currentBasemap || currentBasemap.name === defaultBasemap) {
                return removeBasemapPreferenceInBrowser();
            }

            saveBasemapPreferenceInBrowser(currentBasemap.name);
        });
    }

    get basemap(): Signal<Basemap> {
        return this.selectedBasemap.asReadonly();
    }

    get basemaps(): Basemaps {
        return this.config.MAP.BASEMAPS;
    }

    selectBasemap(name: string): void {
        const basemap = this.basemaps[name];
        if (!basemap) {
            throw new Error(`Basemap ${name} is not defined in the configuration`);
        }

        this.selectedBasemap.set({
            name,
            ...basemap,
        } as NamedBasemap);
    }
}

/** minimum type checking
 *
 *  TODO: proper type parsing/checking
 */
function checkBasemaps(basemaps: Basemaps, defaultBasemap: string) {
    if (!defaultBasemap) {
        throw new Error('CONFIG ERROR: Default basemap undefined');
    }

    if (!basemaps[defaultBasemap]) {
        throw new Error('CONFIG ERROR: Default basemap is not in basemap list');
    }

    for (const basemap of Object.values(basemaps)) {
        const BASEMAP_TYPES = ['WMS', 'MVT'];
        if (!BASEMAP_TYPES.includes(basemap.TYPE)) {
            throw new Error(`CONFIG ERROR: Basemap type ${basemap.TYPE} is not supported (supported types: ${BASEMAP_TYPES.join(', ')})`);
        }
    }
}

function saveBasemapPreferenceInBrowser(preferredBasemap: string): void {
    localStorage.setItem(PATH_PREFIX + STORAGE_KEY, preferredBasemap);
}

function loadBasemapPreferenceFromBrowser(): string {
    return localStorage.getItem(PATH_PREFIX + STORAGE_KEY) ?? '';
}

function removeBasemapPreferenceInBrowser(): void {
    localStorage.removeItem(PATH_PREFIX + STORAGE_KEY);
}
