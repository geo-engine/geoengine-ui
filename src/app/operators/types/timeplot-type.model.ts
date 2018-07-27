import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultType, ResultTypes} from '../result-type.model';

interface TimePlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface TimePlotTypeDict extends OperatorTypeDict {
    attribute: string;
    isGrouping: boolean;
    grouping: string;
    time: string;
    inputType: string;
}

interface TimePlotTypeConfig {
    attribute: string;
    isGrouping: boolean;
    grouping: string;
    time: string;
    inputType: ResultType;
}

export class TimePlotType extends OperatorType {
    private static _TYPE = 'timeplot';
    private static _ICON_URL = OperatorType.createIconDataUrl(TimePlotType._TYPE);
    private static _NAME = 'Time Plot';

    static get TYPE(): string { return TimePlotType._TYPE; }
    static get ICON_URL(): string { return TimePlotType._ICON_URL; }
    static get NAME(): string { return TimePlotType._NAME; }

    private code: string;
    private attribute: string;
    private isGrouping: boolean;
    private grouping: string;
    private time: string;
    private inputType: ResultType;
    private resultType: ResultType;

    static fromDict(dict: TimePlotTypeDict): TimePlotType {
        return new TimePlotType({
            attribute: dict.attribute,
            isGrouping: dict.isGrouping,
            grouping: dict.grouping,
            time: dict.time,
            inputType: ResultTypes.fromCode(dict.inputType),
        });
    }

    constructor(config: TimePlotTypeConfig) {
        super();
        this.attribute = config.attribute;
        this.isGrouping = config.isGrouping;
        this.grouping = config.grouping;
        this.time = config.time;
        this.inputType = config.inputType;
        this.resultType = ResultTypes.PLOT;

        const camelInputType = this.inputType.toString().charAt(0).toUpperCase() + this.inputType.toString().substr(1).toLowerCase();
        const grouping = this.isGrouping ? 'grouping = data$\`' + config.grouping + '\`;' : '';
        const df = this.isGrouping ? 'data.frame(start, attribute, grouping);' :
            'data.frame(start, attribute);';
        const ggplot = this.isGrouping ? 'ggplot(df, aes(x=start, y=attribute, group=grouping, color=grouping))' :
            'ggplot(df, aes(x=start,y=attribute))';
        this.code = `
library(ggplot2);
data <- mapping.load${camelInputType}(0, mapping.qrect);

if (all(names(data) != 'time_start')) {
plot.new();
mtext("Dataset has no temporal information");
} else {
attr = attributes(data@data)$names[1];
query_start = mapping.qrect$t1;
query_end = mapping.qrect$t2;
query_lim_posix = c(as.POSIXct(query_start, origin="1970-01-01", tz = "GMT"), as.POSIXct(query_end, origin="1970-01-01", tz = "GMT"));
start = as.POSIXct(data$time_start, origin="1970-01-01", tz="GMT");
attribute = data$\`${this.attribute}\`;
${grouping}
df = ${df}
times = seq(mapping.qrect$t1, mapping.qrect$t2, (mapping.qrect$t2 - mapping.qrect$t1)/10)
p = (
  ${ggplot}
  + geom_line()
  + geom_point()
  + scale_x_datetime(limits=query_lim_posix)
  + xlab("Time") + ylab(\"${this.attribute}\")
)
print(p)
}`;
    }

    getMappingName(): string {
        return 'r_script';
    }

    getIconUrl(): string {
        return TimePlotType.ICON_URL;
    }

    toString(): string {
        return TimePlotType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['code', this.code.toString()],
            ['resultType', this.resultType.toString()],
        ];
    }

    toMappingDict(): TimePlotTypeMappingDict {
        return {
            source: this.code,
            result: this.resultType.getCode(),
        };
    }

    toDict(): TimePlotTypeDict {
        return {
            operatorType: TimePlotType.TYPE,
            attribute: this.attribute,
            isGrouping: this.isGrouping,
            grouping: this.grouping,
            time: this.time,
            inputType: this.inputType.getCode(),
        };
    }

}
