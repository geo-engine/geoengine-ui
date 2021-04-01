import {OperatorParams} from './backend.model';

export interface HistogramParams extends OperatorParams {
    column_name?: string;
    bounds:
        | {
              min: number;
              max: number;
          }
        | 'data';
    buckets?: number;
    interactive?: boolean;
}
