import {Unit, UnitMappingDict} from '../../unit.model';
import { MappingRasterColorizer, MappingRasterColorizerBreakpoint } from '../../../layers/symbology/symbology.model';

export interface MappingTransform {
  datatype: string;
  offset: number;
  scale: number;
  unit: Unit;
}

export interface MappingSourceChannel {
  name: string;
  id: number;
  datatype: string;
  nodata: number;
  unit: Unit;
  colorizer?: MappingRasterColorizer;
  transform?: MappingTransform;
  hasTransform: boolean;
  isSwitchable: boolean;
  missingUnit?: boolean;
}

export interface MappingSource {
    operator: string;
    source: string;
    name: string;
    uri: string;
    license: string;
    citation: string;
    channels: MappingSourceChannel[];
    colorizer?: MappingRasterColorizer;
    coords: {
        epsg: number,
        origin: number[],
        scale: number[],
        size: number[],
    };
}

export interface MappingSourceDict {
    operator?: string,
    name: string;
    colorizer: string;
    provenance?: {
        uri: string;
    license: string;
    citation: string;
    };
    coords: {
        epsg: number,
            origin: number[],
            scale: number[],
            size: number[],
    };
    channels: [{
        datatype: string,
        nodata: number,
        name?: string,
        unit?: UnitMappingDict,
        transform?: {
            unit?: UnitMappingDict,
            datatype: string,
            scale: number,
            offset: number,
        },
    }];
}

export interface MappingSourceResponse {
    sourcelist: {[index: string]: MappingSourceDict};
}
