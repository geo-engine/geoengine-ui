import {Pipe, PipeTransform, Injectable} from "angular2/core";

import {MappingSource} from "../mapping-source.model";

@Pipe({
    name: "mappingDataSourceFilter",
})
@Injectable()
export class MappingDataSourceFilter implements PipeTransform {
    transform(items: Array<MappingSource>, [term]: [string]): Array<MappingSource> {
        return items.filter(item => item.name.toLowerCase().indexOf(term.toLowerCase()) >= 0);
    }
}
