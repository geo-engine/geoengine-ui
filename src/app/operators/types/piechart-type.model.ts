import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
    from '../operator-type.model';

import {ResultTypes, ResultType} from '../result-type.model';

interface PieChartTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface PieChartTypeDict extends OperatorTypeDict {
    attribute: string;
}

interface PieChartTypeConfig {
    attribute: string;
}

/**
 * The R type.
 */
export class PieChartType extends OperatorType {
    private static _TYPE = 'r_script';
    private static _ICON_URL = OperatorType.createIconDataUrl(PieChartType._TYPE);
    private static _NAME = 'Pie Chart';

    static get TYPE(): string { return PieChartType._TYPE; }
    static get ICON_URL(): string { return PieChartType._ICON_URL; }
    static get NAME(): string { return PieChartType._NAME; }

    private code: string;
    private attribute: string;
    private resultType: ResultType;

    static fromDict(dict: PieChartTypeDict): PieChartType {
        return new PieChartType({
            attribute: dict.attribute,
        });
    }

    constructor(config: PieChartTypeConfig) {
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
        return PieChartType.TYPE;
    }

    getIconUrl(): string {
        return PieChartType.ICON_URL;
    }

    toString(): string {
        return PieChartType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['code', this.code.toString()],
            ['resultType', this.resultType.toString()],
        ];
    }

    toMappingDict(): PieChartTypeMappingDict {
        return {
            source: this.code,
            result: this.resultType.getCode(),
        };
    }

    toDict(): PieChartTypeDict {
        return {
            operatorType: PieChartType.TYPE,
            attribute: this.attribute,
        };
    }

}
