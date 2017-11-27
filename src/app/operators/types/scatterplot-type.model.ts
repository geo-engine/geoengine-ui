import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultType, ResultTypes} from '../result-type.model';

interface ScatterPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface ScatterPlotTypeDict extends OperatorTypeDict {
    attribute1: string;
    attribute2: string;
    regression: boolean;
    inputType: string;
}

interface ScatterPlotTypeConfig {
    attribute1: string;
    attribute2: string;
    regression: boolean;
    inputType: ResultType;
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
    private inputType: ResultType;
    private resultType: ResultType;

    static fromDict(dict: ScatterPlotTypeDict): ScatterPlotType {
        return new ScatterPlotType({
            attribute1: dict.attribute1,
            attribute2: dict.attribute2,
            regression: dict.regression,
            inputType: ResultTypes.fromCode(dict.inputType),
        });
    }

    constructor(config: ScatterPlotTypeConfig) {
        super();
        this.attribute1 = config.attribute1;
        this.attribute2 = config.attribute2;
        this.regression = config.regression;
        this.inputType = config.inputType;

        const camelInputType = this.inputType.toString().charAt(0).toUpperCase() + this.inputType.toString().substr(1).toLowerCase();

        this.code = `
            features <- mapping.load${camelInputType}(0, mapping.qrect);
            if (length(features) > 0) {
                first = features$\`${config.attribute1}\`;
                second = features$\`${config.attribute2}\`;
                plot(first, second, xlab="${config.attribute1}", ylab="${config.attribute2}");
                ${this.regression ? 'abline(lm(second~first), col="red");' : ''}
                legend(
                    "topright",
                    legend=c("Data Points" ${this.regression ? ', "Regression Line"' : ''}),
                    pch=c(1 ${this.regression ? ', -1' : ''}),
                    lty=c(0 ${this.regression ? ', 1' : ''}),
                    col=c("black", "red")
                );
            } else {
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
            regression: this.regression,
            inputType: this.inputType.getCode(),
        };
    }
}
