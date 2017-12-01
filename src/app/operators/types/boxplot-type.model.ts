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
}

interface BoxPlotTypeConfig {
    notch: boolean;
    mean: boolean;
    range: number;
    attributes: string[];
}

export class BoxPlotType extends OperatorType {
    private static _TYPE = 'r_script';
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
    private resultType: ResultType;

    static fromDict(dict: BoxPlotTypeDict): BoxPlotType {
        return new BoxPlotType({
            notch: dict.notch,
            mean: dict.mean,
            range: dict.range,
            attributes: dict.attributes,
        });
    }

    constructor(config: BoxPlotTypeConfig) {
        super();
        this.notch = config.notch;
        this.mean = config.mean;
        this.range = config.range;
        this.attributes = config.attributes;
        let attributeCode = '';
        let notchCode = this.notch.toString().toUpperCase();
        let dataCode = 'plot.data <- rbind(';
        let meanCode = this.mean ? ' + stat_summary(fun.y=mean, colour="darkred", geom="point", shape=18, size=3,show_guide = FALSE) + stat_summary(fun.y=mean, colour="black", geom="text", show_guide = FALSE, vjust=-0.7, aes( label=round(..y.., digits=1)))' : '';
        for (let i = 0; i < this.attributes.length; i++) {
            attributeCode += 'dat' + i + ' <- data.frame(group = "' + this.attributes[i] + '", value = points$\`' +
                this.attributes[i] + '\`);' + (i === this.attributes.length - 1 ? '' : '\n');
            dataCode += 'dat' + i + (i === this.attributes.length - 1 ? ');' : ', ');
        }
        this.code = `library(ggplot2);
points <- mapping.loadPoints(0, mapping.qrect);
if (length(points) > 0) {
${attributeCode}
${dataCode}
p <- ggplot(plot.data, aes(x=group, y=value, fill=group)) + geom_boxplot(notch = ${notchCode})${meanCode};
print(p);
}else {
plot.new();
mtext("Empty Dataset");
}
`;
        console.log(this.code);
        console.log(this.attributes);
        this.resultType = ResultTypes.PLOT;
    }

    getMappingName(): string {
        return BoxPlotType.TYPE;
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
            attributes: this.attributes
        };
    }
}
