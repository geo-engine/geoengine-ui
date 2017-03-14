import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface FeatureCollectionDBSourceTypeConfig {
    id: number;
}

interface FeatureCollectionDBSourceTypeMappingDict extends OperatorTypeMappingDict {
    id: number;
}

export interface FeatureCollectionDBSourceTypeDict extends OperatorTypeDict {
    id: number;
}

/**
 * The FeatureCollectionDB source type.
 */
export class FeatureCollectionDBSourceType extends OperatorType {
    private static _TYPE = 'featurecollectiondb_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(FeatureCollectionDBSourceType._TYPE);
    private static _NAME = 'Feature Collection DB Source';

    static get TYPE(): string { return FeatureCollectionDBSourceType._TYPE; }
    static get ICON_URL(): string { return FeatureCollectionDBSourceType._ICON_URL; }
    static get NAME(): string { return FeatureCollectionDBSourceType._NAME; }

    private id: number;

    static fromDict(dict: FeatureCollectionDBSourceTypeDict): FeatureCollectionDBSourceType {
        return new FeatureCollectionDBSourceType({
            id: dict.id,
        });
    }

    constructor(config: FeatureCollectionDBSourceTypeConfig) {
        super();
        this.id = config.id;
    }

    getMappingName(): string {
        return FeatureCollectionDBSourceType.TYPE;
    }

    getIconUrl(): string {
        return FeatureCollectionDBSourceType.ICON_URL;
    }

    toString(): string {
        return FeatureCollectionDBSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['id', this.id.toString()],
        ];
    }

    toMappingDict(): FeatureCollectionDBSourceTypeMappingDict {
        return {
            id: this.id,
        };
    }

    toDict(): FeatureCollectionDBSourceTypeDict {
        return {
            operatorType: FeatureCollectionDBSourceType.TYPE,
            id: this.id,
        };
    }

}
