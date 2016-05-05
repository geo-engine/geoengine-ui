import {Injectable} from "angular2/core";
import {Http, Response} from "angular2/http";
import {Observable} from "rxjs/Rx";
import Config from "../config.model";
import {Operator} from "../models/operator.model";

export interface MappingColorizer {
    interpolation: string;
    breakpoints: Array<[number, string, string]>;
}

@Injectable()
export class MappingColorizerService {

    constructor(private http: Http) { }

    static requestType: string = "GetColorizer";

    static buildRequest(op: Operator): string {
        return Config.MAPPING_URL + "?" + "SERVICE=WMS" + "&" + "VERSION=" + Config.WMS.VERSION + "&" + "REQUEST=" + MappingColorizerService.requestType + "&" + "LAYERS=" + op.toQueryJSON() + "&" + "CRS=" + op.projection.getCode();
    }

    getColorizer(op: Operator): Promise<MappingColorizer> {
        let colorizerRequest = MappingColorizerService.buildRequest(op);
        console.log("colorizerRequest", colorizerRequest);
        return this.http.get(colorizerRequest).map((res: Response) => res.json()).map((json: JSON) => {
            return {
                interpolation: json["interpolation"],
                breakpoints: json["breakpoints"]
            };
        }).toPromise();
    }
}
