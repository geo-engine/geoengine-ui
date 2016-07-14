import {Unit} from '../operators/unit.model';

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
    channels: MappingSourceChannel[];
    colorizer: string;
    coords: {
        epsg: number,
        origin: number[],
        scale: number[],
        size: number[],
    };
}
