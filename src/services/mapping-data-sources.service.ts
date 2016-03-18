import {Injectable} from "angular2/core";
import {Http, Response} from "angular2/http";
import {Observable} from "rxjs/Rx";
import {MappingSource} from "../mapping-source.model";

@Injectable()
export class MappingDataSourcesService {

  constructor(private http: Http) { }

    getSources(): Observable<Array<MappingSource>> {
      return this.http.get("/assets/mapping-data-sources.json").map((res: Response) => res.json()).map((json: JSON) => {
        let arr: Array<MappingSource> = [];

        for (let source in json["sourcelist"]) {
          let details = json["sourcelist"][source];
          arr.push({
            source,
            name: details.name,
            channels: details.channels.map((value: any, index: number) => {
              value.id = index;
              return value;
            }),
            colorizer: details.colorizer,
            coords: details.coords});
        }

        return arr;
      });
    }

}
