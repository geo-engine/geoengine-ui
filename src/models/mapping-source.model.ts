import {UnitConfig} from "../models/unit.model";

export interface MappingUnit {
  measurement: string;
  unit: string;
  min?: number;
  max?: number;
  classes?: Map<number, string>;
  interpolation?: string;
}

export interface MappingTransform {
  datatype: string;
  offset: number;
  scale: number;
  unit?: UnitConfig;
}


export interface MappingSourceChannel {
  name: string;
  id: number;
  datatype: string;
  nodata: number;
  unit?: UnitConfig;
  colorizer?: string;
  transform?: MappingTransform;
  hasTransform: boolean;
  missingUnit?: boolean;
}

export interface MappingSource {
  source: string;
  name: string;
  channels: MappingSourceChannel[];
  colorizer: string;
  coords: any;

}
