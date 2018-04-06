import {ChangeDetectionStrategy, Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {Operator} from '../../operator.model';
import {ComplexPointSymbology} from '../../../layers/symbology/symbology.model';
import {VectorLayer} from '../../../layers/layer.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {ProjectService} from '../../../project/project.service';
import {ResultTypes} from '../../result-type.model';
import {Projections} from '../../projection.model';
import {DataType, DataTypes} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {SensorSourceType} from '../../types/sensor-source-type.model';

interface Sensor {
    name: string;
    displayName?: string,
    fields: Array<SensorField>;
    include?: boolean;
}

interface SensorField {
    name: string,
    displayName?: string,
    dataType?: string,
    unit?: string
}

const SENSORS = [
        {
            name: 'location',
            fields: [
                {name: 'longitude', dataType: 'Float64'},
                {name: 'latitude', dataType: 'Float64'},
                {name: 'satellites', dataType: 'Int32'}
            ],
            include: true,
        },
        {
            name: 'light',
            fields: [{name: 'light', dataType: 'Float64'}]
        },
        {
            name: 'pressure',
            fields: [{name: 'pressure', dataType: 'Float64'}]
        },
        {
            name: 'temperature',
            fields: [
                {name: 'temperature', dataType: 'Float64'}
            ],
            include: true,
        },
        {
            name: 'co2',
            displayName: 'CO2',
            fields: [{name: 'co2', dataType: 'Float64'}]
        },
        {
            name: 'tvoc',
            fields: [{name: 'tvoc', dataType: 'Float64'}]
        },
        {
            name: 'image',
            fields: [{name: 'image', dataType: 'Alphanumeric'}],
        },
        {
            name: 'UV_irradiance',
            displayName: 'UV irradiance',
            fields: [{name: 'UV_irradiance', dataType: 'Float64'}]
        },
        {
            name: 'solar_irradiance',
            displayName: 'solar irradiance',
            fields: [{name: 'solar_irradiance', dataType: 'Float64'}]
        },
        {
            name: 'IR_surface_temperature',
            displayName: 'IR surface temperature',
            fields: [{name: 'IR_surface_temp', dataType: 'Float64'}]
        },
        {
            name: 'rh_sht',
            displayName: 'rH SHT',
            fields: [{name: 'rh_sht', dataType: 'Float64'}]
        },
        {
            name: 't_sht',
            displayName: 'T SHT',
            fields: [{name: 't_sht', dataType: 'Float64'}]
        }
    ];

const _ALWAYS_INCLUDE_FIELDS = [
        {
            name: 'node',
            fields: [{name: 'node', dataType: 'Alphanumeric'}]
        }
    ];

@Component({
    selector: 'wave-sensor-source-operator',
    templateUrl: './sensor-source-operator.component.html',
    styleUrls: ['./sensor-source-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SensorSourceOperatorComponent {

    sensors: Array<Sensor>;
    form: FormGroup;

    static flatten(arr) {
        return Array.prototype.concat(...arr);
    }

    constructor(
        private formBuilder: FormBuilder,
        private randomColorService: RandomColorService,
        private projectService: ProjectService
    ) {

        this.sensors = SENSORS;

        this.form = this.formBuilder.group({
            sensors: this.formBuilder.array(this.sensors.map(s => !!s.include)),
            name: ['Natur 4.0 Sensors', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });
    }

    add(_: Event) {
        console.log('add', this.sensors);
        const name = this.form.controls['name'].value;
        const mask = this.form.controls['sensors'].value;

        console.log('name', name, 'mask', mask);
        const op = this.createSourceOperator(mask);
        this.addLayer(name, op);
    }

    createSourceOperator(mask: Array<boolean>): Operator {

        const filteredSensors = this.sensors.filter((x, i) => (mask[i]));
        console.log('filteredSensors', filteredSensors);


        const sensorSourceType = new SensorSourceType({
            sensorTypes: filteredSensors.map(s => s.name)
        });

        /*
        const attributes: Array<string> = SensorSourceOperatorComponent.flatten(filteredSensors.map(
            s => {
                s.fields.map(f => f.name)
            })
        );
        */
        const attributes = new Array<string>();
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        filteredSensors.concat(_ALWAYS_INCLUDE_FIELDS).forEach( s => {
                s.fields.forEach(c => {
                    attributes.push(c.name);
                    dataTypes.set(c.name, DataTypes.fromCode(c.dataType));
                    units.set(c.name, Unit.defaultUnit)
                });
        });

        return new Operator({
            operatorType: sensorSourceType,
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units
        });
    }

    addLayer(layerName: string, operator: Operator) {
        let symbology = new ComplexPointSymbology({
            fillRGBA: this.randomColorService.getRandomColor(),
            colorAttribute: 'node',
            colorMapping: [
                {value: 'rover0', r: 255, g: 128, b: 0, a: 1.0},
                {value: 'bb00', r: 0, g: 128, b: 255, a: 1.0},
                {value: 'bb01', r: 0, g: 64, b: 255, a: 1.0},
                {value: 'bb02', r: 0, g: 32, b: 255, a: 1.0},
                {value: 'bb23', r: 0, g: 0, b: 255, a: 1.0},
                {value: 'sb00', r: 0, g: 255, b: 128, a: 1.0},
                {value: 'sb02', r: 0, g: 255, b: 64, a: 1.0}

            ],
        });

        const layer = new VectorLayer({
            name: layerName,
            operator: operator,
            symbology: symbology,
        });

        this.projectService.addLayer(layer);
    }

}
