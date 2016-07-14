import {OperatorType, OperatorTypeDict} from '../operator-type.model';

import {NumericAttributeFilterType, NumericAttributeFilterTypeDict}
  from './numeric-attribute-filter-type.model';
import {RasterValueExtractionType, RasterValueExtractionTypeDict}
  from './raster-value-extraction-type.model';
import {ExpressionType, ExpressionTypeDict}
  from './expression-type.model';
import {ProjectionType, ProjectionTypeDict}
  from './projection-type.model';
import {GFBioSourceType, GFBioSourceTypeDict}
  from './gfbio-source-type.model';
import {GBIFSourceType, GBIFSourceTypeDict}
  from './gbif-source-type.model';
import {RasterSourceType, RasterSourceTypeDict}
  from './raster-source-type.model';
import {HistogramType, HistogramTypeDict}
  from './histogram-type.model';
import {RScriptType, RScriptTypeDict}
  from './r-script-type.model';
import {PointInPolygonFilterType, PointInPolygonFilterTypeDict}
  from './point-in-polygon-filter-type.model';
import {WKTSourceType, WKTSourceTypeDict}
  from './wkt-source-type.model';
import {ABCDSourceType, ABCDSourceTypeDict}
    from './abcd-source-type.model';
import {
    MsgRadianceType,
    MsgReflectanceType, MsgReflectanceTypeDict,
    MsgSolarangleType, MsgSolarangleTypeDict,
    MsgTemperatureType,
    MsgPansharpenType, MsgPansharpenTypeDict,
    MsgCo2CorrectionType,
    MsgSofosGccThermalThresholdType,
} from './msg-types.model';
import { CsvSourceType, CsvSourceTypeDict } from './csv-source-type.model';
import { ClassificationTypeDict, ClassificationType} from './classification-type.model';

/**
 * A simple factory for de-serializing operator types.
 */
export abstract class OperatorTypeFactory {
    /**
     * Create operator type from serialized data.
     */
    static fromDict(dict: OperatorTypeDict): OperatorType {
        console.log("dict", dict);
        switch (dict.operatorType) {
            case NumericAttributeFilterType.TYPE:
                return NumericAttributeFilterType.fromDict(dict as NumericAttributeFilterTypeDict);
            case RasterValueExtractionType.TYPE:
                return RasterValueExtractionType.fromDict(dict as RasterValueExtractionTypeDict);
            case ExpressionType.TYPE:
                return ExpressionType.fromDict(dict as ExpressionTypeDict);
            case ProjectionType.TYPE:
                return ProjectionType.fromDict(dict as ProjectionTypeDict);
            case GFBioSourceType.TYPE:
                return GFBioSourceType.fromDict(dict as GFBioSourceTypeDict);
            case GBIFSourceType.TYPE:
                return GBIFSourceType.fromDict(dict as GBIFSourceTypeDict);
            case RasterSourceType.TYPE:
                return RasterSourceType.fromDict(dict as RasterSourceTypeDict);
            case HistogramType.TYPE:
                return HistogramType.fromDict(dict as HistogramTypeDict);
            case RScriptType.TYPE:
                return RScriptType.fromDict(dict as RScriptTypeDict);
            case PointInPolygonFilterType.TYPE:
                return PointInPolygonFilterType.fromDict(dict as PointInPolygonFilterTypeDict);
            case WKTSourceType.TYPE:
                return WKTSourceType.fromDict(dict as WKTSourceTypeDict);
            case MsgRadianceType.TYPE:
                return MsgRadianceType.fromDict(dict);
            case MsgReflectanceType.TYPE:
                return MsgReflectanceType.fromDict(dict as MsgReflectanceTypeDict);
            case MsgSolarangleType.TYPE:
                return MsgSolarangleType.fromDict(dict as MsgSolarangleTypeDict);
            case MsgTemperatureType.TYPE:
                return MsgTemperatureType.fromDict(dict);
            case MsgPansharpenType.TYPE:
                return MsgPansharpenType.fromDict(dict as MsgPansharpenTypeDict);
            case MsgCo2CorrectionType.TYPE:
                return MsgCo2CorrectionType.fromDict(dict);
            case MsgSofosGccThermalThresholdType.TYPE:
                return MsgSofosGccThermalThresholdType.fromDict(dict);
            case ABCDSourceType.TYPE:
                return ABCDSourceType.fromDict(dict as ABCDSourceTypeDict);
            case CsvSourceType.TYPE:
                return CsvSourceType.fromDict(dict as CsvSourceTypeDict);
            case ClassificationType.TYPE:
                return ClassificationType.fromDict(dict as ClassificationTypeDict);
            default:
                throw 'There is not factory method defined for this operator.';
        }
    }
}
