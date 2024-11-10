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
    Signal,
    WritableSignal,
} from '@angular/core';
import {
    MultiBandRasterColorizer,
    RasterSymbology,
    SingleBandRasterColorizer,
    SymbologyQueryParams,
    SymbologyWorkflow,
} from '../symbology.model';
import {Colorizer, ColorizerType, LinearGradient, LogarithmicGradient, PaletteColorizer} from '../../colors/colorizer.model';
import {BLACK, Color, TRANSPARENT, WHITE} from '../../colors/color';
import {ColorBreakpoint} from '../../colors/color-breakpoint.model';
import {BehaviorSubject, Subscription, map} from 'rxjs';
import {
    BoundingBox2D,
    RasterBandDescriptor,
    TypedRasterResultDescriptor as RasterResultDescriptorDict,
    SpatialResolution,
} from '@geoengine/openapi-client';
import {WorkflowsService} from '../../workflows/workflows.service';

type RasterSymbologyType = 'singleBand' | 'multiBand';

/**
 * A faux raster symbology to use as a default value.
 */
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
    readonly multiBandType = 'multiBand';
    readonly loading$ = new BehaviorSubject<boolean>(false);

    readonly bands = signal<Array<RasterBandDescriptor>>([]);
    readonly selectedBand = signal<RasterBandDescriptor | undefined>(undefined);
    readonly selectedBand2 = signal<RasterBandDescriptor | undefined>(undefined);
    readonly selectedBand3 = signal<RasterBandDescriptor | undefined>(undefined);

    readonly rasterSymbologyType = computed<RasterSymbologyType>(() => {
        const symbology = this.symbology();
        if (symbology.rasterColorizer instanceof SingleBandRasterColorizer) {
            return 'singleBand';
        }
        if (symbology.rasterColorizer instanceof MultiBandRasterColorizer) {
            return 'multiBand';
        }
        throw Error('unknown raster symbology type');
    });

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

    updateMultiBandColorizer(colorizer: MultiBandRasterColorizer): void {
        this.symbology.set(this.symbology().cloneWith({colorizer}));
        this.changedSymbology.emit(this.symbology());
    }

    resetChanges(): void {
        this.setUp();
    }

    getColorizerType(): ColorizerType | 'multiBand' {
        if (this.symbology().rasterColorizer instanceof MultiBandRasterColorizer) {
            return 'multiBand';
        }

        const colorizer = this.getSingleBandColorizer();

        if (colorizer instanceof LinearGradient) {
            return LinearGradient.TYPE_NAME;
        }

        if (colorizer instanceof PaletteColorizer) {
            return PaletteColorizer.TYPE_NAME;
        }

        if (colorizer instanceof LogarithmicGradient) {
            return LogarithmicGradient.TYPE_NAME;
        }

        throw Error('unknown colorizer type');
    }

    getSelectedBand(i: number): WritableSignal<RasterBandDescriptor | undefined> {
        switch (i) {
            case 0:
                return this.selectedBand;
            case 1:
                return this.selectedBand2;
            case 2:
                return this.selectedBand3;
            default:
                throw Error('unknown band index');
        }
    }

    setSelectedBand(band: RasterBandDescriptor, i = 0): void {
        this.getSelectedBand(i).set(band);
        const symbology = this.symbology();
        if (symbology.rasterColorizer instanceof SingleBandRasterColorizer) {
            const index = this.getSelectedBandIndex();
            this.symbology.set(
                new RasterSymbology(this.getOpacity(), new SingleBandRasterColorizer(index, symbology.rasterColorizer.bandColorizer)),
            );
            this.changedSymbology.emit(this.symbology());
        } else if (symbology.rasterColorizer instanceof MultiBandRasterColorizer) {
            this.symbology.set(
                new RasterSymbology(
                    this.getOpacity(),
                    symbology.rasterColorizer.withBands(
                        this.getSelectedBandIndex(0),
                        this.getSelectedBandIndex(1),
                        this.getSelectedBandIndex(2),
                    ),
                ),
            );
            this.changedSymbology.emit(this.symbology());
        }
    }

    get paletteColorizer(): PaletteColorizer | undefined {
        const colorizer = this.getSingleBandColorizer();

        if (colorizer instanceof PaletteColorizer) {
            return colorizer;
        }
        return undefined;
    }

    get gradientColorizer(): LinearGradient | LogarithmicGradient | undefined {
        const colorizer = this.getSingleBandColorizer();

        if (colorizer instanceof LinearGradient || colorizer instanceof LogarithmicGradient) {
            return colorizer;
        }
        return undefined;
    }

    get multibandColorizer(): MultiBandRasterColorizer | undefined {
        const colorizer = this.symbology().rasterColorizer;

        if (colorizer instanceof MultiBandRasterColorizer) {
            return colorizer;
        }
        return undefined;
    }

    /**
     * Conversion between different colorizer types
     */
    updateColorizerType(colorizerType: ColorizerType | 'multiBand'): void {
        if (colorizerType === this.getColorizerType()) {
            return;
        }

        let rasterColorizer: SingleBandRasterColorizer | MultiBandRasterColorizer;

        if (colorizerType === 'multiBand') {
            rasterColorizer = new MultiBandRasterColorizer(
                this.getSelectedBandIndex(0),
                this.getSelectedBandIndex(1),
                this.getSelectedBandIndex(2),
                0,
                255,
                1,
                0,
                255,
                1,
                0,
                255,
                1,
                TRANSPARENT,
            );
        } else {
            // single band

            let colorizer = this.getSingleBandColorizer();

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
            }

            rasterColorizer = new SingleBandRasterColorizer(this.getSelectedBandIndex(), colorizer);
        }

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

    updateRasterSymbologyType($event: any): void {
        throw new Error('Method not implemented.');
    }

    protected getSelectedBandIndex(i = 0): number {
        const selectedBand = this.getSelectedBand(i)();
        if (selectedBand) {
            return this.bands().indexOf(selectedBand);
        }
        return 0;
    }

    protected getSingleBandColorizer(): Colorizer | undefined {
        const symbology = this.symbology();
        if (!(symbology.rasterColorizer instanceof SingleBandRasterColorizer)) {
            return undefined;
        }

        return symbology.rasterColorizer.bandColorizer;
    }

    protected createGradientColorizer<G>(
        constructorFn: (breakpoints: Array<ColorBreakpoint>, noDataColor: Color, overColor: Color, underColor: Color) => G,
    ): G {
        const colorizer = this.getSingleBandColorizer();

        let breakpoints: Array<ColorBreakpoint>;
        let noDataColor: Color;
        let overColor: Color;
        let underColor: Color;

        if (colorizer instanceof LogarithmicGradient || colorizer instanceof LinearGradient) {
            breakpoints = colorizer.getBreakpoints();
            noDataColor = colorizer.noDataColor;
            overColor = colorizer.overColor;
            underColor = colorizer.underColor;
        } else if (colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const paletteColorizer = colorizer as PaletteColorizer;
            const defaultColor: Color = paletteColorizer.defaultColor ? paletteColorizer.defaultColor : TRANSPARENT;

            breakpoints = paletteColorizer.getBreakpoints();
            noDataColor = paletteColorizer.noDataColor ? paletteColorizer.noDataColor : TRANSPARENT;
            overColor = defaultColor;
            underColor = defaultColor;
        } else {
            // create a palette colorizer without any previous information
            breakpoints = [new ColorBreakpoint(0, BLACK), new ColorBreakpoint(255, WHITE)];
            noDataColor = TRANSPARENT;
            overColor = BLACK;
            underColor = WHITE;
        }

        return constructorFn(breakpoints, noDataColor, overColor, underColor);
    }

    protected createPaletteColorizer(): PaletteColorizer {
        const colorizer = this.getSingleBandColorizer();

        let breakpoints: Array<ColorBreakpoint>;
        let noDataColor: Color;
        let defaultColor: Color;

        if (colorizer instanceof LogarithmicGradient || colorizer instanceof LinearGradient) {
            breakpoints = colorizer.getBreakpoints();
            noDataColor = colorizer.noDataColor;

            // we can neither use the over nor the under color
            defaultColor = TRANSPARENT;
        } else if (colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const paletteColorizer = colorizer as PaletteColorizer;

            breakpoints = paletteColorizer.getBreakpoints();
            noDataColor = paletteColorizer.noDataColor ? paletteColorizer.noDataColor : TRANSPARENT;
            defaultColor = paletteColorizer.defaultColor ? paletteColorizer.defaultColor : TRANSPARENT;
        } else {
            // create a palette colorizer without any previous information
            breakpoints = [new ColorBreakpoint(0, BLACK), new ColorBreakpoint(255, WHITE)];
            noDataColor = TRANSPARENT;
            defaultColor = TRANSPARENT;
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
