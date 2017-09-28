/**
 * Created by Julian on 01/09/2017.
 */
import {Pipe} from '@angular/core';
import {DataTypes} from '../../datatype.model';
import {Operator} from '../../operator.model';

@Pipe({
    name: 'NumericPipe'
})
export class NumericPipe {

    DataTypes = DataTypes;

    transform(value, op: Operator) {
        return value.filter((x) => DataTypes.ALL_NUMERICS.indexOf(op.dataTypes.get(x)) >= 0);
    }

}
