import {LayoutService, Config} from 'wave-core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

/**
 * A service that keeps track of app layouting options.
 */
@Injectable()
export class DttLayoutService extends LayoutService {

    constructor(protected config: Config) {
        super(config);
    }

    getMapHeightStream(totalAvailableHeight$: Observable<number>): Observable<number> {
        return totalAvailableHeight$;
    }

}
