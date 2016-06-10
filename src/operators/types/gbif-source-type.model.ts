import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface GBIFSourceTypeConfig {
    scientificName: string;
    includeMetadata: boolean;
}

interface GBIFSourceTypeMappingDict extends OperatorTypeMappingDict {
    scientificName: string;
    includeMetadata: boolean;
}

export interface GBIFSourceTypeDict extends OperatorTypeDict  {
    scientificName: string;
    includeMetadata: boolean;
}

/**
 * The GBIF source type.
 */
export class GBIFSourceType extends OperatorType {
    private static _TYPE = 'gbif_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(GBIFSourceType._TYPE);
    private static _NAME = 'GBIF Source';

    static get TYPE(): string { return GBIFSourceType._TYPE; }
    static get ICON_URL(): string { return GBIFSourceType._ICON_URL; }
    static get NAME(): string { return GBIFSourceType._NAME; }

    private scientificName: string;
    private includeMetadata: boolean;

    constructor(config: GBIFSourceTypeConfig) {
        super();
        this.scientificName = config.scientificName;
        this.includeMetadata = config.includeMetadata;
    }

    static fromDict(dict: GBIFSourceTypeDict): GBIFSourceType {
        return new GBIFSourceType({
            scientificName: dict.scientificName,
            includeMetadata: dict.includeMetadata,
        });
    }

    getMappingName(): string {
        return GBIFSourceType.TYPE;
    }

    getIconUrl(): string {
        return GBIFSourceType.ICON_URL;
    }

    toString(): string {
        return GBIFSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['scientificName', this.scientificName.toString()],
            ['includeMetadata', this.includeMetadata.toString()],
        ];
    }

    toMappingDict(): GBIFSourceTypeMappingDict {
        return {
            scientificName: this.scientificName,
            includeMetadata: this.includeMetadata,
        };
    }

    toDict(): GBIFSourceTypeDict {
        return {
            operatorType: GBIFSourceType.TYPE,
            scientificName: this.scientificName,
            includeMetadata: this.includeMetadata,
        };
    }

}
