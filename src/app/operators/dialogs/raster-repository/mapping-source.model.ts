import {Unit, UnitMappingDict} from '../../unit.model';
import {MappingRasterColorizerDict} from '../../../colors/colorizer-data.model';
import {IColorizerData} from '../../../colors/colorizer-data.model';

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
  colorizer?: IColorizerData;
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
    channels?: MappingSourceChannel[];
    colorizer?: IColorizerData;
    imgUrl?: string;
    coords: {
        crs: string,
        epsg?: number,
        origin: number[],
        scale: number[],
        size: number[],
    };
}

export interface MappingSourceDict {
    operator?: string,
    name: string;
    colorizer?: MappingRasterColorizerDict;
    provenance?: {
        uri: string;
    license: string;
    citation: string;
    };
    coords: {
        crs: string,
        epsg?: number,
        origin: number[],
        scale: number[],
        size: number[],
    };
    channels: [{
        datatype: string,
        nodata: number,
        name?: string,
        unit?: UnitMappingDict,
        colorizer?: MappingRasterColorizerDict,
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
