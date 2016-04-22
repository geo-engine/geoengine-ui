import {Pipe, PipeTransform, Injectable} from "angular2/core";

import {MappingSource, MappingSourceChannel} from "../models/mapping-source.model";

@Pipe({
    name: "mappingDataSourceFilter",
})
@Injectable()
export class MappingDataSourceFilter implements PipeTransform {
    transform(items: Array<MappingSource>, [term]: [string]): Array<MappingSource> {
        let resultSources: Array<MappingSource> = [];
        for (let source of items) {
            if (source.name.toLowerCase().indexOf(term.toLowerCase()) >= 0) {
              resultSources.push(source);
            }
            else {
              let resultChannels: Array<MappingSourceChannel> = source.channels.filter(c => c.name.toLowerCase().indexOf(term.toLowerCase()) >= 0);
              if (resultChannels.length > 0) {
                let s = Object.assign({}, source);
                s.channels = resultChannels;
                resultSources.push(s);
              }
            }
        }
        return resultSources;
    }
}
