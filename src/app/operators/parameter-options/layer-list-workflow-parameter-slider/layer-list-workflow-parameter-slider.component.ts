import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {ParameterContainerType, ParameterName} from '../../operator-type-parameter-options.model';
import {ProjectService} from '../../../project/project.service';
import {ParameterValue} from '../../operator-type.model';

@Component({
    selector: 'wave-layer-list-workflow-parameter-slider',
    templateUrl: 'layer-list-workflow-parameter-slider.component.html',
    styleUrls: ['layer-list-workflow-parameter-slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayerListWorkflowParameterSliderComponent<L extends AbstractSymbology> implements OnChanges, OnInit {

    @Input() layer: Layer<L>;
    @Input() parameterName: ParameterName;

    sliderRangeStart = 0;
    sliderRangeStop = 0;
    sliderRangeStep = 1;
    sliderValue = 0;

    parameterOptionContainer: ParameterContainerType;
    parameterValue: ParameterValue;

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public projectService: ProjectService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        for (let propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'parameterName': {
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

    get hasParameterOptions(): boolean {
        return !!this.parameterOptionContainer && this.parameterOptionContainer.getOptionCount() > 1;
    }

    updateParameterOptions() {
        if (this.layer && this.layer.operator && this.layer.operator.operatorType && this.layer.operator.operatorTypeParameterOptions) {
            const currentParameterValue = this.layer.operator.operatorType.getParameterValue(this.parameterName);
            const currentParameterOptionContainer = this.layer.operator.operatorTypeParameterOptions.getParameterOption(this.parameterName);
            this.parameterValue = currentParameterValue;
            this.parameterOptionContainer = currentParameterOptionContainer;
            this.sliderRangeStop =
                (this.parameterOptionContainer) ? this.parameterOptionContainer.getOptionCount() - 1 : this.sliderRangeStart;
        }
    }

    update(event: any) {
        const operatorTypeOptions = {};
        operatorTypeOptions[this.parameterName] = this.parameterOptionContainer.listOfOptions[this.sliderValue];
        const operatorTypeClone = this.layer.operator.operatorType.cloneWithModifications(operatorTypeOptions);
        const operatorClone = this.layer.operator.cloneWithModifications({
            operatorType: operatorTypeClone
        });
        this.projectService.changeLayer(this.layer, {
            operator: operatorClone,
            name: this.parameterOptionContainer.listOfDisplayValues[this.sliderValue] // TODO: find a nicer way to do this
        });
    }

    ngOnInit(): void {
        this.updateParameterOptions();
    }


}
