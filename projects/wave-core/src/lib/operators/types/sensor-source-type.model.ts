import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

export interface SensorSourceTypeConfig {
    sensorTypes: Array<String>
}

interface SensorSourceTypeMappingDict extends OperatorTypeMappingDict {
    sensorTypes: Array<String>
}

export interface SensorSourceTypeDict extends OperatorTypeDict  {
    sensorTypes: Array<String>
}

/**
 * The Sensor source type.
 */
export class SensorSourceType extends OperatorType {
    private static _TYPE = 'natur40_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(SensorSourceType._TYPE);
    private static _NAME = 'Sensor Source';

    static get TYPE(): string { return SensorSourceType._TYPE; }
    static get ICON_URL(): string { return SensorSourceType._ICON_URL; }
    static get NAME(): string { return SensorSourceType._NAME; }

    private sensorTypes: Array<String>;

    constructor(config: SensorSourceTypeConfig) {
        super();
        this.sensorTypes = config.sensorTypes;
    }

    static fromDict(dict: SensorSourceTypeDict): SensorSourceType {
        return new SensorSourceType({
            sensorTypes: dict.sensorTypes
        });
    }

    getMappingName(): string {
        return SensorSourceType.TYPE;
    }

    getIconUrl(): string {
        return SensorSourceType.ICON_URL;
    }

    toString(): string {
        return SensorSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['sensorTypes', this.sensorTypes.join((', '))],
        ];
    }

    toMappingDict(): SensorSourceTypeMappingDict {
        return {
            sensorTypes: this.sensorTypes
        };
    }

    toDict(): SensorSourceTypeDict {
        return {
            operatorType: SensorSourceType.TYPE,
            sensorTypes: this.sensorTypes
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return SensorSourceType.fromDict(this.toDict()); // TODO: add modifications
    }
}
