import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, ReplaySubject} from 'rxjs';

import {Config, MappingRequestParameters, UserService, NotificationService} from 'wave-core';

import {AppConfig} from '../app-config.service';

@Injectable()
export class Nature40UserService extends UserService {

    constructor(@Inject(Config) protected readonly config: AppConfig,
                protected readonly http: HttpClient,
                protected readonly notificationService: NotificationService) {
        super(config, http, notificationService);
    }

    /**
     * Login using a JSON Web Token (JWT).
     * If it was successful, set a new user.
     * @param token The user's token.
     * @returns `true` if the login was succesful, `false` otherwise.
     */
    nature40JwtTokenLogin(token: string): Observable<boolean> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: undefined,
            request: 'login',
            parameters: {token},
        });

        return this.loginRequestToUserDetails(parameters);
    }

    /**
     * Retrieve the signed JWT client token.
     */
    getNature40JwtClientToken(): Observable<{ clientToken: string }> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: undefined,
            request: 'clientToken',
            parameters: {},
        });

        return this.request<{ result: string | boolean, clientToken: string }>(parameters);
    }

    getNature40Catalog(): Observable<Map<string, Array<Nature40CatalogEntry>>> {
        const parameters = new MappingRequestParameters({
            service: 'nature40',
            sessionToken: this.getSession().sessionToken,
            request: 'sourcelist',
            parameters: {},
        });

        const subject = new ReplaySubject<Map<string, Array<Nature40CatalogEntry>>>(1);

        this.request<{ result: boolean | string, sourcelist?: Array<Nature40CatalogEntry> }>(parameters).subscribe(
            ({result, sourcelist}) => {
                if (typeof result === 'string') { // unsuccessful
                    subject.error(new Error(result));
                    return;
                }

                const groupedValues = new Map<string, Array<Nature40CatalogEntry>>();
                for (const entry of sourcelist) {
                    const group = entry.provider.type;
                    if (groupedValues.has(group)) {
                        groupedValues.get(group).push(entry);
                    } else {
                        groupedValues.set(group, [entry]);
                    }
                }

                subject.next(groupedValues);
            },
            () => subject.error(new Error('Unable to retrieve Nature 4.0 catalog data')),
            () => subject.complete(),
        );

        return subject;
    }
}

export interface Nature40CatalogEntry {
    global_id: string;
    title: string;
    description: string;
    user_url: string;
    provider: {
        type: string,
        id: string,
        url: string,
    };
    dataset: {
        type: string,
        id: string,
        url: string,
    };
}
