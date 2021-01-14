import {LayerDict, UUID, ToDict, ColorizerDict, RgbaColor} from '../backend/backend.model';
import {AbstractSymbology, MappingRasterSymbology, VectorSymbology, PointSymbology} from './symbology/symbology.model';
import {Unit} from '../operators/unit.model';

export type LayerType = 'raster' | 'vector';

export abstract class Layer implements HasLayerId, HasLayerType, ToDict<LayerDict> {
    protected static nextLayerId = 0;

    abstract readonly layerType: LayerType;

    readonly id: number;

    readonly name: string;
    readonly workflowId: UUID;

    readonly isVisible: boolean;
    readonly isLegendVisible: boolean;

    readonly symbology: AbstractSymbology;

    /**
     * Create the suitable layer type
     */
    static fromDict(dict: LayerDict): Layer {
        if (dict.info.Raster) {
            return RasterLayer.fromDict(dict);
        }

        if (dict.info.Vector) {
            return VectorLayer.fromDict(dict);
        }

        throw new Error(`Unknown layer type »${dict}«`);
    }

    protected constructor(config: {
        id?: number,
        name: string,
        workflowId: string,
        isVisible: boolean,
        isLegendVisible: boolean,
        symbology: AbstractSymbology,
    }) {
        this.id = config.id ?? Layer.nextLayerId++;

        this.name = config.name;
        this.workflowId = config.workflowId;
        this.isVisible = config.isVisible;
        this.isLegendVisible = config.isLegendVisible;
        this.symbology = config.symbology;
    }

    // TODO: remove method, here?
    abstract updateFields(changes: {
        id?: number,
        name?: string,
        workflowId?: string,
        isVisible?: boolean,
        isLegendVisible?: boolean,
        symbology?: AbstractSymbology,
    }): Layer;

    abstract toDict(): LayerDict;
}

export class VectorLayer extends Layer {
    readonly layerType = 'vector';

    readonly symbology: VectorSymbology;

    static fromDict(dict: LayerDict): Layer {
        return new VectorLayer({
            name: dict.name,
            workflowId: dict.workflow,
            isLegendVisible: false,  // TODO: get from separate store
            isVisible: true,
            symbology: PointSymbology.createSymbology({
                fillRGBA: [255, 0, 0], // red
                radius: 10,
                clustered: false,
            }) as any as VectorSymbology // TODO: get symbology from meta data
        });
    }

    constructor(config: {
        id?: number,
        name: string,
        workflowId: string,
        isVisible: boolean,
        isLegendVisible: boolean,
        symbology: VectorSymbology,
    }) {
        super(config);
    }

    toDict(): LayerDict {
        return {
            name: this.name,
            workflow: this.workflowId,
            info: {
                Vector: {},
            },
        };
    }

    updateFields(changes: {
        id?: number,
        name?: string,
        workflowId?: string,
        isVisible?: boolean,
        isLegendVisible?: boolean,
        symbology?: VectorSymbology,
    }): VectorLayer {
        return new VectorLayer({
            id: changes.id ?? this.id,
            name: changes.name ?? this.name,
            workflowId: changes.workflowId ?? this.workflowId,
            isVisible: changes.isVisible ?? this.isVisible,
            isLegendVisible: changes.isLegendVisible ?? this.isLegendVisible,
            symbology: changes.symbology ?? this.symbology,
        });
    }
}

export class RasterLayer extends Layer {
    readonly layerType = 'raster';

    readonly symbology: MappingRasterSymbology;

    static fromDict(dict: LayerDict): Layer {
        const colorizerDict = dict.info.Raster.colorizer;
        let symbology;

        if (colorizerDict.LinearGradient) {
            const linearGradient = colorizerDict.LinearGradient;
            symbology = new MappingRasterSymbology({
                colorizer: {
                    breakpoints: linearGradient.breakpoints.map(breakpoint => {
                        return {
                            value: breakpoint.value,
                            rgba: breakpoint.color,
                        };
                    }),
                    type: 'gradient',
                },
                noDataColor: {
                    value: undefined, // TODO: get from metadata
                    rgba: linearGradient.no_data_color,
                },
                opacity: 1, // TODO: get from metadata
                overflowColor: {
                    value: undefined, // TODO: get from metadata
                    rgba: linearGradient.default_color,
                },
                unit: Unit.defaultUnit, // TODO: get from metadata
            });
        }

        if (colorizerDict.LogarithmicGradient) {
            // TODO: implement
        }

        if (colorizerDict.Palette) {
            // TODO: implement
        }

        if (colorizerDict.Rgba) {
            // TODO: implement
        }

        if (!symbology) {
            throw Error('unable to create raster symbology');
        }

        return new RasterLayer({
            name: dict.name,
            isLegendVisible: false, // TODO: get from separate store
            isVisible: true,
            workflowId: dict.workflow,
            symbology
        });
    }

    constructor(config: {
        id?: number,
        name: string,
        workflowId: string,
        isVisible: boolean,
        isLegendVisible: boolean,
        symbology: MappingRasterSymbology,
    }) {
        super(config);
    }

    updateFields(changes: {
        id?: number,
        name?: string,
        workflowId?: string,
        isVisible?: boolean,
        isLegendVisible?: boolean,
        symbology?: MappingRasterSymbology,
    }): RasterLayer {
        return new RasterLayer({
            id: changes.id ?? this.id,
            name: changes.name ?? this.name,
            workflowId: changes.workflowId ?? this.workflowId,
            isVisible: changes.isVisible ?? this.isVisible,
            isLegendVisible: changes.isLegendVisible ?? this.isLegendVisible,
            symbology: changes.symbology ?? this.symbology,
        });
    }

    toDict(): LayerDict {
        let colorizerDict: ColorizerDict;
        const colorizer = this.symbology.colorizer;

        switch (colorizer.type) {
            case 'gradient':
                colorizerDict = {
                    LinearGradient: {
                        breakpoints: colorizer.breakpoints.map(breakpoint => {
                            return {
                                value: typeof breakpoint.value === 'string' ? Number.parseFloat(breakpoint.value) : breakpoint.value,
                                color: breakpoint.rgba.rgbaTuple().map(Math.round) as RgbaColor,
                            };
                        }),
                        default_color: this.symbology.overflowColor.rgba.rgbaTuple().map(Math.round) as RgbaColor,
                        no_data_color: this.symbology.noDataColor.rgba.rgbaTuple().map(Math.round) as RgbaColor,
                    },
                };
                break;
            case 'logarithmic':
                // TODO: implement
                break;
            case 'palette':
                // TODO: implement
                break;
            case 'rgba_composite':
                // TODO: implement
                break;
        }

        return {
            name: this.name,
            workflow: this.workflowId,
            info: {
                Raster: {
                    colorizer: colorizerDict,
                },
            },
        };
    }

}

export interface HasLayerId {
    readonly id: number;
}

export interface HasLayerType {
    readonly layerType: LayerType;
}
