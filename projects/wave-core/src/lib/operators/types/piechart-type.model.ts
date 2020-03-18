import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultType, ResultTypes} from '../result-type.model';

interface PieChartTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface PieChartTypeDict extends OperatorTypeDict {
    attribute: string;
    inputType: string;
}

interface PieChartTypeConfig {
    attribute: string;
    inputType: ResultType;
}

/**
 * The R type.
 */
export class PieChartType extends OperatorType {
    private static _TYPE = 'piechart';
    private static _ICON_URL = OperatorType.createIconDataUrl(PieChartType._TYPE);
    private static _NAME = 'Pie Chart';

    static get TYPE(): string { return PieChartType._TYPE; }
    static get ICON_URL(): string { return PieChartType._ICON_URL; }
    static get NAME(): string { return PieChartType._NAME; }

    private code: string;
    private attribute: string;
    private inputType: ResultType;
    private resultType: ResultType;

    static fromDict(dict: PieChartTypeDict): PieChartType {
        return new PieChartType({
            attribute: dict.attribute,
            inputType: ResultTypes.fromCode(dict.inputType),
        });
    }

    constructor(config: PieChartTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.inputType = config.inputType;
        this.resultType = ResultTypes.PLOT;

        const camelInputType = this.inputType.toString().charAt(0).toUpperCase() + this.inputType.toString().substr(1).toLowerCase();

        this.code = `
            features <- mapping.load${camelInputType}(0, mapping.qrect);

            if (length(features) > 0) {

                kv <- table(features$\`${config.attribute}\`);

                labels <- paste("(",names(kv),")", "\n", kv, sep="");

                pie(kv, labels = labels);

            } else {

                plot.new();

                mtext("Empty Dataset");

            }

        `;

    }

    getMappingName(): string {
        return 'r_script';
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
            inputType: this.inputType.getCode(),
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return PieChartType.fromDict(this.toDict()); // TODO: add modifications
    }
}
