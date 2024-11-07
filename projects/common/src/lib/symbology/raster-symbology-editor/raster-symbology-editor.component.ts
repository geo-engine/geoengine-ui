import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
    Output,
    EventEmitter,
    input,
    output,
    computed,
    signal,
    effect,
    untracked,
    inject,
} from '@angular/core';
import {RasterSymbology, SingleBandRasterColorizer, SymbologyQueryParams, SymbologyWorkflow} from '../symbology.model';
import {Colorizer, ColorizerType, LinearGradient, LogarithmicGradient, PaletteColorizer, RgbaColorizer} from '../../colors/colorizer.model';
import {Color, TRANSPARENT, WHITE} from '../../colors/color';
import {ColorBreakpoint} from '../../colors/color-breakpoint.model';
import {BehaviorSubject, Subscription, map} from 'rxjs';
import {
    BoundingBox2D,
    RasterBandDescriptor,
    TypedRasterResultDescriptor as RasterResultDescriptorDict,
    SpatialResolution,
} from '@geoengine/openapi-client';
import {WorkflowsService} from '../../workflows/workflows.service';

const FAUX_RASTER_SYMBOLOGY = new RasterSymbology(
    1.0,
    new SingleBandRasterColorizer(0, new LinearGradient([new ColorBreakpoint(0, WHITE)], TRANSPARENT, TRANSPARENT, TRANSPARENT)),
);

/**
 * An editor for generating raster symbologies.
 */
@Component({
    selector: 'geoengine-raster-symbology-editor',
    templateUrl: 'raster-symbology-editor.component.html',
    styleUrls: ['raster-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterSymbologyEditorComponent {
    private readonly workflowsService = inject(WorkflowsService);

    symbologyWorkflow = input.required<SymbologyWorkflow<RasterSymbology>>();
    queryParams = input<SymbologyQueryParams>();

    changedSymbology = output<RasterSymbology>();

    symbology = signal(FAUX_RASTER_SYMBOLOGY);

    readonly linearGradientColorizerType = LinearGradient.TYPE_NAME;
    readonly logarithmicGradientColorizerType = LogarithmicGradient.TYPE_NAME;
    readonly paletteColorizerType = PaletteColorizer.TYPE_NAME;
    readonly rgbaColorizerType = RgbaColorizer.TYPE_NAME;
    readonly loading$ = new BehaviorSubject<boolean>(false);

    readonly bands = signal<Array<RasterBandDescriptor>>([]);
    readonly selectedBand = signal<RasterBandDescriptor | undefined>(undefined);

    constructor() {
        effect(() => {
            this.symbologyWorkflow();
            untracked(() => {
                this.setUp();
            });
        });
    }

    /**
     * Get the opacity in the range [0, 100]
     */
    getOpacity(): number {
        return this.symbology().opacity * 100;
    }

    /**
     * Set the opacity value from a slider change event
     */
    updateOpacity(value: number): void {
        const opacity = value / 100;

        this.symbology.set(this.symbology().cloneWith({opacity}));

        this.changedSymbology.emit(this.symbology());
    }

    updateColorizer(colorizer: Colorizer): void {
        const rasterColorizer = new SingleBandRasterColorizer(this.getSelectedBandIndex(), colorizer);
        this.symbology.set(this.symbology().cloneWith({colorizer: rasterColorizer}));
        this.changedSymbology.emit(this.symbology());
    }

    resetChanges(): void {
        this.setUp();
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
        this.selectedBand.set(band);
        const symbology = this.symbology();
        if (symbology.rasterColorizer instanceof SingleBandRasterColorizer) {
            const index = this.getSelectedBandIndex();
            this.symbology.set(
                new RasterSymbology(this.getOpacity(), new SingleBandRasterColorizer(index, symbology.rasterColorizer.bandColorizer)),
            );
            // this.symbologyWorkflow = {symbology: this.symbology(), workflowId: this.symbologyWorkflow().workflowId};
            this.changedSymbology.emit(this.symbology());
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

        this.symbology.set(this.symbology().cloneWith({colorizer: rasterColorizer}));
        this.changedSymbology.emit(this.symbology());
    }

    private setUp() {
        this.symbology.set(this.symbologyWorkflow().symbology.clone());
        const bandIndex = (this.symbology().rasterColorizer as SingleBandRasterColorizer).band;
        this.workflowsService.getMetadata(this.symbologyWorkflow().workflowId).then((resultDescriptor) => {
            if (resultDescriptor.type === 'raster') {
                const rd = resultDescriptor as RasterResultDescriptorDict;
                this.bands.set(rd.bands);
                this.selectedBand.set(rd.bands[bandIndex]);
            }
        });
    }

    protected getSelectedBandIndex(): number {
        const selectedBand = this.selectedBand();
        if (selectedBand) {
            return this.bands().indexOf(selectedBand);
        }
        return 0;
    }

    protected getActualColorizer(): Colorizer {
        const symbology = this.symbology();
        if (!(symbology.rasterColorizer instanceof SingleBandRasterColorizer)) {
            throw Error('Symbology editor only supports single band raster colorizers');
        }

        return symbology.rasterColorizer.bandColorizer;
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
