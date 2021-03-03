import {MappingRequestParameters, ParametersType} from './request-parameters.model';
import {Projection, Projections} from '../operators/projection.model';
import {TimeInterval} from '../time/time.model';
import {DataTypes} from '../operators/datatype.model';
import {ResultTypes} from '../operators/result-type.model';
import {FeatureCollectionDBSourceType} from '../operators/types/feature-collection-db-source-type.model';
import {Operator} from '../operators/operator.model';
import {Unit} from '../operators/unit.model';

export interface FeatureDBList {
    data_sets: Array<FeatureDBListEntry>;
    result: true;
}

export interface FeatureDBListEntry {
    has_time: boolean;
    owner: string;
    data_set_name: string;
    numeric_attributes: Array<string>;
    textual_attributes: Array<string>;
    type: 'points' | 'lines' | 'polygons';
}

export class FeatureDBServiceRequestParameters extends MappingRequestParameters {
    constructor(config: {request: string; sessionToken: string; parameters?: ParametersType}) {
        super({
            service: 'featurecollectiondb',
            request: config.request,
            sessionToken: config.sessionToken,
            parameters: config.parameters,
        });
    }
}

export class FeatureDBServiceListParameters extends FeatureDBServiceRequestParameters {
    constructor(config: {sessionToken: string}) {
        super({
            request: 'list',
            sessionToken: config.sessionToken,
        });
    }
}

export class FeatureDBServiceUploadParameters extends FeatureDBServiceRequestParameters {
    constructor(config: {sessionToken: string; name: string; crs: Projection; query: string; type: 'points' | 'lines' | 'polygons'}) {
        super({
            request: 'save',
            sessionToken: config.sessionToken,
            parameters: {
                name: config.name,
                crs: config.crs.getCode(),
                query: config.query,
                type: config.type,
                bbox:
                    config.crs.getCode() === 'EPSG:4326'
                        ? config.crs.getExtent()[1] +
                          ',' +
                          config.crs.getExtent()[0] +
                          ',' +
                          config.crs.getExtent()[3] +
                          ',' +
                          config.crs.getExtent()[2]
                        : config.crs.getExtent().join(','),
                time: TimeInterval.maximal().asRequestString(),
            },
        });
    }
}

export function featureDBListEntryToOperator(entry: FeatureDBListEntry) {
    const attributes = [...entry.numeric_attributes, ...entry.textual_attributes];

    const dataTypes = new Map();
    for (const attributeName of attributes) {
        if (entry.numeric_attributes.indexOf(attributeName) >= 0) {
            dataTypes.set(attributeName, DataTypes.Float64);
        } else {
            dataTypes.set(attributeName, DataTypes.Alphanumeric);
        }
    }

    const units = new Map();
    for (const attributeName of attributes) {
        units.set(attributeName, Unit.defaultUnit);
    }

    return {
        name: entry.data_set_name,
        operator: new Operator({
            operatorType: new FeatureCollectionDBSourceType({
                owner: entry.owner,
                data_set_name: entry.data_set_name,
            }),
            resultType: ResultTypes.fromCode(entry.type),
            projection: Projections.WGS_84, // TODO: this must be changed on mapping first and then here
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        }),
    };
}
