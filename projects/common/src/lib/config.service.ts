import {Injectable} from '@angular/core';
import {Configuration, DefaultConfig} from '@geoengine/openapi-client';
import Immutable from 'immutable';
import {mergeWith} from 'immutable';

/**
 * The structure of the config file containing the URL of the backend API and the branding information.
 */
export interface CommonConfigStructure {
    readonly API_URL: string;
    readonly DELAYS: Delays;
    readonly PLOTS: Plots;
}

/**
 * Delay values for different actions.
 */
export interface Delays {
    readonly DEBOUNCE: number;
}

interface Plots {
    readonly THEME: 'excel' | 'ggplot2' | 'quartz' | 'vox' | 'dark';
}

export const DEFAULT_CONFIG: CommonConfigStructure = {
    API_URL: '/api',
    DELAYS: {
        DEBOUNCE: 400,
    },
    PLOTS: {
        THEME: 'excel',
    },
};

@Injectable({
    providedIn: 'root',
})
export class CommonConfig {
    static readonly CONFIG_FILE = 'assets/config.json';

    protected static config: CommonConfigStructure;

    get API_URL(): string {
        return CommonConfig.config.API_URL;
    }

    get DELAYS(): Delays {
        return CommonConfig.config.DELAYS;
    }

    get PLOTS(): Plots {
        return CommonConfig.config.PLOTS;
    }

    // noinspection JSUnusedGlobalSymbols <- function used in parent app
    /**
     * Initialize the config on app start.
     */
    public static async load(defaults: CommonConfigStructure = DEFAULT_CONFIG): Promise<void> {
        const configFileResponse = await fetch(CommonConfig.CONFIG_FILE);

        const appConfig = await configFileResponse.json().catch(() => ({}));
        CommonConfig.config = mergeDeepOverrideLists(defaults, {...appConfig});
        console.log('this.config:', this.config);

        // we alter the config in the openapi-client so that it uses the correct API_URL
        DefaultConfig.config = new Configuration({
            basePath: this.config.API_URL,
            fetchApi: DefaultConfig.fetchApi,
            middleware: DefaultConfig.middleware,
            queryParamsStringify: DefaultConfig.queryParamsStringify,
            username: DefaultConfig.username,
            password: DefaultConfig.password,
            apiKey: DefaultConfig.apiKey,
            accessToken: DefaultConfig.accessToken,
            headers: DefaultConfig.headers,
            credentials: DefaultConfig.credentials,
        });
    }
}

/**
 * A version of ImmutableJS `mergeDeep` that replaces Lists instead of concatenating them.
 */
export function mergeDeepOverrideLists<C>(a: C, b: Iterable<unknown> | Iterable<[unknown, unknown]> | {[key: string]: unknown}): C {
    // If b is null, it would overwrite a, even if a is mergeable
    if (b === null) return b;

    if (a && typeof a === 'object' && !Array.isArray(a) && !Immutable.List.isList(a)) {
        return mergeWith(mergeDeepOverrideLists as (a: unknown, b: unknown) => unknown, a, b);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return b as any;
}
