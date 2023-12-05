import {Component, Input, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {RasterSymbology, SingleBandRasterColorizer} from '../symbology.model';
import {Layer, RasterLayer} from '../../layer.model';
import {MapService} from '../../../map/map.service';
import {ProjectService} from '../../../project/project.service';
import {Config} from '../../../config.service';
import {BackendService} from '../../../backend/backend.service';
import {
    Colorizer,
    ColorizerType,
    LinearGradient,
    LogarithmicGradient,
    PaletteColorizer,
    RgbaColorizer,
} from '../../../colors/colorizer.model';
import {UserService} from '../../../users/user.service';
import {Color, TRANSPARENT, WHITE} from '../../../colors/color';
import {LayoutService} from '../../../layout.service';
import {ColorBreakpoint} from '../../../colors/color-breakpoint.model';
import {BehaviorSubject, map} from 'rxjs';
import {RasterBandDescriptor} from '../../../datasets/dataset.model';
import {RasterResultDescriptorDict} from '../../../backend/backend.model';

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-raster-symbology-editor',
    templateUrl: 'raster-symbology-editor.component.html',
    styleUrls: ['raster-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterSymbologyEditorComponent implements OnInit {
    @Input() layer!: RasterLayer;

    symbology!: RasterSymbology;

    readonly linearGradientColorizerType = LinearGradient.TYPE_NAME;
    readonly logarithmicGradientColorizerType = LogarithmicGradient.TYPE_NAME;
    readonly paletteColorizerType = PaletteColorizer.TYPE_NAME;
    readonly rgbaColorizerType = RgbaColorizer.TYPE_NAME;
    readonly loading$ = new BehaviorSubject<boolean>(false);

    readonly bands$ = new BehaviorSubject<Array<RasterBandDescriptor>>([]);
    selectedBand?: RasterBandDescriptor;

    unappliedChanges = new BehaviorSubject(false);
    unchangedSymbology = this.unappliedChanges.pipe(map((unapplied) => !unapplied));

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly backend: BackendService,
        protected readonly layoutService: LayoutService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
        protected readonly config: Config,
    ) {}

    ngOnInit(): void {
        // always work on a copy in order to being able to reset changes
        this.symbology = this.layer.symbology.clone();

        const bandIndex = (this.symbology.rasterColorizer as SingleBandRasterColorizer).band;

        this.projectService.getWorkflowMetaData(this.layer.workflowId).subscribe((resultDescriptor) => {
            if (resultDescriptor.type === 'raster') {
                const rd = resultDescriptor as RasterResultDescriptorDict;
                const bands = rd.bands.map((band) => RasterBandDescriptor.fromDict(band));

                this.bands$.next(bands);
                this.selectedBand = bands[bandIndex];
            }
        });
    }

    /**
     * Get the opacity in the range [0, 100]
     */
    getOpacity(): number {
        return this.symbology.opacity * 100;
    }

    /**
     * Set the opacity value from a slider change event
     */
    updateOpacity(value: number): void {
        const opacity = value / 100;

        this.symbology = this.symbology.cloneWith({opacity});

        this.unappliedChanges.next(true);
    }

    updateColorizer(colorizer: Colorizer): void {
        const rasterColorizer = new SingleBandRasterColorizer(this.getSelectedBandIndex(), colorizer);

        this.symbology = this.symbology.cloneWith({colorizer: rasterColorizer});

        this.unappliedChanges.next(true);
    }

    applyChanges(): void {
        this.unappliedChanges.next(false);
        this.projectService.changeLayer(this.layer, {symbology: this.symbology});

        // TODO: get layer with updated symbology
    }

    resetChanges(layer: Layer): void {
        this.layoutService.setSidenavContentComponent({
            component: RasterSymbologyEditorComponent,
            config: {layer},
        });
    }

    getColorizerType(): ColorizerType {
        const colorizer = this.getActualColorizer();

        if (colorizer instanceof LinearGradient) {
            return LinearGradient.TYPE_NAME;
        }

        if (colorizer instanceof PaletteColorizer) {
            return PaletteColorizer.TYPE_NAME;
        }

        if (colorizer instanceof LogarithmicGradient) {
            return LogarithmicGradient.TYPE_NAME;
        }

        if (colorizer instanceof RgbaColorizer) {
            return RgbaColorizer.TYPE_NAME;
        }

        throw Error('unknown colorizer type');
    }

    setSelectedBand(band: RasterBandDescriptor): void {
        this.selectedBand = band;
        if (this.symbology.rasterColorizer instanceof SingleBandRasterColorizer) {
            const index = this.getSelectedBandIndex();
            this.symbology = new RasterSymbology(
                this.getOpacity(),
                new SingleBandRasterColorizer(index, this.symbology.rasterColorizer.bandColorizer),
            );
        }
    }

    get paletteColorizer(): PaletteColorizer | undefined {
        const colorizer = this.getActualColorizer();

        if (colorizer instanceof PaletteColorizer) {
            return colorizer;
        }
        return undefined;
    }

    get gradientColorizer(): LinearGradient | LogarithmicGradient | undefined {
        const colorizer = this.getActualColorizer();

        if (colorizer instanceof LinearGradient || colorizer instanceof LogarithmicGradient) {
            return colorizer;
        }
        return undefined;
    }

    /**
     * Conversion between different colorizer types
     */
    updateColorizerType(colorizerType: ColorizerType): void {
        if (colorizerType === this.getColorizerType()) {
            return;
        }

        let colorizer = this.getActualColorizer();

        switch (colorizerType) {
            case 'linearGradient':
                colorizer = this.createGradientColorizer(
                    (breakpoints: Array<ColorBreakpoint>, noDataColor: Color, overColor: Color, underColor: Color) =>
                        new LinearGradient(breakpoints, noDataColor, overColor, underColor),
                );
                break;
            case 'logarithmicGradient':
                colorizer = this.createGradientColorizer(
                    (breakpoints: Array<ColorBreakpoint>, noDataColor: Color, overColor: Color, underColor: Color) =>
                        new LogarithmicGradient(breakpoints, noDataColor, overColor, underColor),
                );
                break;
            case 'palette':
                colorizer = this.createPaletteColorizer();
                break;
            case 'rgba':
                colorizer = new RgbaColorizer();
        }

        const rasterColorizer = new SingleBandRasterColorizer(this.getSelectedBandIndex(), colorizer);

        this.symbology = this.symbology.cloneWith({colorizer: rasterColorizer});
        this.unappliedChanges.next(true);
    }

    protected getSelectedBandIndex(): number {
        if (this.selectedBand) {
            return this.bands$.value.indexOf(this.selectedBand);
        }

        return 0;
    }

    protected getActualColorizer(): Colorizer {
        if (!(this.symbology.rasterColorizer instanceof SingleBandRasterColorizer)) {
            throw Error('Symbology editor only supports single band raster colorizers');
        }

        return this.symbology.rasterColorizer.bandColorizer;
    }

    protected createGradientColorizer<G>(
        constructorFn: (breakpoints: Array<ColorBreakpoint>, noDataColor: Color, overColor: Color, underColor: Color) => G,
    ): G {
        const colorizer = this.getActualColorizer();

        if (colorizer instanceof RgbaColorizer) {
            // TODO: derive some reasonable default values
            return constructorFn([new ColorBreakpoint(0, WHITE)], TRANSPARENT, TRANSPARENT, TRANSPARENT);
        }

        const breakpoints = colorizer.getBreakpoints();
        let noDataColor: Color;
        let overColor: Color;
        let underColor: Color;

        if (colorizer instanceof LogarithmicGradient || colorizer instanceof LinearGradient) {
            noDataColor = colorizer.noDataColor;
            overColor = colorizer.overColor;
            underColor = colorizer.underColor;
        } else if (colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const paletteColorizer = colorizer as PaletteColorizer;
            const defaultColor: Color = paletteColorizer.defaultColor ? paletteColorizer.defaultColor : TRANSPARENT;

            noDataColor = paletteColorizer.noDataColor ? paletteColorizer.noDataColor : TRANSPARENT;
            overColor = defaultColor;
            underColor = defaultColor;
        } else {
            throw Error('unknown colorizer type');
        }

        return constructorFn(breakpoints, noDataColor, overColor, underColor);
    }

    protected createPaletteColorizer(): PaletteColorizer {
        const colorizer = this.getActualColorizer();

        if (colorizer instanceof RgbaColorizer) {
            // TODO: derive some reasonable default values
            return new PaletteColorizer(new Map([[0, WHITE]]), TRANSPARENT, TRANSPARENT);
        }

        const breakpoints = colorizer.getBreakpoints();
        let noDataColor: Color;
        let defaultColor: Color;

        if (colorizer instanceof LogarithmicGradient || colorizer instanceof LinearGradient) {
            noDataColor = colorizer.noDataColor;

            // we can neither use the over nor the under color
            defaultColor = TRANSPARENT;
        } else if (colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const paletteColorizer = colorizer as PaletteColorizer;

            noDataColor = paletteColorizer.noDataColor ? paletteColorizer.noDataColor : TRANSPARENT;
            defaultColor = paletteColorizer.defaultColor ? paletteColorizer.defaultColor : TRANSPARENT;
        } else {
            throw Error('unknown colorizer type');
        }

        return new PaletteColorizer(this.createColorMap(breakpoints), noDataColor, defaultColor);
    }

    protected createColorMap(breakpoints: Array<ColorBreakpoint>): Map<number, Color> {
        const colorMap = new Map<number, Color>();
        breakpoints.forEach((bp, _index) => {
            colorMap.set(bp.value, bp.color);
        });
        return colorMap;
    }
}
