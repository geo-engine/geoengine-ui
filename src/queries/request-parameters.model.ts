import {Headers} from '@angular/http';

import Immutable from 'immutable';

type ParameterType = string | number | boolean;
type ParametersType = {[index: string]: ParameterType};

export class MappingRequestParameters {
    private immutable = false;
    private parameters: Immutable.Map<string, ParameterType>;

    constructor(config: {
        service: string;
        request: string,
        sessionToken: string,
        parameters?: ParametersType
    }) {
        this.parameters = Immutable.Map<string, ParameterType>({
            service: config.service,
            request: config.request,
            sessiontoken: config.sessionToken,
        }).asMutable();
        if (config.parameters) {
            this.parameters.merge(config.parameters);
        }
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

    asMap(): Immutable.Map<string, ParameterType> {
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

    getHeaders(): Headers {
        return new Headers({
           'Content-Type': 'application/x-www-form-urlencoded',
        });
    }
}
