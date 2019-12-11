import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {ParameterName, ParameterOptionsNumberRange, ParameterType} from '../../operator-type-parameter-options.model';
import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'wave-layer-list-workflow-parameter-slider',
    templateUrl: 'layer-list-workflow-parameter-slider.component.html',
    styleUrls: ['layer-list-workflow-parameter-slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})export class LayerListWorkflowParameterSliderComponent<L extends AbstractSymbology> implements OnChanges, OnInit {

    @Input() layer: Layer<L>;
    @Input() parameterName: ParameterName;

    _parameterRange: ParameterOptionsNumberRange;
    _parameterValue: number;
    _parameterName: ParameterName;

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public projectService: ProjectService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'parameterName': {
                    this._parameterName = this.parameterName;
                    this.changeDetectorRef.markForCheck();
                    break;
                }
                case 'layer': {
                    this.updateParameterOptions();
                    this.changeDetectorRef.markForCheck();
                    break;
                }
                default: {// DO NOTHING
                }
            }
        }
    }

    updateParameterOptions() {
        console.log('LayerListWorkflowParameterSliderComponent', 'updateParameterOptions', this);
        if (this.layer && this.layer.operator && this.layer.operator.operatorType && this.layer.operator.operatorTypeParameterOptions) {
            const pValue = this.layer.operator.operatorType.getParameterValue(this._parameterName);
            const pOption = this.layer.operator.operatorTypeParameterOptions.getParameterOption(this._parameterName);

            if (typeof(pValue) === 'number' && pOption.parameterType === ParameterType.NUMBER_RANGE) {
                this._parameterValue = pValue as number;
                this._parameterRange = pOption as ParameterOptionsNumberRange;
            }
        }
    }

    update(event: any) {
        console.log('LayerListWorkflowParameterSliderComponent', 'update', this, event);
        const opTypeOptions = {};
        opTypeOptions[this._parameterName] = this._parameterValue;
        const opTypeClone = this.layer.operator.operatorType.cloneWithOptions(opTypeOptions);
        console.log(opTypeOptions, opTypeClone);
        const opClone = this.layer.operator.cloneWithOptions({
            operatorType: opTypeClone
        });
        console.log(this.layer.operator, opClone);
        this.projectService.changeLayer(this.layer, {
            operator: opClone
        });
    }

    ngOnInit(): void {
        this.updateParameterOptions();
    }


}
