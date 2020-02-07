import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultTypes} from '../result-type.model';

interface SpectralOverviewPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface SpectralOverviewPlotTypeDict extends OperatorTypeDict {
    instruments: Array<string>;
}

interface SpectralOverviewPlotTypeConfig {
    instruments: Array<string>;
}

export class SpectralOverviewPlotType extends OperatorType {
    static readonly TYPE = 'spectral-overview-plot';
    static readonly ICON_URL = OperatorType.createIconDataUrl(SpectralOverviewPlotType.TYPE);
    static readonly NAME = 'Spectral Overview Plot';

    private readonly code: string;
    private readonly instruments: Array<string>;

    static fromDict(dict: SpectralOverviewPlotTypeDict): SpectralOverviewPlotType {
        return new SpectralOverviewPlotType(dict);
    }

    constructor(config: SpectralOverviewPlotTypeConfig) {
        super();

        this.instruments = config.instruments;

        const instrument_columns = 'c("' + this.instruments.join('", "') + '")'; // TODO: escape strings
        this.code = `
            library(ggplot2);

            points = mapping.loadPoints(0, mapping.qrect);
            pivot = data.frame(points@data[${instrument_columns}]);

            number_of_series = NROW(points);
            series_length = ${this.instruments.length};

            wave_lengths <- NULL;
            values <- NULL;
            markers <- NULL;
            for (i in 1:number_of_series) {
                wave_lengths <- c(wave_lengths, seq(1, series_length));
                values <- c(values, as.numeric(pivot[i, 1:series_length]));
                markers <- c(markers, rep(toString(i), series_length));
            }

            df <- data.frame(
                wave_length = wave_lengths,
                value = values,
                marker = markers
            );

            plot = ggplot(df, aes(wave_length, value)) + geom_line(aes(colour = marker));

            print(plot);
        `;
    }

    getMappingName(): string {
        return 'r_script';
    }

    getIconUrl(): string {
        return SpectralOverviewPlotType.ICON_URL;
    }

    toString(): string {
        return SpectralOverviewPlotType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['instruments', this.instruments.join(', ')],
            ['code', this.code.toString()],
        ];
    }

    toMappingDict(): SpectralOverviewPlotTypeMappingDict {
        return {
            source: this.code,
            result: ResultTypes.PLOT.getCode(),
        };
    }

    toDict(): SpectralOverviewPlotTypeDict {
        return {
            operatorType: SpectralOverviewPlotType.TYPE,
            instruments: this.instruments,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return SpectralOverviewPlotType.fromDict(this.toDict());
    }

}
