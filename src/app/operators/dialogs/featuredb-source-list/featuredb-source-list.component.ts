import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {UserService} from '../../../users/user.service';
import {Operator} from '../../operator.model';
import {LayerService} from '../../../layers/layer.service';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AbstractVectorSymbology, ClusteredPointSymbology, SimpleVectorSymbology} from '../../../../symbology/symbology.model';
import {RandomColorService} from '../../../../services/random-color.service';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {Subject, ReplaySubject} from 'rxjs/Rx';
import {CsvDialogComponent} from '../csv/csv-dialog/csv-dialog.component';
import {MdDialog} from '@angular/material';

@Component({
    selector: 'wave-featuredb-source-list',
    templateUrl: './featuredb-source-list.component.html',
    styleUrls: ['./featuredb-source-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedbSourceListComponent implements OnInit {

    entries$: Subject<Array<{name: string, operator: Operator}>> = new ReplaySubject(1);

    constructor(private userService: UserService,
                private layerService: LayerService,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                public dialog: MdDialog) {
    }

    ngOnInit() {
        this.refresh();
    }

    refresh() {
        this.userService.getFeatureDBList()
            .map(entries => entries.sort())
            .subscribe(entries => this.entries$.next(entries));
    }

    openCSVDialog() {
        this.dialog.open(CsvDialogComponent)
            .afterClosed()
            .first()
            .subscribe(() => this.refresh());
    }

    add(entry: {name: string, operator: Operator}) {
        const color = this.randomColorService.getRandomColor();
        let symbology: AbstractVectorSymbology;
        let clustered: boolean;

        if (entry.operator.resultType === ResultTypes.POINTS) {
            symbology = new ClusteredPointSymbology({
                fillRGBA: color,
            });
            clustered = true;
        } else {
            symbology = new SimpleVectorSymbology({
                fillRGBA: color,
            });
            clustered = false;
        }

        const layer = new VectorLayer({
            name: entry.name,
            operator: entry.operator,
            symbology: symbology,
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator: entry.operator,
                clustered: clustered,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(entry.operator),
            clustered: clustered,
        });
        this.layerService.addLayer(layer);
    }

}
