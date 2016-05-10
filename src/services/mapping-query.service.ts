import {Injectable} from "angular2/core";
import {Http, Response} from "angular2/http";
import {Observable} from "rxjs/Rx";

import moment from "moment";

import {Operator} from "../models/operator.model";

import Config from "../models/config.model";
import {PlotData} from "../models/plot.model";

@Injectable()
export class MappingQueryService {
    constructor(private http: Http) {}

    getPlotQueryUrl(operator: Operator, time: moment.Moment): string {
        const parameters: {[index: string]: string | number | boolean} = {
            service: "plot",
            query: operator.toQueryJSON(),
            time: time.toISOString(),
        };
        return Config.MAPPING_URL + "?" +
               Object.keys(parameters).map(key => key + "=" + parameters[key]).join("&");
    }

    getPlotData(operator: Operator, time: moment.Moment): Promise<PlotData> {
        return this.http.get(this.getPlotQueryUrl(operator, time)).toPromise().then(r => r.json());
    }

    getPlotDataStream(operator: Operator, time$: Observable<moment.Moment>): Observable<PlotData> {
        // TODO: remove  `fromPromise` when new rxjs version is used
        // TODO: use flatMapLatest
        return time$.flatMap(time => Observable.fromPromise(this.getPlotData(operator, time)));
    }
}
