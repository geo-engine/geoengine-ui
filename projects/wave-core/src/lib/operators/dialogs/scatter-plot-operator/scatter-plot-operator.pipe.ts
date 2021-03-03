import {Pipe} from '@angular/core';
import {DataTypes} from '../../datatype.model';
import {Operator} from '../../operator.model';

@Pipe({
    name: 'NumericPipe',
})
export class NumericPipe {
    transform(value: Array<string>, op: Operator) {
        return value.filter((x) => DataTypes.ALL_NUMERICS.indexOf(op.dataTypes.get(x)) >= 0);
    }
}
