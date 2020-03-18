import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

/**
 * The MSG radiance type.
 */
export class MsgRadianceType extends OperatorType {
    private static _TYPE = 'meteosat_radiance';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgRadianceType._TYPE);
    private static _NAME = 'MSG Radiance Operator';

    static get TYPE(): string {
        return MsgRadianceType._TYPE;
    }

    static get ICON_URL(): string {
        return MsgRadianceType._ICON_URL;
    }

    static get NAME(): string {
        return MsgRadianceType._NAME;
    }

    constructor(config: {}) {
        super();
    }

    static fromDict(dict: OperatorTypeDict): MsgRadianceType {
        return new MsgRadianceType({});
    }

    getMappingName(): string {
        return MsgRadianceType.TYPE;
    }

    getIconUrl(): string {
        return MsgRadianceType.ICON_URL;
    }

    toString(): string {
        return MsgRadianceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): OperatorTypeMappingDict {
        return {};
    }

    toDict(): OperatorTypeDict {
        return {
            operatorType: MsgRadianceType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgRadianceType.fromDict(this.toDict()); // TODO: add modifications
    }
}

/* The MSG reflectance type */
interface MsgReflectanceTypeMappingDict extends OperatorTypeMappingDict {
    isHrv: boolean;
    solarCorrection: boolean;
    forceSatellite?: MeteosatSatelliteName;
}

export interface MsgReflectanceTypeDict extends OperatorTypeDict {
    isHrv: boolean;
    solarCorrection: boolean;
    forceSatelliteName?: MeteosatSatelliteName;
}

interface MsgReflectanceTypeConfig {
    isHrv: boolean;
    solarCorrection: boolean;
    forceSatelliteName?: MeteosatSatelliteName;
}

export type MeteosatSatelliteName = 'Meteosat-8' | 'Meteosat-9' | 'Meteosat-10' | 'Meteosat-11';

/**
 * The MSG radiance type.
 */
export class MsgReflectanceType extends OperatorType {
    private static _TYPE = 'meteosat_reflectance';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgReflectanceType._TYPE);
    private static _NAME = 'MSG Reflectance Operator';

    static get TYPE(): string { return MsgReflectanceType._TYPE; }
    static get ICON_URL(): string { return MsgReflectanceType._ICON_URL; }
    static get NAME(): string { return MsgReflectanceType._NAME; }

    private isHrv: boolean = false;
    private solarCorrection: boolean = true;
    private forceSatelliteName: MeteosatSatelliteName = undefined;
    private forceSatellite: boolean = false;

    constructor(config: MsgReflectanceTypeConfig) {
        super();
        this.isHrv = config.isHrv;
        this.solarCorrection = config.solarCorrection;
        if (config.forceSatelliteName) {
            this.forceSatelliteName = config.forceSatelliteName;
        }
        this.forceSatellite = this.forceSatelliteName !== undefined;
    }

    static fromDict(dict: MsgReflectanceTypeDict): MsgReflectanceType {
        return new MsgReflectanceType(dict);
    }

    getMappingName(): string { return MsgReflectanceType.TYPE; }

    getIconUrl(): string { return MsgReflectanceType.ICON_URL; }

    toString(): string { return MsgReflectanceType.NAME; }

    getParametersAsStrings(): Array<[string, string]> { return []; }

    toMappingDict(): MsgReflectanceTypeMappingDict {
        const config: MsgReflectanceTypeMappingDict = {
            isHrv: this.isHrv,
            solarCorrection: this.solarCorrection,
        };
        if (this.forceSatellite && this.forceSatelliteName) {
            config.forceSatellite = this.forceSatelliteName;
        }
        return config;
    }

    toDict(): MsgReflectanceTypeDict {
        let dict: MsgReflectanceTypeDict = {
            operatorType: MsgReflectanceType.TYPE,
            isHrv: this.isHrv,
            solarCorrection: this.solarCorrection,
        };
        if (this.forceSatellite && this.forceSatelliteName) {
            dict['forceSatelliteName'] = this.forceSatelliteName;
        }
        return dict;
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgRadianceType.fromDict(this.toDict()); // TODO: add modifications
    }

}

/* The MSG solarangle type */
interface MsgSolarangleTypeMappingDict extends OperatorTypeMappingDict {
    solarangle: string;
}

export interface MsgSolarangleTypeDict extends OperatorTypeDict {
    solarangle: SolarangleName;
}

interface MsgSolarangleTypeConfig {
    solarangle: SolarangleName;
}

export type SolarangleName = 'azimuth' | 'zenith';

/**
 * The MSG solarangle type.
 */
export class MsgSolarangleType extends OperatorType {
    private static _TYPE = 'meteosat_solar_angle';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgSolarangleType._TYPE);
    private static _NAME = 'MSG Solarangle Operator';

    static get TYPE(): string { return MsgSolarangleType._TYPE; }
    static get ICON_URL(): string { return MsgSolarangleType._ICON_URL; }
    static get NAME(): string { return MsgSolarangleType._NAME; }

    private solarangle: SolarangleName;

    constructor(config: MsgSolarangleTypeConfig) {
        super();
        this.solarangle = config.solarangle;
    }

    static fromDict(dict: MsgSolarangleTypeDict): MsgRadianceType {
        return new MsgRadianceType(dict);
    }

    getMappingName(): string {
        return MsgSolarangleType.TYPE;
    }

    getIconUrl(): string {
        return MsgSolarangleType.ICON_URL;
    }

    toString(): string {
        return MsgSolarangleType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): MsgSolarangleTypeMappingDict {
        return {
            solarangle: this.solarangle,
        };
    }

    toDict(): MsgSolarangleTypeDict {
        return {
            operatorType: MsgSolarangleType.TYPE,
            solarangle: this.solarangle,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgSolarangleType.fromDict(this.toDict()); // TODO: add modifications
    }

}

