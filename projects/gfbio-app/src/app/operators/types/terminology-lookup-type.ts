import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from 'wave-core';

export enum TerminologyLookupOnNotResolvable {
    EMPTY = 'EMPTY',
    KEEP = 'KEEP',
}

export enum TerminologyLookupMatchType {
    EXACT = 'exact',
    INCLUDED = 'included',
    REGEX = 'regex',
}

interface TerminologyLookupTypeMappingDict extends OperatorTypeMappingDict {
    attribute_name: string;
    resolved_attribute: string;
    terminology: string;
    key?: string;
    match_type?: 'exact' | 'included' | 'regex';
    first_hit?: boolean;
    on_not_resolvable: 'EMPTY' | 'KEEP';
}

export interface TerminologyLookupTypeDict extends OperatorTypeDict {
    attribute_name: string;
    resolved_attribute: string;
    terminology: string;
    key: string;
    match_type: TerminologyLookupMatchType;
    first_hit: boolean;
    on_not_resolvable: TerminologyLookupOnNotResolvable;
}

interface TerminologyLookupTypeConfig {
    attribute_name: string;
    resolved_attribute: string;
    terminology: string;
    key?: string;
    match_type?: TerminologyLookupMatchType;
    first_hit?: boolean;
    on_not_resolvable: TerminologyLookupOnNotResolvable;
}

/**
 * The Terminology Resolver type.
 */
export class TerminologyLookupType extends OperatorType {
    private static _TYPE = 'terminology_resolver';
    private static _ICON_URL = OperatorType.createIconDataUrl(TerminologyLookupType._TYPE);
    private static _NAME = 'Terminology Resolver';

    static get TYPE(): string {
        return TerminologyLookupType._TYPE;
    }

    static get ICON_URL(): string {
        return TerminologyLookupType._ICON_URL;
    }

    static get NAME(): string {
        return TerminologyLookupType._NAME;
    }

    attribute_name: string;
    resolved_attribute_name: string;
    terminology: string;
    key: string;
    match_type: TerminologyLookupMatchType;
    first_hit: boolean;
    on_not_resolvable: TerminologyLookupOnNotResolvable;
    new_column_appendix: string;
    define_new_column_appendix: boolean;

    static fromDict(dict: TerminologyLookupTypeDict): TerminologyLookupType {
        return new TerminologyLookupType(dict);
    }

    constructor(config: TerminologyLookupTypeConfig) {
        super();
        this.attribute_name = config.attribute_name;
        this.resolved_attribute_name = config.resolved_attribute;
        this.terminology = config.terminology;
        this.key = config.key;
        this.match_type = config.match_type ? config.match_type : TerminologyLookupMatchType.EXACT;
        this.first_hit = !!config.first_hit;
        this.on_not_resolvable = config.on_not_resolvable ? config.on_not_resolvable : TerminologyLookupOnNotResolvable.EMPTY;
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
            ['attribute_name', this.attribute_name.toString()],
            ['resolved_attribute_name', this.resolved_attribute_name.toString()],
            ['terminology', this.terminology.toString()],
            ['key', this.key.toString()],
            ['match_type', this.match_type.toString()],
            ['first_hit', this.first_hit.toString()],
            ['on_not_resolvable', this.on_not_resolvable.toString()],
        ];
    }

    toMappingDict(): TerminologyLookupTypeMappingDict {
        const dict = {
            attribute_name: this.attribute_name,
            resolved_attribute: this.resolved_attribute_name,
            terminology: this.terminology,
            on_not_resolvable: this.on_not_resolvable.toString(),
            first_hit: this.first_hit,
        };

        if (this.key) {
            dict['key'] = this.key;
        }
        if (this.match_type) {
            dict['match_type'] = this.match_type; // TODO: remove cast?
        }
        return dict as TerminologyLookupTypeMappingDict;
    }

    toDict(): TerminologyLookupTypeDict {
        return {
            operatorType: TerminologyLookupType.TYPE,
            attribute_name: this.attribute_name,
            resolved_attribute: this.resolved_attribute_name,
            terminology: this.terminology,
            on_not_resolvable: this.on_not_resolvable,
            first_hit: this.first_hit,
            key: this.key,
            match_type: this.match_type,

            // define_new_column_appendix: this.define_new_column_appendix,
            // new_column_appendix: this.new_column_appendix
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return TerminologyLookupType.fromDict(this.toDict()); // TODO: add modifications
    }
}
