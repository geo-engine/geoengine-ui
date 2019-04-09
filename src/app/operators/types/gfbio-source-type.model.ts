import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';
import {BasicColumns} from '../dialogs/baskets/csv.model';

interface GFBioSourceTypeConfig {
    dataSource: string;
    level: string; // family, genus, species
    term: string;
    columns: BasicColumns;
}

interface GFBioSourceTypeMappingDict extends OperatorTypeMappingDict {
    dataSource: string;
    level: string;
    term: string;
    columns: BasicColumns;
}

export interface GFBioSourceTypeDict extends OperatorTypeDict  {
    dataSource: string;
    level: string;
    term: string;
    columns: BasicColumns;
    scientificName?: string; // FIXME: legacy support
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
    private level: string;
    private term: string;
    private columns: BasicColumns;

    constructor(config: GFBioSourceTypeConfig) {
        super();
        this.dataSource = config.dataSource;
        this.level = config.level;
        this.term = config.term;
        this.columns = config.columns;
    }

    static fromDict(dict: GFBioSourceTypeDict): GFBioSourceType {
        return new GFBioSourceType({
            dataSource: dict.dataSource,
            level: dict.level ? dict.level : 'species',
            term: dict.term ? dict.term : dict.scientificName,
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
            ['level', this.level.toString()],
            ['term', this.term.toString()],
            ['columns', columns.join(', ')],
        ];
    }

    toMappingDict(): GFBioSourceTypeMappingDict {
        return {
            dataSource: this.dataSource,
            level: this.level,
            term: this.term,
            columns: this.columns,
        };
    }

    toDict(): GFBioSourceTypeDict {
        return {
            operatorType: GFBioSourceType.TYPE,
            dataSource: this.dataSource,
            level: this.level,
            term: this.term,
            columns: this.columns,
        };
    }

}
