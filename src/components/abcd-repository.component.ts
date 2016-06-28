import {Component, ChangeDetectionStrategy} from '@angular/core';
import {CORE_DIRECTIVES} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';

import {LayerService} from '../layers/layer.service';
import {VectorLayer} from '../layers/layer.model';
import {Operator} from '../operators/operator.model';
import {ResultTypes} from '../operators/result-type.model';
import {DataType} from '../operators/datatype.model';
import {AbcdArchive} from '../models/abcd.model';
import {ABCDSourceType} from '../operators/types/abcd-source-type.model';
import {SimplePointSymbology} from '../symbology/symbology.model';
import {Projections} from '../operators/projection.model';
import {Unit} from '../operators/unit.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {GfbioService} from '../gfbio/gfbio.service';
import {ProjectService} from '../project/project.service';
import {RandomColorService} from '../services/random-color.service';

@Component({
    selector: 'wave-abcd-repository',
    template: `
    <div style="height:100%" layout="column">
    <md-content flex="grow">
      <md-list>
        <template
            ngFor let-archive
            [ngForOf]="archives | async"
        >
            <md-subheader>
                <span>{{archive.provider}}</span>
            </md-subheader>
            <md-divider></md-divider>
            <md-list-item md-clickable class="md-2-line">
              <div class="md-list-item-text"
                layout="column"
                (click)="add(archive)">
                <p>{{archive.dataset}}</p>
              </div>
          </md-list-item>
      </template>
      </md-list>
    </md-content>
    </div>
    `,
    styles: [`
    .searchInput {
        width: 100%;
    }
    md-list-item {
        cursor: pointer;
    }
    md-list >>> md-subheader {
        color: white;
        background-color: #009688;
        font-weight: bold;
    }
    img {
      padding: 5px 5px 5px 0px;
    }
    `],
    directives: [CORE_DIRECTIVES, MATERIAL_DIRECTIVES, MD_INPUT_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AbcdRepositoryComponent {

    private archives: Observable<Array<AbcdArchive>>;

    constructor(
        private mappingQueryService: MappingQueryService,
        private layerService: LayerService,
        private projectService: ProjectService,
        private gfbioService: GfbioService,
        private randomColorService: RandomColorService
    ) {
        this.archives = this.gfbioService.getAbcdArchivesStream();
    }

    add(archive: AbcdArchive) {

        const operator = new Operator({
            operatorType: new ABCDSourceType({
                provider: archive.provider,
                id: archive.file,
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });

        const layer = new VectorLayer<SimplePointSymbology>({
            name: archive.dataset,
            operator: operator,
            symbology: new SimplePointSymbology({
                fillRGBA: this.randomColorService.getRandomColor(),
            }),
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);
    }
}
