import {Pipe, PipeTransform, Injectable} from '@angular/core';

import {MappingSource} from '../../operators/dialogs/raster-repository/mapping-source.model';

@Pipe({
    name: 'waveMappingDataSourceFilter',
})
@Injectable()
export class MappingDataSourceFilter implements PipeTransform {
    transform(items: Array<MappingSource>, term: string): Array<MappingSource> {
        if (!items) {
            return [];
        }

        let resultSources: Array<MappingSource> = [];
        for (let source of items) {
            if (source.name && source.name.toLowerCase().indexOf(term.toLowerCase()) >= 0) {
              resultSources.push(source);
            } else {
              let resultChannels = source.channels.filter(
                  c => c.name.toLowerCase().indexOf(term.toLowerCase()) >= 0
              );
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
