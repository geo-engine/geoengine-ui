import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

import {ResultTypes, ResultType} from '../result-type.model';

interface RScriptTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface RScriptTypeDict extends OperatorTypeDict {
    code: string;
    resultType: string;
}

interface RScriptTypeConfig {
    code: string;
    resultType: ResultType;
}

/**
 * The R type.
 */
export class RScriptType extends OperatorType {
    private static _TYPE = 'r_script';
    private static _ICON_URL = OperatorType.createIconDataUrl(RScriptType._TYPE);
    private static _NAME = 'R Script';

    static get TYPE(): string { return RScriptType._TYPE; }
    static get ICON_URL(): string { return RScriptType._ICON_URL; }
    static get NAME(): string { return RScriptType._NAME; }

    private code: string;
    private resultType: ResultType;

    constructor(config: RScriptTypeConfig) {
        super();
        this.code = config.code;
        this.resultType = config.resultType;
    }

    static fromDict(dict: RScriptTypeDict): RScriptType {
        return new RScriptType({
            code: dict.code,
            resultType: ResultTypes.fromCode(dict.resultType),
        });
    }

    getMappingName(): string {
        return RScriptType.TYPE;
    }

    getIconUrl(): string {
        return RScriptType.ICON_URL;
    }

    toString(): string {
        return RScriptType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['code', this.code.toString()],
            ['resultType', this.resultType.toString()],
        ];
    }

    toMappingDict(): RScriptTypeMappingDict {
        return {
            source: this.code,
            result: this.resultType.getCode(),
        };
    }

    toDict(): RScriptTypeDict {
        return {
            operatorType: RScriptType.TYPE,
            code: this.code,
            resultType: this.resultType.getCode(),
        };
    }

}
