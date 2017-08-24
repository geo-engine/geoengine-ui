import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
    from '../operator-type.model';

import {ResultTypes, ResultType} from '../result-type.model';

interface ScatterPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface ScatterPlotTypeDict extends OperatorTypeDict {
    attribute: string;
}

interface ScatterPlotTypeConfig {
    attribute: string;
}

/**
 * The R type.
 */
export class ScatterPlotType extends OperatorType {
    private static _TYPE = 'r_script';
    private static _ICON_URL = OperatorType.createIconDataUrl(ScatterPlotType._TYPE);
    private static _NAME = 'Scatter Plot';

    static get TYPE(): string { return ScatterPlotType._TYPE; }
    static get ICON_URL(): string { return ScatterPlotType._ICON_URL; }
    static get NAME(): string { return ScatterPlotType._NAME; }

    private code: string;
    private attribute: string;
    private resultType: ResultType;

    static fromDict(dict: ScatterPlotTypeDict): ScatterPlotType {
        return new ScatterPlotType({
            attribute: dict.attribute,
        });
    }

    constructor(config: ScatterPlotTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.code = `
points <- mapping.loadPoints(0, mapping.qrect)
if (length(points) > 0) {
  kv <- table(points$\`${config.attribute}\`)
  labels <- paste("(",names(kv),")", "\n", kv, sep="")
  pie(kv, labels = labels)
} else {
  plot.new()
  mtext("Empty Dataset")
}
        `;
        this.resultType = ResultTypes.PLOT;
    }

    getMappingName(): string {
        return ScatterPlotType.TYPE;
    }

    getIconUrl(): string {
        return ScatterPlotType.ICON_URL;
    }

    toString(): string {
        return ScatterPlotType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['code', this.code.toString()],
            ['resultType', this.resultType.toString()],
        ];
    }

    toMappingDict(): ScatterPlotTypeMappingDict {
        return {
            source: this.code,
            result: this.resultType.getCode(),
        };
    }

    toDict(): ScatterPlotTypeDict {
        return {
            operatorType: ScatterPlotType.TYPE,
            attribute: this.attribute,
        };
    }

}
