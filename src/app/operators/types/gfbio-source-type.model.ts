import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';
import {BasicColumns} from "../../../models/csv.model";

interface GFBioSourceTypeConfig {
    dataSource: string;
    scientificName: string;
    columns: BasicColumns;
}

interface GFBioSourceTypeMappingDict extends OperatorTypeMappingDict {
    dataSource: string;
    scientificName: string;
    columns: BasicColumns;
}

export interface GFBioSourceTypeDict extends OperatorTypeDict  {
    dataSource: string;
    scientificName: string;
    columns: BasicColumns;
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
    private columns: BasicColumns;

    constructor(config: GFBioSourceTypeConfig) {
        super();
        this.dataSource = config.dataSource;
        this.scientificName = config.scientificName;
        this.columns = config.columns;
    }

    static fromDict(dict: GFBioSourceTypeDict): GFBioSourceType {
        return new GFBioSourceType({
            dataSource: dict.dataSource,
            scientificName: dict.scientificName,
            columns: dict.columns,
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
        const columns = this.columns.numeric.concat(this.columns.textual);
        columns.sort();
        return [
            ['dataSource', this.dataSource.toString()],
            ['scientificName', this.scientificName.toString()],
            ['columns', columns.join(', ')],
        ];
    }

    toMappingDict(): GFBioSourceTypeMappingDict {
        return {
            dataSource: this.dataSource,
            scientificName: this.scientificName,
            columns: this.columns,
        };
    }

    toDict(): GFBioSourceTypeDict {
        return {
            operatorType: GFBioSourceType.TYPE,
            dataSource: this.dataSource,
            scientificName: this.scientificName,
            columns: this.columns,
        };
    }

}
