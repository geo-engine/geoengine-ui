
import {of as observableOf, Observable} from 'rxjs';
import {switchAll, map} from 'rxjs/operators';

import {Component, ChangeDetectionStrategy, Pipe, PipeTransform, Input} from '@angular/core';
import {Provenance} from '../provenance.model';
import {LayerService} from '../../layers/layer.service';
import {ProjectService} from '../../project/project.service';

/**
 * Return either the value or a non-breaking space point if it is empty.
 */
@Pipe({name: 'waveNbsp'})
export class NbspPipe implements PipeTransform {
    transform(value: string): string {
        if (!value || value.length === 0) {
            return '&nbsp;';
        } else {
            return value;
        }
    }
}

@Component({
  selector: 'wave-provenance-list',
  templateUrl: './provenance-list.component.html',
  styleUrls: ['./provenance-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProvenanceListComponent {

    @Input() height: number;

    private provenance$: Observable<Iterable<Provenance>>;

    constructor(
        public layerService: LayerService,
        public projectService: ProjectService,
    ) {
        this.provenance$ = layerService.getSelectedLayerStream().pipe(map(l => {
            if (l) {
                return projectService.getLayerProvenanceDataStream(l);
            } else {
                return observableOf([]);
            }
        }), switchAll(), );
    }

}
