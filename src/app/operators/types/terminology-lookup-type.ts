import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

export enum TerminologyLookupOnNotResolvable {
    EMPTY = 'EMPTY',
    OLD_NAME = 'OLD_NAME'
}

interface TerminologyLookupTypeMappingDict extends OperatorTypeMappingDict {
    column: string;
    terminology: string;
    key: string;
    on_not_resolvable: 'EMPTY' | 'OLD_NAME';
    name_appendix?: 'terminology' | string;
}

export interface TerminologyLookupTypeDict extends OperatorTypeDict {
    attribute: string;
    terminology: string;
    terminology_key: string;
    on_not_resolvable: TerminologyLookupOnNotResolvable;
    define_new_column_appendix: boolean;
    new_column_appendix: string;
}

interface TerminologyLookupTypeConfig {
    attribute: string;
    terminology: string;
    terminology_key: string;
    on_not_resolvable: TerminologyLookupOnNotResolvable;
    define_new_column_appendix: boolean;
    new_column_appendix: string;
}

/**
 * The Terminology lookup type.
 */
export class TerminologyLookupType extends OperatorType {
    private static _TYPE = 'terminology_lookup';
    private static _ICON_URL = OperatorType.createIconDataUrl(TerminologyLookupType._TYPE);
    private static _NAME = 'Terminology Lookup';

    static get TYPE(): string {
        return TerminologyLookupType._TYPE;
    }

    static get ICON_URL(): string {
        return TerminologyLookupType._ICON_URL;
    }

    static get NAME(): string {
        return TerminologyLookupType._NAME;
    }

    private attribute: string;
    private terminology: string;
    private terminology_key: string;
    private on_not_resolvable: TerminologyLookupOnNotResolvable;
    private new_column_appendix: string;
    private define_new_column_appendix: boolean;

    static fromDict(dict: TerminologyLookupTypeDict): TerminologyLookupType {
        return new TerminologyLookupType({
            attribute: dict.attribute,
            terminology: dict.terminology,
            terminology_key: dict.terminology_key,
            on_not_resolvable: dict.on_not_resolvable,
            define_new_column_appendix: dict.define_new_column_appendix,
            new_column_appendix: (dict.new_column_appendix) ? dict.new_column_appendix : 'terminology'
        });
    }

    constructor(config: TerminologyLookupTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.terminology = config.terminology;
        this.terminology_key = config.terminology_key;
        this.on_not_resolvable = config.on_not_resolvable;
        this.define_new_column_appendix = config.define_new_column_appendix;
        this.new_column_appendix = config.new_column_appendix;
    }

    getMappingName(): string {
        return TerminologyLookupType.TYPE;
    }

    getIconUrl(): string {
        return TerminologyLookupType.ICON_URL;
    }

    toString(): string {
        return TerminologyLookupType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['attribute', this.attribute.toString()],
            ['terminology', this.terminology.toString()],
            ['terminology key', this.terminology_key.toString()],
            ['on not resolvable', this.on_not_resolvable.toString()],
            ['define new column appendix', this.define_new_column_appendix.toString()],
            ['new column appendix', this.new_column_appendix.toString()],
        ];
    }

    toMappingDict(): TerminologyLookupTypeMappingDict {
        const dict =  {
            operatorType: TerminologyLookupType.TYPE,
            column: this.attribute,
            terminology: this.terminology,
            key: this.terminology_key,
            on_not_resolvable: this.on_not_resolvable,
        };

        if (this.define_new_column_appendix ) {
            dict['new_column_appendix'] = this.new_column_appendix;
        }

        return dict;
    }

    toDict(): TerminologyLookupTypeDict {
        return {
            operatorType: TerminologyLookupType.TYPE,
            attribute: this.attribute,
            terminology: this.terminology,
            terminology_key: this.terminology_key,
            on_not_resolvable: this.on_not_resolvable,
            define_new_column_appendix: this.define_new_column_appendix,
            new_column_appendix: this.new_column_appendix
        };

    }

}
