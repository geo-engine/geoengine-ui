import {Unit, UnitMappingDict} from '../../unit.model';

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
  colorizer?: string;
  transform?: MappingTransform;
  hasTransform: boolean;
  isSwitchable: boolean;
  missingUnit?: boolean;
}

export interface MappingSource {
    source: string;
    name: string;
    uri: string;
    license: string;
    citation: string;
    channels: MappingSourceChannel[];
    colorizer: string;
    coords: {
        epsg: number,
        origin: number[],
        scale: number[],
        size: number[],
    };
}

export interface MappingSourceDict {
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
