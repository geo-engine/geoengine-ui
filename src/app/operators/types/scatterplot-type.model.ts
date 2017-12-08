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
        let plotCode = ' + geom_point(shape=1)';
        if(this.regression) {
            plotCode += ' + geom_smooth(method=lm, se=FALSE)'
        }
        this.code = `library(ggplot2);
points <- mapping.loadPoints(0, mapping.qrect);
if (length(points) > 0) {
dat <- data.frame(xVal = points$\`${config.attribute1}\`, yVal = points$\`${config.attribute2}\`);
p <- ggplot(dat, aes(x=xVal, y=yVal))${plotCode} + labs(x = "${config.attribute1}", y = "${config.attribute2}");
print(p);
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
