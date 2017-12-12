import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultTypes, ResultType} from '../result-type.model';

interface BoxPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface BoxPlotTypeDict extends OperatorTypeDict {
    notch: boolean;
    mean: boolean;
    range: number;
    attributes: string[];
    inputType: string;
}

interface BoxPlotTypeConfig {
    notch: boolean;
    mean: boolean;
    range: number;
    attributes: string[];
    inputType: ResultType;
}

export class BoxPlotType extends OperatorType {
    private static _TYPE = 'boxplot';
    private static _ICON_URL = OperatorType.createIconDataUrl(BoxPlotType._TYPE);
    private static _NAME = 'Box Plot';

    static get TYPE(): string { return BoxPlotType._TYPE; }
    static get ICON_URL(): string { return BoxPlotType._ICON_URL; }
    static get NAME(): string { return BoxPlotType._NAME; }

    private code: string;
    private notch: boolean;
    private mean: boolean;
    private range: number;
    private attributes: string[];
    private inputType: ResultType;
    private resultType: ResultType;

    static fromDict(dict: BoxPlotTypeDict): BoxPlotType {
        return new BoxPlotType({
            notch: dict.notch,
            mean: dict.mean,
            range: dict.range,
            attributes: dict.attributes,
            inputType: ResultTypes.fromCode(dict.inputType),
        });
    }

    constructor(config: BoxPlotTypeConfig) {
        super();
        this.notch = config.notch;
        this.mean = config.mean;
        this.range = config.range;
        this.attributes = config.attributes;
        this.inputType = config.inputType;

        const camelInputType = this.inputType.toString().charAt(0).toUpperCase() + this.inputType.toString().substr(1).toLowerCase();

        this.code = `
            library(ggplot2);

            features <- mapping.load${camelInputType}(0, mapping.qrect);

            if (length(features) > 0) {

                ${this.attributes.map((attribute, i) => {
                    return `dat${i} <- data.frame(group = "${attribute}", value = features$\`${attribute}\`);`;
                }).join('\n')}

                plot.data <- rbind(
                    ${this.attributes.map((attribute, i) => `dat${i}`).join(', ')}
                );

                p <- (
                    ggplot(plot.data, aes(x=group, y=value, fill=group))
                    + geom_boxplot(notch = ${this.notch.toString().toUpperCase()})
                    ${this.mean ? '+ stat_summary(fun.y=mean, colour="darkred", geom="point", show_guide = FALSE, shape=18, size=3)' : ''}
                    ${this.mean ? '+ stat_summary(fun.y=mean, colour="black",   geom="text",  show_guide = FALSE, vjust=-0.7, aes(label=round(..y.., digits=1)))' : ''}
                );

                print(p);

            } else {

                plot.new();

                mtext("Empty Dataset");

            }
        `;
        // console.log(this.code);
        // console.log(this.attributes);
        this.resultType = ResultTypes.PLOT;
    }

    getMappingName(): string {
        return 'r_script';
    }

    getIconUrl(): string {
        return BoxPlotType.ICON_URL;
    }

    toString(): string {
        return BoxPlotType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['code', this.code.toString()],
            ['resultType', this.resultType.toString()],
        ];
    }

    toMappingDict(): BoxPlotTypeMappingDict {
        return {
            source: this.code,
            result: this.resultType.getCode(),
        };
    }

    toDict(): BoxPlotTypeDict {
        return {
            operatorType: BoxPlotType.TYPE,
            notch: this.notch,
            mean: this.mean,
            range: this.range,
            attributes: this.attributes,
            inputType: this.inputType.getCode(),
        };
    }
}
