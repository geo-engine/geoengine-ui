// import {Operator, ResultType} from "./operator.model";
// type Colorizer = "gray" | "height";

export interface MappingSourceChannel {
  name: string;
  id: number;
  datatype: string;
  nodata: number;
  unit: any;
}

export interface MappingSource {
  source: string;
  name: string;
  channels: MappingSourceChannel[];
  colorizer: string;
  coords: any;


  // intoSourceOperator(): Operator {
  //  return new Operator("source", ResultType.RASTER, )
  // }
}
