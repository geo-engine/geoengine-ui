import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {UserService} from '../../../users/user.service';
import {Operator} from '../../operator.model';
import {LayerService} from '../../../layers/layer.service';
import {VectorLayer} from '../../../layers/layer.model';
import {ResultTypes} from '../../result-type.model';
import {AbstractVectorSymbology, ClusteredPointSymbology, SimpleVectorSymbology} from '../../../layers/symbology/symbology.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {Subject, ReplaySubject, BehaviorSubject, Observable} from 'rxjs/Rx';
import {CsvDialogComponent} from '../csv/csv-dialog/csv-dialog.component';
import {MdDialog} from '@angular/material';

function nameComparator(a: string, b: string): number {
    const stripped = (s: string): string => s.replace(' ', '');

    return stripped(a).localeCompare(stripped(b));
}

@Component({
    selector: 'wave-featuredb-source-list',
    templateUrl: './featuredb-source-list.component.html',
    styleUrls: ['./featuredb-source-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedbSourceListComponent implements OnInit {

    searchString$ = new BehaviorSubject<string>('');
    entries$ = new ReplaySubject<Array<{name: string, operator: Operator}>>(1);
    filteredEntries$: Observable<Array<{name: string, operator: Operator}>>;

    constructor(private userService: UserService,
                private layerService: LayerService,
                private randomColorService: RandomColorService,
                private mappingQueryService: MappingQueryService,
                public dialog: MdDialog) {
    }

    ngOnInit() {
        this.refresh();

        this.filteredEntries$ = Observable
            .combineLatest(
                this.entries$,
                this.searchString$,
                (entries, searchString) => entries
                    .filter(entry => entry.name.indexOf(searchString) >= 0)
                    .sort((a, b) => nameComparator(a.name, b.name))
            );
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
