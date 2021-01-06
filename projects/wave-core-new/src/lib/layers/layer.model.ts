import {LayerDict, UUID, ToDict} from '../backend/backend.model';

type LayerType = 'raster' | 'vector';

export abstract class Layer implements ToDict<LayerDict> {
    protected _name: string;
    protected _workflowId: UUID;

    // TODO: move to layer service
    protected _isVisible = true;
    protected _isLegendVisible = false;

    /**
     * Create the suitable layer type
     */
    static fromDict(dict: LayerDict): Layer {
        if (dict.info.raster) {
            return RasterLayer.fromDict(dict);
        }

        if (dict.info.vector) {
            return VectorLayer.fromDict(dict);
        }

        throw new Error(`Unknown layer type »${dict}«`);
    }

    protected constructor(config: {
        name: string,
        workflowId: string,
    }) {
        this._name = config.name;
        this._workflowId = config.workflowId;
    }

    get name(): string {
        return this._name;
    }

    get isVisible(): boolean {
        return this._isVisible;
    }

    get isLegendVisible(): boolean {
        return this._isLegendVisible;
    }

    abstract get layerType(): LayerType;

    abstract toDict(): LayerDict;
}

export class VectorLayer extends Layer {
    static fromDict(dict: LayerDict): Layer {
        return new VectorLayer({
            name: dict.name,
            workflowId: dict.workflow,
        });
    }

    constructor(config: {
        workflowId: string,
        name: string,
    }) {
        super(config);
    }

    get layerType(): LayerType {
        return 'vector';
    }

    toDict(): LayerDict {
        return {
            name: this._name,
            workflow: this._workflowId,
            info: {
                vector: {},
            },
        };
    }
}

export class RasterLayer extends Layer {

    // TODO: define
    _colorizer: any;

    static fromDict(dict: LayerDict): Layer {
        return new RasterLayer({
            name: dict.name,
            workflowId: dict.workflow,
            colorizer: dict.info.raster.colorizer,
        });
    }

    constructor(config: {
        workflowId: string,
        name: string,
        colorizer: any,
    }) {
        super(config);
        this._colorizer = config.colorizer;
    }

    get layerType(): LayerType {
        return 'raster';
    }

    toDict(): LayerDict {
        return {
            name: this._name,
            workflow: this._workflowId,
            info: {
                raster: {
                    colorizer: this._colorizer,
                },
            },
        };
    }
}
