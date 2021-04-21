import {Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, OnInit} from '@angular/core';
import {
    ColorParam,
    LineSymbology,
    NumberParam,
    PointSymbology,
    PolygonSymbology,
    Stroke,
    TextSymbology,
    VectorSymbology,
} from '../symbology.model';
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

    get fillColor(): ColorParam {
        if (this.symbology instanceof PointSymbology) {
            return this.symbology.fillColor;
        } else if (this.symbology instanceof PolygonSymbology) {
            return this.symbology.fillColor;
        } else {
            throw Error('This symbology has no fill color');
        }
    }

    set fillColor(fillColor: ColorParam) {
        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({fillColor});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({fillColor});
        } else {
            throw Error('This symbology has no fill color');
        }

        this.projectService.changeLayer(this.layer, {
            symbology: this.symbology,
        });
    }

    updatePointSymbology(params: {radius?: NumberParam; fillColor?: ColorParam; stroke?: Stroke; text?: TextSymbology}): void {
        if (!(this.symbology instanceof PointSymbology)) {
            return;
        }

        this.symbology = new PointSymbology(
            params.radius ?? this.symbology.radius,
            params.fillColor ?? this.symbology.fillColor,
            params.stroke ?? this.symbology.stroke,
            params.text ?? this.symbology.text,
        );
    }

    updateLineSymbology(params: {stroke?: Stroke; text?: TextSymbology}): void {
        if (!(this.symbology instanceof LineSymbology)) {
            return;
        }

        this.symbology = new LineSymbology(params.stroke ?? this.symbology.stroke, params.text ?? this.symbology.text);
    }

    updatePolygonSymbology(params: {fillColor?: ColorParam; stroke?: Stroke; text?: TextSymbology}): void {
        if (!(this.symbology instanceof PolygonSymbology)) {
            return;
        }

        this.symbology = new PolygonSymbology(
            params.fillColor ?? this.symbology.fillColor,
            params.stroke ?? this.symbology.stroke,
            params.text ?? this.symbology.text,
        );
    }
}
