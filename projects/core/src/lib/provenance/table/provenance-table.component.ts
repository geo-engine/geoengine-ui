import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {ProjectService} from '../../project/project.service';
import {ProvenanceDict} from '../../backend/backend.model';
import {Layer} from '@geoengine/common';
import {LayoutService} from '../../layout.service';

@Component({
    selector: 'geoengine-provenance-table',
    templateUrl: './provenance-table.component.html',
    styleUrls: ['./provenance-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvenanceTableComponent implements OnInit, OnChanges {
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    @Input() layer?: Layer;

    displayedColumns: Array<string> = ['citation', 'license', 'uri'];

    dataSource: Array<ProvenanceDict> = [];

    loading: boolean = true;

    readonly loadingSpinnerDiameterPx: number = 3 * LayoutService.remInPx;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly hostElement: ElementRef<HTMLElement>,
        protected readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        if (this.layer) {
            this.selectLayer(this.layer);
        } else {
            this.dataSource = [];
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            if (this.layer) {
                this.selectLayer(this.layer);
            } else {
                this.dataSource = [];
            }
        }
    }

    selectLayer(layer: Layer): void {
        this.projectService.getWorkflowProvenance(layer.workflowId).subscribe((provenance) => {
            this.loading = false;

            const table = [];

            for (const item of provenance) {
                table.push({
                    citation: item.provenance.citation,
                    license: item.provenance.license,
                    uri: item.provenance.uri,
                });
            }

            this.dataSource = table;
            this.changeDetectorRef.markForCheck();
        });
    }
}
