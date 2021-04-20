import {Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, OnInit} from '@angular/core';
import {PointSymbology, PolygonSymbology, VectorSymbology} from '../symbology.model';
import {VectorLayer} from '../../layer.model';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Config} from '../../../config.service';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'wave-vector-symbology-editor',
    templateUrl: 'vector-symbology-editor.component.html',
    styleUrls: ['vector-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorSymbologyEditorComponent implements OnChanges, OnDestroy, AfterViewInit, OnInit {
    @Input() layer!: VectorLayer;

    symbology!: VectorSymbology;

    showFillColorEditor = false;
    showRadiusEditor = false;

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnChanges(_changes: SimpleChanges): void {}

    ngOnInit(): void {
        this.symbology = this.layer.symbology.clone();

        this.showFillColorEditor = this.symbology instanceof PointSymbology || this.symbology instanceof PolygonSymbology;
        this.showRadiusEditor = this.symbology instanceof PointSymbology;
    }

    ngAfterViewInit(): void {}

    ngOnDestroy(): void {}
}
