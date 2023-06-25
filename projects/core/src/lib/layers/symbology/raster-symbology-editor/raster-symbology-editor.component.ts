import {Component, Input, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {RasterSymbology} from '../symbology.model';
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
        console.log('update colorizer', colorizer);

        this.symbology = this.symbology.cloneWith({colorizer});

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
        if (this.symbology.colorizer instanceof LinearGradient) {
            return LinearGradient.TYPE_NAME;
        }

        if (this.symbology.colorizer instanceof PaletteColorizer) {
            return PaletteColorizer.TYPE_NAME;
        }

        if (this.symbology.colorizer instanceof LogarithmicGradient) {
            return LogarithmicGradient.TYPE_NAME;
        }

        if (this.symbology.colorizer instanceof RgbaColorizer) {
            return RgbaColorizer.TYPE_NAME;
        }

        throw Error('unknown colorizer type');
    }

    get paletteColorizer(): PaletteColorizer | undefined {
        if (this.symbology.colorizer instanceof PaletteColorizer) {
            return this.symbology.colorizer;
        }
        return undefined;
    }

    get gradientColorizer(): LinearGradient | LogarithmicGradient | undefined {
        if (this.symbology.colorizer instanceof LinearGradient || this.symbology.colorizer instanceof LogarithmicGradient) {
            return this.symbology.colorizer;
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

        let colorizer: Colorizer;

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

        this.symbology = this.symbology.cloneWith({colorizer});
        this.unappliedChanges.next(true);
    }

    protected createGradientColorizer<G>(
        constructorFn: (breakpoints: Array<ColorBreakpoint>, noDataColor: Color, overColor: Color, underColor: Color) => G,
    ): G {
        if (this.symbology.colorizer instanceof RgbaColorizer) {
            // TODO: derive some reasonable default values
            return constructorFn([], TRANSPARENT, TRANSPARENT, TRANSPARENT);
        }

        const breakpoints = this.symbology.colorizer.getBreakpoints();
        let noDataColor: Color;
        let overColor: Color;
        let underColor: Color;

        if (this.symbology.colorizer instanceof LogarithmicGradient || this.symbology.colorizer instanceof LinearGradient) {
            noDataColor = this.symbology.colorizer.noDataColor;
            overColor = this.symbology.colorizer.overColor;
            underColor = this.symbology.colorizer.underColor;
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const colorizer = this.symbology.colorizer as PaletteColorizer;
            const defaultColor: Color = colorizer.defaultColor ? colorizer.defaultColor : TRANSPARENT;

            noDataColor = colorizer.noDataColor ? colorizer.noDataColor : TRANSPARENT;
            overColor = defaultColor;
            underColor = defaultColor;
        } else {
            throw Error('unknown colorizer type');
        }

        return constructorFn(breakpoints, noDataColor, overColor, underColor);
    }

    protected createPaletteColorizer(): PaletteColorizer {
        if (this.symbology.colorizer instanceof RgbaColorizer) {
            // TODO: derive some reasonable default values
            return new PaletteColorizer(new Map([[0, WHITE]]), TRANSPARENT, TRANSPARENT);
        }

        const breakpoints = this.symbology.colorizer.getBreakpoints();
        let noDataColor: Color;
        let defaultColor: Color;

        if (this.symbology.colorizer instanceof LogarithmicGradient || this.symbology.colorizer instanceof LinearGradient) {
            noDataColor = this.symbology.colorizer.noDataColor;

            // we can neither use the over nor the under color
            defaultColor = TRANSPARENT;
        } else if (this.symbology.colorizer instanceof PaletteColorizer) {
            // Must be a palette then, so use values from the color selectors or RGBA 0, 0, 0, 0 as a fallback
            const colorizer = this.symbology.colorizer as PaletteColorizer;

            noDataColor = colorizer.noDataColor ? colorizer.noDataColor : TRANSPARENT;
            defaultColor = colorizer.defaultColor ? colorizer.defaultColor : TRANSPARENT;
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
