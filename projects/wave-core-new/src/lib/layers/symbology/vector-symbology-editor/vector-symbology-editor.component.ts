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
import {ReplaySubject} from 'rxjs';
import {first} from 'rxjs/operators';

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

    numericAttributes = new ReplaySubject<Array<string>>(1);

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer && this.layer) {
            this.projectService
                .getVectorLayerMetadata(this.layer)
                .pipe(first())
                .subscribe((metadata) => {
                    const numericColumnNames: Array<string> = metadata.columns
                        .filter((column) => column.isNumeric)
                        .keySeq()
                        .toArray();
                    this.numericAttributes.next(numericColumnNames);
                });
        }
    }

    ngOnInit(): void {
        this.symbology = this.layer.symbology.clone();

        this.showFillColorEditor = this.symbology instanceof PointSymbology || this.symbology instanceof PolygonSymbology;
        this.showRadiusEditor = this.symbology instanceof PointSymbology;

        this.projectService
            .getVectorLayerMetadata(this.layer)
            .pipe(first())
            .subscribe((metadata) => {
                const numericColumnNames: Array<string> = metadata.columns
                    .filter((column) => column.isNumeric)
                    .keySeq()
                    .toArray();
                this.numericAttributes.next(numericColumnNames);
            });
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
    }

    get strokeColor(): ColorParam {
        if (this.symbology instanceof PointSymbology) {
            return this.symbology.stroke.color;
        } else if (this.symbology instanceof PolygonSymbology) {
            return this.symbology.stroke.color;
        } else if (this.symbology instanceof LineSymbology) {
            return this.symbology.stroke.color;
        } else {
            throw Error('This symbology has no fill color');
        }
    }

    set strokeColor(strokeColor: ColorParam) {
        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else {
            throw Error('This symbology has no fill color');
        }
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

        this.projectService.changeLayer(this.layer, {
            symbology: this.symbology,
        });
    }

    updateLineSymbology(params: {stroke?: Stroke; text?: TextSymbology}): void {
        if (!(this.symbology instanceof LineSymbology)) {
            return;
        }

        this.symbology = new LineSymbology(params.stroke ?? this.symbology.stroke, params.text ?? this.symbology.text);

        this.projectService.changeLayer(this.layer, {
            symbology: this.symbology,
        });
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

        this.projectService.changeLayer(this.layer, {
            symbology: this.symbology,
        });
    }
}
