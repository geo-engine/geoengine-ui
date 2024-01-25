import {Injectable} from '@angular/core';
import {Configuration, DefaultConfig} from '@geoengine/openapi-client';
import Immutable from 'immutable';
import {mergeWith} from 'immutable';

export interface ConfigStructure {
    readonly API_URL: string;
}

export const DEFAULT_CONFIG: ConfigStructure = {
    API_URL: '/api',
};

@Injectable()
export class AppConfig {
    static readonly CONFIG_FILE = 'assets/config.json';

    protected config!: ConfigStructure;

    // noinspection JSUnusedGlobalSymbols <- function used in parent app
    /**
     * Initialize the config on app start.
     */
    async load(defaults: ConfigStructure = DEFAULT_CONFIG): Promise<void> {
        const configFileResponse = await fetch(AppConfig.CONFIG_FILE);

        const appConfig = await configFileResponse.json().catch(() => ({}));
        this.config = mergeDeepOverrideLists(defaults, {...appConfig});

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
