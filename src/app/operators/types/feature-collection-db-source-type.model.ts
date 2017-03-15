import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface FeatureCollectionDBSourceTypeConfig {
    owner: string;
    data_set_name: string;
}

interface FeatureCollectionDBSourceTypeMappingDict extends OperatorTypeMappingDict {
    owner: string;
    data_set_name: string;
}

export interface FeatureCollectionDBSourceTypeDict extends OperatorTypeDict {
    owner: string;
    data_set_name: string;
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

    private owner: string;
    private data_set_name: string;

    static fromDict(dict: FeatureCollectionDBSourceTypeDict): FeatureCollectionDBSourceType {
        return new FeatureCollectionDBSourceType({
            owner: dict.owner,
            data_set_name: dict.data_set_name,
        });
    }

    constructor(config: FeatureCollectionDBSourceTypeConfig) {
        super();
        this.owner = config.owner;
        this.data_set_name = config.data_set_name;

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
            ['owner', this.owner],
            ['data_set_name', this.data_set_name],
        ];
    }

    toMappingDict(): FeatureCollectionDBSourceTypeMappingDict {
        return {
            owner: this.owner,
            data_set_name: this.data_set_name,
        };
    }

    toDict(): FeatureCollectionDBSourceTypeDict {
        return {
            operatorType: FeatureCollectionDBSourceType.TYPE,
            owner: this.owner,
            data_set_name: this.data_set_name,
        };
    }

}
