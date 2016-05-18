import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface GFBioSourceTypeConfig {
    datasource: string;
    query: string;
}

interface GFBioSourceTypeMappingDict extends OperatorTypeMappingDict {
    datasource: string;
    query: string;
}

export interface GFBioSourceTypeDict extends OperatorTypeDict  {
    datasource: string;
    query: string;
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

    private datasource: string;
    private query: string;

    constructor(config: GFBioSourceTypeConfig) {
        super();
        this.datasource = config.datasource;
        this.query = config.query;
    }

    static fromDict(dict: GFBioSourceTypeDict): GFBioSourceType {
        return new GFBioSourceType({
            datasource: dict.datasource,
            query: dict.query,
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
            ['datasource', this.datasource.toString()],
            ['query', this.query.toString()],
        ];
    }

    toMappingDict(): GFBioSourceTypeMappingDict {
        return {
            datasource: this.datasource,
            query: this.query,
        };
    }

    toDict(): GFBioSourceTypeDict {
        return {
            operatorType: GFBioSourceType.TYPE,
            datasource: this.datasource,
            query: this.query,
        };
    }

}
