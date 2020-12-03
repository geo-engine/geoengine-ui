import {Pipe, PipeTransform, Injectable} from '@angular/core';

import {MappingSource} from '../../operators/dialogs/data-repository/mapping-source.model';

@Pipe({
    name: 'waveMappingDataSourceFilter',
})
@Injectable()
export class MappingDataSourceFilter implements PipeTransform {
    transform(items: Array<MappingSource>, term: string): Array<MappingSource> {
        if (!items) {
            return [];
        }

        const resultSources: Array<MappingSource> = [];
        for (const source of items) {
            if (source.name && source.name.toLowerCase().indexOf(term.toLowerCase()) >= 0) {
              resultSources.push(source);
            } else {
              const resultChannels = source.rasterLayer.filter(
                  c => c.name.toLowerCase().indexOf(term.toLowerCase()) >= 0
              );
              if (resultChannels.length > 0) {
                const s = Object.assign({}, source);
                s.rasterLayer = resultChannels;
                resultSources.push(s);
              }
            }
        }
        return resultSources;
    }
}
