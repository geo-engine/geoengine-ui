import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict, ResultTypes, Unit, UnitDict} from 'wave-core';


interface SpectralOverviewPlotTypeMappingDict extends OperatorTypeMappingDict {
    source: string;
    result: string;
}

export interface SpectralOverviewPlotTypeDict extends OperatorTypeDict {
    instruments: Array<string>;
    waveLenghts: Array<number>;
    idAttribute?: string;
    unit: UnitDict;
}

interface SpectralOverviewPlotTypeConfig {
    instruments: Array<string>;
    waveLenghts: Array<number>;
    idAttribute?: string;
    unit: Unit;
}

export class SpectralOverviewPlotType extends OperatorType {
    static readonly TYPE = 'spectral-overview-plot';
    static readonly ICON_URL = OperatorType.createIconDataUrl(SpectralOverviewPlotType.TYPE);
    static readonly NAME = 'Spectral Overview Plot';

    private readonly code: string;
    private readonly instruments: Array<string>;
    private readonly waveLenghts: Array<number>;
    private readonly idAttribute: string | undefined;
    private readonly unit: Unit;

    static fromDict(dict: SpectralOverviewPlotTypeDict): SpectralOverviewPlotType {
        return new SpectralOverviewPlotType({
            instruments: dict.instruments,
            waveLenghts: dict.waveLenghts,
            idAttribute: dict.idAttribute,
            unit: Unit.fromDict(dict.unit),
        });
    }

    constructor(config: SpectralOverviewPlotTypeConfig) {
        super();

        this.instruments = config.instruments;
        this.waveLenghts = config.waveLenghts;
        this.idAttribute = config.idAttribute;
        this.unit = config.unit;

        const instrument_columns = 'c(' + this.instruments.map(text => JSON.stringify(text)).join(', ') + ')';
        let unit_label = this.unit.measurement;
        if (this.unit.unit && this.unit.unit !== 'unknown') {
            unit_label += ` in ${this.unit.unit}`;
        }
        unit_label = JSON.stringify(unit_label);

        this.code = `
            library(ggplot2);

            points = try(mapping.loadPoints(0, mapping.qrect), silent = T);

            if (isS4(points)) {
                pivot = data.frame(points@data[${instrument_columns}]);
                #
                number_of_series = NROW(points);
                series_length = ${this.instruments.length};
                #
                wave_lengths <- c(${this.waveLenghts.join(', ')});
                values <- NULL;
                markers <- NULL;
                #
                for (i in 1:number_of_series) {
                    values <- c(values, as.numeric(pivot[i, 1:series_length]));
                    marker <- ${this.idAttribute ? `toString(points@data[['${this.idAttribute}']][[i]])` : 'toString(i)'};
                    markers <- c(markers, rep(marker, series_length));
                }
                #
                df <- data.frame(wave_length = wave_lengths, value = values, marker = markers);
                #
                x_axis_markers <- data.frame(wave_length = wave_lengths, value = -Inf);
                #
                plot = ggplot(df, aes(wave_length, value)) +
                    geom_line(aes(colour = marker)) +
                    geom_point(data = x_axis_markers, colour = "black", shape = 3, size = 3) +
                    labs(x = "Wave Length in nm", y = ${unit_label}, colour = "Marker")
                #
                print(plot);
            } else {
                plot.new();
                mtext("No marker points in viewport.");
            }
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
            idAttribute: this.idAttribute,
            waveLenghts: this.waveLenghts,
            unit: this.unit.toDict(),
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return SpectralOverviewPlotType.fromDict(this.toDict());
    }

}
