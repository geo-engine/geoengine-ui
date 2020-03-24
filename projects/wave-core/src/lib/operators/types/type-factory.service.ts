import {OperatorType, OperatorTypeDict} from '../operator-type.model';

import {NumericAttributeFilterType, NumericAttributeFilterTypeDict} from './numeric-attribute-filter-type.model';
import {RasterValueExtractionType, RasterValueExtractionTypeDict} from './raster-value-extraction-type.model';
import {ExpressionType, ExpressionTypeDict} from './expression-type.model';
import {ProjectionType, ProjectionTypeDict} from './projection-type.model';
import {GFBioSourceType, GFBioSourceTypeDict} from './gfbio-source-type.model';
import {RasterSourceType, RasterSourceTypeDict} from './raster-source-type.model';
import {HistogramType, HistogramTypeDict} from './histogram-type.model';
import {RScriptType, RScriptTypeDict} from './r-script-type.model';
import {PointInPolygonFilterType, PointInPolygonFilterTypeDict} from './point-in-polygon-filter-type.model';
import {WKTSourceType, WKTSourceTypeDict} from './wkt-source-type.model';
import {
    MsgCo2CorrectionType,
    MsgPansharpenType,
    MsgPansharpenTypeDict,
    MsgRadianceType,
    MsgReflectanceType,
    MsgReflectanceTypeDict,
    MsgSofosGccThermalThresholdType,
    MsgSolarangleType,
    MsgSolarangleTypeDict,
    MsgTemperatureType,
} from './msg-types.model';
import {CsvSourceType, CsvSourceTypeDict} from './csv-source-type.model';
import {ClassificationType, ClassificationTypeDict} from './classification-type.model';
import {
    FeatureCollectionDBSourceType,
    FeatureCollectionDBSourceTypeDict
} from './feature-collection-db-source-type.model';
import {TextualAttributeFilterType, TextualAttributeFilterTypeDict} from './textual-attribute-filter-type.model';
import {GdalSourceType, GdalSourceTypeDict} from './gdal-source-type.model';
import {ScatterPlotType, ScatterPlotTypeDict} from './scatterplot-type.model';
import {BoxPlotType, BoxPlotTypeDict} from './boxplot-type.model';
import {PieChartType, PieChartTypeDict} from './piechart-type.model';
import {RasterizePolygonType, RasterizePolygonTypeDict} from './rasterize-polygon-type.model';
import {HeatmapType, HeatmapTypeDict} from './heatmap-type.model';
import {OgrSourceType, OgrSourceTypeDict} from './ogr-source-type.model';
import {OgrRawSourceType, OgrRawSourceTypeDict} from './ogr-raw-source-type.model';
import {ChronicleDBSourceType, ChronicleDBSourceTypeDict} from './chronicle-db-source-type.model';
import {TimePlotType, TimePlotTypeDict} from './timeplot-type.model';
import {StatisticsType, StatisticsTypeDict} from './statistics-type.model';
import {RgbaCompositeType, RgbaCompositeTypeDict} from './rgba-composite-type.model';
import {SpectralOverviewPlotType, SpectralOverviewPlotTypeDict} from './spectral-overview-plot-type.model';

type Type = string;
type Deserializer = (dict: OperatorTypeDict) => OperatorType;

/**
 * A simple factory for de-serializing operator types.
 */
export class OperatorTypeFactory {

    protected static readonly typeDeserializers: Map<Type, Deserializer> = OperatorTypeFactory.defaultDeserializers();