/**
 * The MSG temperature type.
 */
export class MsgTemperatureType extends OperatorType {
    private static _TYPE = 'meteosat_temperature';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgTemperatureType._TYPE);
    private static _NAME = 'MSG Temperature Operator';

    static get TYPE(): string {
        return MsgTemperatureType._TYPE;
    }

    static get ICON_URL(): string {
        return MsgTemperatureType._ICON_URL;
    }

    static get NAME(): string {
        return MsgTemperatureType._NAME;
    }

    constructor(config: {}) {
        super();
    }

    static fromDict(dict: OperatorTypeDict): MsgTemperatureType {
        return new MsgTemperatureType(dict);
    }

    getMappingName(): string {
        return MsgTemperatureType.TYPE;
    }

    getIconUrl(): string {
        return MsgTemperatureType.ICON_URL;
    }

    toString(): string {
        return MsgTemperatureType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): OperatorTypeMappingDict {
        return {};
    }

    toDict(): OperatorTypeDict {
        return {
            operatorType: MsgTemperatureType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgTemperatureType.fromDict(this.toDict()); // TODO: add modifications
    }

}

/* The MSG pansharpen type */
interface MsgPansharpenTypeMappingDict extends OperatorTypeMappingDict {}

export interface MsgPansharpenTypeDict extends OperatorTypeDict {}

interface MsgPansharpenTypeConfig {}

/**
 * The MSG pansharpen type.
 */
export class MsgPansharpenType extends OperatorType {
    private static _TYPE = 'meteosat_pansharpening';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgPansharpenType._TYPE);
    private static _NAME = 'MSG Pansharpen Operator';

    static get TYPE(): string {
        return MsgPansharpenType._TYPE;
    }

    static get ICON_URL(): string {
        return MsgPansharpenType._ICON_URL;
    }

    static get NAME(): string {
        return MsgPansharpenType._NAME;
    }

    constructor(config: MsgPansharpenTypeConfig) {
        super();
    }

    static fromDict(dict: MsgPansharpenTypeDict): MsgPansharpenType {
        return new MsgPansharpenType(dict);
    }

    getMappingName(): string {
        return MsgPansharpenType.TYPE;
    }

    getIconUrl(): string {
        return MsgPansharpenType.ICON_URL;
    }

    toString(): string {
        return MsgPansharpenType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): MsgPansharpenTypeMappingDict {
        return {};
    }

    toDict(): MsgPansharpenTypeDict {
        return {
            operatorType: MsgPansharpenType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgPansharpenType.fromDict(this.toDict()); // TODO: add modifications
    }

}

/**
 * The MSG temperature type.
 */
export class MsgCo2CorrectionType extends OperatorType {
    private static _TYPE = 'meteosat_co2correction';
    private static _ICON_URL = OperatorType.createIconDataUrl(MsgCo2CorrectionType._TYPE);
    private static _NAME = 'MSG CO2 Correction Operator';

    static get TYPE(): string {
        return MsgCo2CorrectionType._TYPE;
    }

    static get ICON_URL(): string {
        return MsgCo2CorrectionType._ICON_URL;
    }

    static get NAME(): string {
        return MsgCo2CorrectionType._NAME;
    }

    constructor(config: {}) {
        super();
    }

    static fromDict(dict: OperatorTypeDict): MsgCo2CorrectionType {
        return new MsgCo2CorrectionType(dict);
    }

    getMappingName(): string {
        return MsgCo2CorrectionType.TYPE;
    }

    getIconUrl(): string {
        return MsgCo2CorrectionType.ICON_URL;
    }

    toString(): string {
        return MsgCo2CorrectionType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): OperatorTypeMappingDict {
        return {};
    }

    toDict(): OperatorTypeDict {
        return {
            operatorType: MsgCo2CorrectionType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgCo2CorrectionType.fromDict(this.toDict()); // TODO: add modifications
    }
}

export class MsgSofosGccThermalThresholdType extends OperatorType {
    private static _TYPE = 'meteosat_gccthermthresholddetection';
    private static _ICON_URL = OperatorType.createIconDataUrl(
        MsgSofosGccThermalThresholdType._TYPE
    );
    private static _NAME = 'MSG SOFOS thermal threshold detection operator';

    static get TYPE(): string {
        return MsgSofosGccThermalThresholdType._TYPE;
    }

    static get ICON_URL(): string {
        return MsgSofosGccThermalThresholdType._ICON_URL;
    }

    static get NAME(): string {
        return MsgSofosGccThermalThresholdType._NAME;
    }

    constructor(config: {}) {
        super();
    }

    static fromDict(dict: OperatorTypeDict): MsgSofosGccThermalThresholdType {
        return new MsgSofosGccThermalThresholdType(dict);
    }

    getMappingName(): string {
        return MsgSofosGccThermalThresholdType.TYPE;
    }

    getIconUrl(): string {
        return MsgSofosGccThermalThresholdType.ICON_URL;
    }

    toString(): string {
        return MsgSofosGccThermalThresholdType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [];
    }

    toMappingDict(): OperatorTypeMappingDict {
        return {};
    }

    toDict(): OperatorTypeDict {
        return {
            operatorType: MsgSofosGccThermalThresholdType.TYPE,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return MsgSofosGccThermalThresholdType.fromDict(this.toDict()); // TODO: add modifications
    }
}
