import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WaveValidators} from '../../../util/form.validators';
import {Operator} from '../../operator.model';
import {SimplePointSymbology} from '../../../layers/symbology/symbology.model';
import {VectorLayer} from '../../../layers/layer.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {ProjectService} from '../../../project/project.service';
import {ResultTypes} from '../../result-type.model';
import {SensorSourceType} from '../../types/sensor-source-type.model';
import {Projections} from '../../projection.model';

interface Sensor {
    name: String;
    fields: Array<String>;
    include?: boolean;
}

const SENSORS = [
    {
        name: 'location',
        fields: ['longitude', 'latitude'],
        include: true,
    },
        {
            name: 'temperature',
            fields: ['temperature'],
            include: false,
        },
        {
            name: 'image',
            fields: ['image']
        },
        {
            name: 'light',
            fields: ['light']
        },
        {
            name: 'pressure',
            fields: ['pressure']
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

    add(_event: Event) {
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

        const attributes: Array<string> = SensorSourceOperatorComponent.flatten(filteredSensors.map(s => s.fields));

        return new Operator({
            operatorType: sensorSourceType,
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: attributes
        });
    }

    addLayer(layerName: string, operator: Operator) {
        let symbology = new SimplePointSymbology({
            fillRGBA: this.randomColorService.getRandomColor(),
        });

        const layer = new VectorLayer({
            name: layerName,
            operator: operator,
            symbology: symbology,
        });

        this.projectService.addLayer(layer);
    }

}