    protected static defaultDeserializers(): Map<Type, Deserializer> {
        const typeDeserializers = new Map();

        typeDeserializers.set(
            NumericAttributeFilterType.TYPE,
            dict => NumericAttributeFilterType.fromDict(dict as NumericAttributeFilterTypeDict),
        );
        typeDeserializers.set(
            TextualAttributeFilterType.TYPE,
            dict => TextualAttributeFilterType.fromDict(dict as TextualAttributeFilterTypeDict),
        );
        typeDeserializers.set(
            RasterValueExtractionType.TYPE,
            dict => RasterValueExtractionType.fromDict(dict as RasterValueExtractionTypeDict),
        );
        typeDeserializers.set(
            ExpressionType.TYPE,
            dict => ExpressionType.fromDict(dict as ExpressionTypeDict),
        );
        typeDeserializers.set(
            ProjectionType.TYPE,
            dict => ProjectionType.fromDict(dict as ProjectionTypeDict),
        );
        typeDeserializers.set(
            GFBioSourceType.TYPE,
            dict => GFBioSourceType.fromDict(dict as GFBioSourceTypeDict),
        );
        typeDeserializers.set(
            RasterSourceType.TYPE,
            dict => RasterSourceType.fromDict(dict as RasterSourceTypeDict),
        );
        typeDeserializers.set(
            GdalSourceType.TYPE,
            dict => GdalSourceType.fromDict(dict as GdalSourceTypeDict),
        );
        typeDeserializers.set(
            OgrSourceType.TYPE,
            dict => OgrSourceType.fromDict(dict as OgrSourceTypeDict),
        );
        typeDeserializers.set(
            HistogramType.TYPE,
            dict => HistogramType.fromDict(dict as HistogramTypeDict),
        );
        typeDeserializers.set(
            RScriptType.TYPE,
            dict => RScriptType.fromDict(dict as RScriptTypeDict),
        );
        typeDeserializers.set(
            PointInPolygonFilterType.TYPE,
            dict => PointInPolygonFilterType.fromDict(dict as PointInPolygonFilterTypeDict),
        );
        typeDeserializers.set(
            WKTSourceType.TYPE,
            dict => WKTSourceType.fromDict(dict as WKTSourceTypeDict),
        );
        typeDeserializers.set(
            MsgRadianceType.TYPE,
            dict => MsgRadianceType.fromDict(dict),
        );
        typeDeserializers.set(
            MsgReflectanceType.TYPE,
            dict => MsgReflectanceType.fromDict(dict as MsgReflectanceTypeDict),
        );
        typeDeserializers.set(
            MsgSolarangleType.TYPE,
            dict => MsgSolarangleType.fromDict(dict as MsgSolarangleTypeDict),
        );
        typeDeserializers.set(
            MsgTemperatureType.TYPE,
            dict => MsgTemperatureType.fromDict(dict),
        );
        typeDeserializers.set(
            MsgPansharpenType.TYPE,
            dict => MsgPansharpenType.fromDict(dict as MsgPansharpenTypeDict),
        );
        typeDeserializers.set(
            MsgCo2CorrectionType.TYPE,
            dict => MsgCo2CorrectionType.fromDict(dict),
        );
        typeDeserializers.set(
            MsgSofosGccThermalThresholdType.TYPE,
            dict => MsgSofosGccThermalThresholdType.fromDict(dict),
        );
        typeDeserializers.set(
            CsvSourceType.TYPE,
            dict => CsvSourceType.fromDict(dict as CsvSourceTypeDict),
        );
        typeDeserializers.set(
            ClassificationType.TYPE,
            dict => ClassificationType.fromDict(dict as ClassificationTypeDict),
        );
        typeDeserializers.set(
            FeatureCollectionDBSourceType.TYPE,
            dict => FeatureCollectionDBSourceType.fromDict(dict as FeatureCollectionDBSourceTypeDict),
        );
        typeDeserializers.set(
            ScatterPlotType.TYPE,
            dict => ScatterPlotType.fromDict(dict as ScatterPlotTypeDict),
        );
        typeDeserializers.set(
            BoxPlotType.TYPE,
            dict => BoxPlotType.fromDict(dict as BoxPlotTypeDict),
        );
        typeDeserializers.set(
            PieChartType.TYPE,
            dict => PieChartType.fromDict(dict as PieChartTypeDict),
        );
        typeDeserializers.set(
            RasterizePolygonType.TYPE,
            dict => RasterizePolygonType.fromDict(dict as RasterizePolygonTypeDict),
        );
        typeDeserializers.set(
            HeatmapType.TYPE,
            dict => HeatmapType.fromDict(dict as HeatmapTypeDict),
        );
        typeDeserializers.set(
            SpectralOverviewPlotType.TYPE,
            dict => SpectralOverviewPlotType.fromDict(dict as SpectralOverviewPlotTypeDict),
        );
        typeDeserializers.set(
            StatisticsType.TYPE,
            dict => StatisticsType.fromDict(dict as StatisticsTypeDict),
        );
        typeDeserializers.set(
            TimePlotType.TYPE,
            dict => TimePlotType.fromDict(dict as TimePlotTypeDict),
        );
        typeDeserializers.set(
            RgbaCompositeType.TYPE,
            dict => RgbaCompositeType.fromDict(dict as RgbaCompositeTypeDict),
        );
        typeDeserializers.set(
            ChronicleDBSourceType.TYPE,
            dict => ChronicleDBSourceType.fromDict(dict as ChronicleDBSourceTypeDict),
        );
        typeDeserializers.set(
            OgrRawSourceType.TYPE,
            dict => OgrRawSourceType.fromDict(dict as OgrRawSourceTypeDict),
        );

        return typeDeserializers;
    }

    /**
     * Add a new type deserializer (fromDict) to the factory
     */
    static addType(type: Type, fromDict: Deserializer) {
        OperatorTypeFactory.typeDeserializers.set(type, fromDict);
    }

    /**
     * Create operator type from serialized data.
     */
    static fromDict(dict: OperatorTypeDict): OperatorType {
        const fromDict = OperatorTypeFactory.typeDeserializers.get(dict.operatorType);
        if (fromDict) {
            return fromDict(dict);
        } else {
            throw Error(`There is not factory method defined for operator »${dict.operatorType}«.`);
        }
    }
}
