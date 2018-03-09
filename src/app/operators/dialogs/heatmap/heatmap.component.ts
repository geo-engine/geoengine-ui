import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';

import {RandomColorService} from '../../../util/services/random-color.service';

import {RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ResultTypes} from '../../result-type.model';
import {AbstractVectorSymbology, MappingColorizerRasterSymbology} from '../../../layers/symbology/symbology.model';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {ProjectService} from '../../../project/project.service';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subscription} from 'rxjs/Subscription';
import {DataType, DataTypes} from '../../datatype.model';
import {HeatmapType} from '../../types/heatmap-type.model';
import {Unit} from '../../unit.model';

interface AttributeType {
    name: string,
    value: string,
}

/**
 * This component allows creating the heatmap operator.
 */
@Component({
    selector: 'wave-heatmap',
    templateUrl: './heatmap.component.html',
    styleUrls: ['./heatmap.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapOperatorComponent implements OnInit, OnDestroy {
    ResultTypes = ResultTypes; // make it available in the template

    form: FormGroup;

    attributes$ = new ReplaySubject<Array<AttributeType>>(1);

    private subscription: Subscription;

    constructor(private randomColorService: RandomColorService,
                private projectService: ProjectService,
                private formBuilder: FormBuilder) {
        this.form = formBuilder.group({
            name: ['Heatmap', [Validators.required, WaveValidators.notOnlyWhitespace]],
            pointLayer: [undefined, Validators.required],
            attribute: [''],
            radius: [10, Validators.required],
        });
    }

    ngOnInit(): void {
        this.subscription = this.form.controls['pointLayer'].valueChanges.subscribe((pointLayer: VectorLayer<AbstractVectorSymbology>) => {
            let attributes: Array<AttributeType> = [];
            pointLayer.operator.dataTypes.forEach((datatype, attribute) => {
                if (DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0) {
                    attributes.push({
                        name: attribute,
                        value: attribute,
                    });
                }
            });
            attributes.push({
                name: '▱ location',
                value: '',
            });
            this.attributes$.next(attributes);
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    add(event: Event) {
        event.preventDefault(); // prevent page reload on error

        if (this.form.invalid) {
            return;
        }

        const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['pointLayer'].value;
        const pointOperator: Operator = pointLayer.operator;

        const attribute: string = this.form.controls['attribute'].value;

        let dataType: DataType;
        if (attribute && pointOperator.dataTypes[attribute] !== null && pointOperator.dataTypes[attribute] !== undefined) {
            dataType = pointOperator.dataTypes[attribute];
        } else if (attribute) {
            dataType = DataTypes.Float32;
        } else {
            dataType = DataTypes.UInt32;
        }

        let unit: Unit;
        if (attribute && pointOperator.units[attribute] !== null && pointOperator.units[attribute] !== undefined) {
            unit = pointOperator.units[attribute];
        } else {
            unit = Unit.defaultUnit;
        }

        const radius: number = this.form.controls['radius'].value;

        const name: string = this.form.controls['name'].value;

        const operator = new Operator({
            operatorType: new HeatmapType({
                attribute: attribute,
                radius: radius,
            }),
            resultType: ResultTypes.RASTER,
            projection: pointOperator.projection,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>().set('value', dataType),
            units: new Map<string, Unit>().set('value', unit),
            pointSources: [pointOperator],
        });

        this.projectService.addLayer(new RasterLayer({
            name: name,
            operator: operator,
            symbology: new MappingColorizerRasterSymbology({
                unit: unit,
            }),
        }));
    }

}
