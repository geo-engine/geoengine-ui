import {Headers} from '@angular/http';

import {Map} from 'immutable';

export type ParameterType = string | number | boolean;
export type ParametersType = {[index: string]: ParameterType};

export class RequestParameters {
    protected immutable = false;
    protected parameters: Map<string, ParameterType>;
    protected headers = new Headers();

    constructor(parameters?: ParametersType) {
        this.headers.append('Content-Type', 'application/x-www-form-urlencoded');
        if (parameters) {
            this.parameters = Map<string, ParameterType>(parameters).asMutable();
        } else {
            this.parameters = Map<string, ParameterType>().asMutable();
        }
    }

    setParameter(key: string, value: ParameterType) {
        this.parameters = this.parameters.set(key, value);
    }

    setParameters(parameters: ParametersType) {
        this.parameters = this.parameters.merge(parameters);
    }

    toMessageBody(encode = false): string {
        if (!this.immutable) {
            this.parameters = this.parameters.asImmutable();
        }
        return this.parameters.map(
            (value, key) => [
                key,
                encode ? encodeURIComponent(value.toString()) : value,
            ].join('=')
        ).valueSeq().join('&');
    }

    asMap(): Map<string, ParameterType> {
        if (!this.immutable) {
            this.parameters = this.parameters.asImmutable();
        }
        return this.parameters;
    }

    asObject(): ParametersType {
        if (!this.immutable) {
            this.parameters = this.parameters.asImmutable();
        }
        return this.parameters.toObject();
    }

    addAuthentication(username: string, password: string) {
        this.headers.append('Authorization', 'Basic ' + btoa(username + ':' + password));
    }

    getHeaders(): Headers {
        return this.headers;
    }
}

export class MappingRequestParameters extends RequestParameters {
    constructor(config: {
        service: string;
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        super(config.parameters);
        this.parameters.merge({
            service: config.service,
            request: config.request,
            sessiontoken: config.sessionToken,
        });
    }

    setParameter(key: string, value: ParameterType) {
        if (['service', 'request', 'sessionToken'].indexOf(key) > 0) {
            throw 'You must not reset "service", "request" or "sessionToken"';
        }
        this.parameters = this.parameters.set(key, value);
    }

    setParameters(parameters: ParametersType) {
        Object.keys(parameters).forEach(key => {
            if (['service', 'request', 'sessionToken'].indexOf(key) > 0) {
                throw 'You must not reset "service", "request" or "sessionToken"';
            }
        });

        this.parameters = this.parameters.merge(parameters);
    }
}
