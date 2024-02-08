import {Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, OnInit} from '@angular/core';
import {
    ClusteredPointSymbology,
    ColorParam,
    LineSymbology,
    NumberParam,
    PointSymbology,
    PolygonSymbology,
    StaticColor,
    StaticNumber,
    Stroke,
    SymbologyType,
    TextSymbology,
    VectorSymbology,
} from '../symbology.model';
// import {VectorLayer} from '../../layer.model';
// import {MapService} from '../../../map/map.service';
// import {ProjectService} from '../../../project/project.service';
// import {Config} from '../../../config.service';
// import {BackendService} from '../../../backend/backend.service';
// import {UserService} from '../../../users/user.service';
import {ReplaySubject} from 'rxjs';
import {first} from 'rxjs/operators';
import {BLACK, WHITE} from '../../colors/color';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-vector-symbology-editor',
    templateUrl: 'vector-symbology-editor.component.html',
    styleUrls: ['vector-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorSymbologyEditorComponent implements OnChanges, OnInit {
    // @Input() layer!: VectorLayer;

    symbology!: VectorSymbology;

    showFillColorEditor = false;
    showRadiusEditor = false;

    numericAttributes = new ReplaySubject<Array<string>>(1);
    allAttributes = new ReplaySubject<Array<string>>(1);

    constructor() // protected readonly backend: BackendService, // protected readonly projectService: ProjectService,
    // protected readonly userService: UserService,
    // protected readonly mapService: MapService,
    // protected readonly config: Config,
    {}

    ngOnChanges(changes: SimpleChanges): void {
        // if (changes.layer && this.layer) {
        //     this.symbology = this.layer.symbology.clone();
        //     this.showFillColorEditor =
        //         this.symbology instanceof PointSymbology ||
        //         this.symbology instanceof ClusteredPointSymbology ||
        //         this.symbology instanceof PolygonSymbology;
        //     this.showRadiusEditor = this.symbology instanceof PointSymbology;
        //     this.initializeAttributes();
        // }
    }

    ngOnInit(): void {
        // this.symbology = this.layer.symbology.clone();
        // this.showFillColorEditor =
        //     this.symbology instanceof PointSymbology ||
        //     this.symbology instanceof ClusteredPointSymbology ||
        //     this.symbology instanceof PolygonSymbology;
        // this.showRadiusEditor = this.symbology instanceof PointSymbology;
        // this.initializeAttributes();
    }

    get isPointLayer(): boolean {
        return this.symbology.symbologyType === SymbologyType.POINT;
    }

    get isClustered(): boolean {
        return this.symbology instanceof ClusteredPointSymbology;
    }

    get isLineLayer(): boolean {
        return this.symbology.symbologyType === SymbologyType.LINE;
    }

    get isPolygonLayer(): boolean {
        return this.symbology.symbologyType === SymbologyType.POLYGON;
    }

    setClusterSymbology(clustered: boolean): void {
        if (clustered && this.symbology instanceof PointSymbology) {
            this.symbology = new ClusteredPointSymbology(this.symbology.fillColor, this.symbology.stroke);
            this.showRadiusEditor = false;
            this.updateClusteredPointSymbology({});
        } else if (!clustered && this.symbology instanceof ClusteredPointSymbology) {
            this.symbology = new PointSymbology(
                new StaticNumber(PointSymbology.DEFAULT_POINT_RADIUS),
                this.symbology.fillColor,
                this.symbology.stroke,
            );
            this.showRadiusEditor = true;
            this.updatePointSymbology({});
        } else {
            // should not be called
        }
    }

    get fillColor(): ColorParam {
        if (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof ClusteredPointSymbology ||
            this.symbology instanceof PolygonSymbology
        ) {
            return this.symbology.fillColor;
        } else {
            throw Error('This symbology has no fill color');
        }
    }

    set fillColor(fillColor: ColorParam) {
        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({fillColor});
        } else if (this.symbology instanceof ClusteredPointSymbology) {
            this.updateClusteredPointSymbology({fillColor});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({fillColor});
        } else {
            throw Error('This symbology has no fill color');
        }
    }

    get strokeColor(): ColorParam {
        if (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof ClusteredPointSymbology ||
            this.symbology instanceof PolygonSymbology ||
            this.symbology instanceof LineSymbology
        ) {
            return this.symbology.stroke.color;
        } else {
            throw Error('This symbology has no stroke');
        }
    }

    set strokeColor(strokeColor: ColorParam) {
        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else if (this.symbology instanceof ClusteredPointSymbology) {
            this.updateClusteredPointSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({stroke: new Stroke(this.symbology.stroke.width, strokeColor)});
        } else {
            throw Error('This symbology has no stroke');
        }
    }

    get strokeWidth(): NumberParam {
        if (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof ClusteredPointSymbology ||
            this.symbology instanceof PolygonSymbology ||
            this.symbology instanceof LineSymbology
        ) {
            return this.symbology.stroke.width;
        } else {
            throw Error('This symbology has no stroke');
        }
    }

    set strokeWidth(strokeWidth: NumberParam) {
        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({stroke: new Stroke(strokeWidth, this.symbology.stroke.color)});
        } else if (this.symbology instanceof ClusteredPointSymbology) {
            this.updateClusteredPointSymbology({stroke: new Stroke(strokeWidth, this.symbology.stroke.color)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({stroke: new Stroke(strokeWidth, this.symbology.stroke.color)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({stroke: new Stroke(strokeWidth, this.symbology.stroke.color)});
        } else {
            throw Error('This symbology has no stroke');
        }
    }

    get radius(): NumberParam {
        if (this.symbology instanceof PointSymbology || this.symbology instanceof ClusteredPointSymbology) {
            return this.symbology.radius;
        } else {
            throw Error('This symbology has no radius');
        }
    }

    set radius(radius: NumberParam) {
        if (this.symbology instanceof PointSymbology || this.symbology instanceof ClusteredPointSymbology) {
            this.updatePointSymbology({radius});
        } else {
            throw Error('This symbology has no radius');
        }
    }

    get supportsText(): boolean {
        return (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof LineSymbology ||
            this.symbology instanceof PolygonSymbology
        );
    }

    get hasText(): boolean {
        if (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof LineSymbology ||
            this.symbology instanceof PolygonSymbology
        ) {
            return !!this.symbology.text;
        } else {
            // This symbology has no text
            return false;
        }
    }

    get textFillColor(): ColorParam {
        let textSymbology: TextSymbology | undefined;

        if (
            this.symbology instanceof PointSymbology ||
            this.symbology instanceof ClusteredPointSymbology ||
            this.symbology instanceof LineSymbology ||
            this.symbology instanceof PolygonSymbology
        ) {
            textSymbology = this.symbology.text;
        } else {
            throw Error('This symbology has no text');
        }

        if (!textSymbology) {
            throw Error('TextSymbology is undefined');
        }

        return textSymbology.fillColor;
    }

    set textFillColor(fillColor: ColorParam) {
        const generateTextSymbology = (textSymbology?: TextSymbology): TextSymbology | undefined => {
            if (!textSymbology) {
                return undefined;
            }

            return new TextSymbology(textSymbology.attribute, fillColor, textSymbology.stroke);
        };

        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({text: generateTextSymbology(this.symbology.text)});
        } else {
            throw Error('This symbology has no text');
        }
    }

    get textStrokeColor(): ColorParam {
        let textSymbology: TextSymbology | undefined;

        if (this.symbology instanceof PointSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof LineSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof PolygonSymbology) {
            textSymbology = this.symbology.text;
        } else {
            throw Error('This symbology has no text');
        }

        if (!textSymbology) {
            throw Error('TextSymbology is undefined');
        }

        return textSymbology.stroke.color;
    }

    set textStrokeColor(strokeColor: ColorParam) {
        const generateTextSymbology = (textSymbology?: TextSymbology): TextSymbology | undefined => {
            if (!textSymbology) {
                return undefined;
            }

            return new TextSymbology(textSymbology.attribute, textSymbology.fillColor, new Stroke(textSymbology.stroke.width, strokeColor));
        };

        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({text: generateTextSymbology(this.symbology.text)});
        } else {
            throw Error('This symbology has no text');
        }
    }

    get textStrokeWidth(): NumberParam {
        let textSymbology: TextSymbology | undefined;

        if (this.symbology instanceof PointSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof LineSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof PolygonSymbology) {
            textSymbology = this.symbology.text;
        } else {
            throw Error('This symbology has no text');
        }

        if (!textSymbology) {
            throw Error('TextSymbology is undefined');
        }

        return textSymbology.stroke.width;
    }

    set textStrokeWidth(strokeWidth: NumberParam) {
        const generateTextSymbology = (textSymbology?: TextSymbology): TextSymbology | undefined => {
            if (!textSymbology) {
                return undefined;
            }

            return new TextSymbology(textSymbology.attribute, textSymbology.fillColor, new Stroke(strokeWidth, textSymbology.stroke.color));
        };

        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({text: generateTextSymbology(this.symbology.text)});
        } else {
            throw Error('This symbology has no text');
        }
    }

    get textAttribute(): string | undefined {
        let textSymbology: TextSymbology | undefined;

        if (this.symbology instanceof PointSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof LineSymbology) {
            textSymbology = this.symbology.text;
        } else if (this.symbology instanceof PolygonSymbology) {
            textSymbology = this.symbology.text;
        } else {
            throw Error('This symbology has no text');
        }

        if (!textSymbology) {
            return undefined;
        }

        return textSymbology.attribute;
    }

    set textAttribute(attribute: string | undefined) {
        const generateTextSymbology = (textSymbology?: TextSymbology): TextSymbology | null => {
            if (!attribute) {
                return null;
            }

            if (!textSymbology) {
                // generate default
                return new TextSymbology(attribute, new StaticColor(WHITE), new Stroke(new StaticNumber(1), new StaticColor(BLACK)));
            }

            return new TextSymbology(attribute, textSymbology.fillColor, textSymbology.stroke);
        };

        if (this.symbology instanceof PointSymbology) {
            this.updatePointSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof PolygonSymbology) {
            this.updatePolygonSymbology({text: generateTextSymbology(this.symbology.text)});
        } else if (this.symbology instanceof LineSymbology) {
            this.updateLineSymbology({text: generateTextSymbology(this.symbology.text)});
        } else {
            throw Error('This symbology has no text');
        }
    }

    get isAutoSimplified(): boolean {
        if (!(this.symbology instanceof LineSymbology || this.symbology instanceof PolygonSymbology)) {
            return false;
        }

        return this.symbology.autoSimplified;
    }

    updatePointSymbology(params: {radius?: NumberParam; fillColor?: ColorParam; stroke?: Stroke; text?: TextSymbology | null}): void {
        if (!(this.symbology instanceof PointSymbology)) {
            return;
        }

        // unsetting with null
        const text = params.text === null ? undefined : params.text ?? this.symbology.text;

        this.symbology = new PointSymbology(
            params.radius ?? this.symbology.radius,
            params.fillColor ?? this.symbology.fillColor,
            params.stroke ?? this.symbology.stroke,
            text,
        );

        // this.projectService.changeLayer(this.layer, {
        //     symbology: this.symbology,
        // });
    }

    updateClusteredPointSymbology(params: {fillColor?: ColorParam; stroke?: Stroke}): void {
        if (!(this.symbology instanceof ClusteredPointSymbology)) {
            return;
        }

        this.symbology = new ClusteredPointSymbology(params.fillColor ?? this.symbology.fillColor, params.stroke ?? this.symbology.stroke);

        // this.projectService.changeLayer(this.layer, {
        //     symbology: this.symbology,
        // });
    }

    updateLineSymbology(params: {stroke?: Stroke; text?: TextSymbology | null; autoSimplified?: boolean}): void {
        if (!(this.symbology instanceof LineSymbology)) {
            return;
        }

        // unsetting with null
        const text = params.text === null ? undefined : params.text ?? this.symbology.text;

        this.symbology = new LineSymbology(
            params.stroke ?? this.symbology.stroke,
            text,
            params.autoSimplified ?? this.symbology.autoSimplified,
        );

        // this.projectService.changeLayer(this.layer, {
        //     symbology: this.symbology,
        // });
    }

    updatePolygonSymbology(params: {fillColor?: ColorParam; stroke?: Stroke; text?: TextSymbology | null; autoSimplified?: boolean}): void {
        if (!(this.symbology instanceof PolygonSymbology)) {
            return;
        }

        // unsetting with null
        const text = params.text === null ? undefined : params.text ?? this.symbology.text;

        this.symbology = new PolygonSymbology(
            params.fillColor ?? this.symbology.fillColor,
            params.stroke ?? this.symbology.stroke,
            text,
            params.autoSimplified ?? this.symbology.autoSimplified,
        );

        // this.projectService.changeLayer(this.layer, {
        //     symbology: this.symbology,
        // });
    }

    protected initializeAttributes(): void {
        // this.projectService
        //     .getVectorLayerMetadata(this.layer)
        //     .pipe(first())
        //     .subscribe((metadata) => {
        //         const allColumnNames: Array<string> = metadata.dataTypes.keySeq().toArray();
        //         const numericColumnNames: Array<string> = metadata.dataTypes
        //             .filter((column) => column.isNumeric)
        //             .keySeq()
        //             .toArray();
        //         this.numericAttributes.next(numericColumnNames);
        //         this.allAttributes.next(allColumnNames);
        //     });
    }
}
