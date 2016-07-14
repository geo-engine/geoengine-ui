import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface GFBioSourceTypeConfig {
    dataSource: string;
    scientificName: string;
    includeMetadata: boolean;
}

interface GFBioSourceTypeMappingDict extends OperatorTypeMappingDict {
    dataSource: string;
    scientificName: string;
    includeMetadata: boolean;
}

export interface GFBioSourceTypeDict extends OperatorTypeDict  {
    dataSource: string;
    scientificName: string;
    includeMetadata: boolean;
}

/**
 * The GFBio source type.
 */
export class GFBioSourceType extends OperatorType {
    private static _TYPE = 'gfbio_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(GFBioSourceType._TYPE);
    private static _NAME = 'GFBio Source';

    static get TYPE(): string { return GFBioSourceType._TYPE; }
    static get ICON_URL(): string { return GFBioSourceType._ICON_URL; }
    static get NAME(): string { return GFBioSourceType._NAME; }

    private dataSource: string;
    private scientificName: string;
    private includeMetadata: boolean;

    constructor(config: GFBioSourceTypeConfig) {
        super();
        this.dataSource = config.dataSource;
        this.scientificName = config.scientificName;
        this.includeMetadata = config.includeMetadata;
    }

    static fromDict(dict: GFBioSourceTypeDict): GFBioSourceType {
        return new GFBioSourceType({
            dataSource: dict.dataSource,
            scientificName: dict.scientificName,
            includeMetadata: dict.includeMetadata,
        });
    }

    getMappingName(): string {
        return GFBioSourceType.TYPE;
    }

    getIconUrl(): string {
        return GFBioSourceType.ICON_URL;
    }

    toString(): string {
        return GFBioSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['dataSource', this.dataSource.toString()],
            ['scientificName', this.scientificName.toString()],
            ['includeMetadata', this.includeMetadata.toString()],
        ];
    }

    toMappingDict(): GFBioSourceTypeMappingDict {
        return {
            dataSource: this.dataSource,
            scientificName: this.scientificName,
            includeMetadata: this.includeMetadata,
        };
    }

    toDict(): GFBioSourceTypeDict {
        return {
            operatorType: GFBioSourceType.TYPE,
            dataSource: this.dataSource,
            scientificName: this.scientificName,
            includeMetadata: this.includeMetadata,
        };
    }

}
