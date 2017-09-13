import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface TextualAttributeFilterTypeMappingDict extends OperatorTypeMappingDict {
    name: string;
    engine: string;
    searchString: string;
}

export interface TextualAttributeFilterTypeDict extends OperatorTypeDict {
    attributeName: string;
    engine: string;
    searchString: string;
}

export enum TextualAttributeFilterEngineType {
    EXACT = 'exact',
    CONTAINS = 'contains',
    STARTSWITH = 'startswith',
}

interface TextualAttributeFilterTypeConfig {
    attributeName: string;
    engine: TextualAttributeFilterEngineType;
    searchString: string;
}

/**
 * The Textual attribute filter type.
 */
export class TextualAttributeFilterType extends OperatorType {
    private static _TYPE = 'textual_attribute_filter';
    private static _ICON_URL = OperatorType.createIconDataUrl(TextualAttributeFilterType._TYPE);
    private static _NAME = 'Textual Attribute Filter';

    static get TYPE(): string {
        return TextualAttributeFilterType._TYPE;
    }

    static get ICON_URL(): string {
        return TextualAttributeFilterType._ICON_URL;
    }

    static get NAME(): string {
        return TextualAttributeFilterType._NAME;
    }

    private attributeName: string;
    private engine: TextualAttributeFilterEngineType;
    private searchString: string;

    static fromDict(dict: TextualAttributeFilterTypeDict): TextualAttributeFilterType {
        let engine: TextualAttributeFilterEngineType;
        switch (dict.engine) {
            case 'exact':
                engine = TextualAttributeFilterEngineType.EXACT;
                break;
            case 'contains':
                engine = TextualAttributeFilterEngineType.CONTAINS;
                break;
            case 'startswith':
                engine = TextualAttributeFilterEngineType.STARTSWITH;
                break;
        }

        return new TextualAttributeFilterType({
            attributeName: dict.attributeName,
            engine: engine,
            searchString: dict.searchString,
        });
    }

    constructor(config: TextualAttributeFilterTypeConfig) {
        super();
        this.attributeName = config.attributeName;
        this.engine = config.engine;
        this.searchString = config.searchString;
    }

    getMappingName(): string {
        return TextualAttributeFilterType.TYPE;
    }

    getIconUrl(): string {
        return TextualAttributeFilterType.ICON_URL;
    }

    toString(): string {
        return TextualAttributeFilterType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['attributeName', this.attributeName.toString()],
            ['filter engine', this.engine.toString()],
            ['searchString', this.searchString.toString()],
        ];
    }

    toMappingDict(): TextualAttributeFilterTypeMappingDict {
        return {
            name: this.attributeName,
            engine: this.engine,
            searchString: this.searchString,
        };
    }

    toDict(): TextualAttributeFilterTypeDict {
        return {
            operatorType: TextualAttributeFilterType.TYPE,
            attributeName: this.attributeName,
            engine: this.engine,
            searchString: this.searchString,
        };
    }

}
