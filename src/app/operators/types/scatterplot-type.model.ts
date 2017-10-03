import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
    from '../operator-type.model';

import {ResultTypes, ResultType} from '../result-type.model';

interface ScatterPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface ScatterPlotTypeDict extends OperatorTypeDict {
    attribute1: string;
    attribute2: string;
    regression: boolean;
}

interface ScatterPlotTypeConfig {
    attribute1: string;
    attribute2: string;
    regression: boolean;
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
    private attribute1: string;
    private attribute2: string;
    private regression: boolean;
    private resultType: ResultType;

    static fromDict(dict: ScatterPlotTypeDict): ScatterPlotType {
        return new ScatterPlotType({
            attribute1: dict.attribute1,
            attribute2: dict.attribute2,
            regression: dict.regression
        });
    }

    constructor(config: ScatterPlotTypeConfig) {
        super();
        this.attribute1 = config.attribute1;
        this.attribute2 = config.attribute2;
        this.regression = config.regression;
        let isRegression = (this.regression ? '\nabline(lm(second~first), col="red");' : '');
        let legend = 'legend("topright", legend=c("'
            + config.attribute2 + (this.regression ? '", "Regression line"' : '"')
            + '), pch=c(1' + (this.regression ? ', -1' : '') + '), lty=c(0' + (this.regression ? ', 1' : '') + '), col=c("black", "red"));';
        this.code = `
points <- mapping.loadPoints(0, mapping.qrect);
if (length(points) > 0) {
first = points$\`${config.attribute1}\`;
second = points$\`${config.attribute2}\`;
plot(first, second, xlab="${config.attribute1}", ylab="${config.attribute2}");
${legend}${isRegression}
}else {
plot.new();
mtext("Empty Dataset");
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
            attribute1: this.attribute1,
            attribute2: this.attribute2,
            regression: this.regression
        };
    }
}
