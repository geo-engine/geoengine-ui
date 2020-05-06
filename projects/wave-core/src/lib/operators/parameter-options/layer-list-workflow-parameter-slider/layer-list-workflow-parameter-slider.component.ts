import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {AbstractParameterContainer, ParameterContainerType, ParameterName} from '../../operator-type-parameter-options.model';
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
    @Input() parameterDisplayName = undefined;

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
        for (const propName in changes) { // tslint:disable-line:forin
            switch (propName) {
                case 'parameterDisplayName':
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

    get parameterDisplayString(): string {
        return (this.parameterDisplayName) ? this.parameterDisplayName : this.parameterName;
    }

    get parameterDisplayValue(): string {
        return this.parameterOptionContainer.getDisplayValueForTick(this.sliderValue);
    }

    get hasParameterOptions(): boolean {
        return !!this.parameterOptionContainer && this.parameterOptionContainer.hasTicks();
    }

    updateParameterOptions() {
        if (this.layer && this.layer.operator && this.layer.operator.operatorType && this.layer.operator.operatorTypeParameterOptions) {
            const currentParameterValue = this.layer.operator.operatorType.getParameterValue(this.parameterName);
            const currentParameterOptionContainer = this.layer.operator.operatorTypeParameterOptions.getParameterOption(this.parameterName);
            this.parameterValue = currentParameterValue;
            this.parameterOptionContainer = currentParameterOptionContainer;

            this.sliderRangeStart = this.parameterOptionContainer.firstTick;
            this.sliderRangeStop = this.parameterOptionContainer.lastTick;
            this.sliderValue = (this.parameterOptionContainer as AbstractParameterContainer<ParameterValue>)
                .getTickForValue(this.parameterValue);
        }
    }

    update(event: any) {
        const operatorTypeOptions = {};
        operatorTypeOptions[this.parameterName] = this.parameterOptionContainer.getValueForTick(this.sliderValue);
        const operatorTypeClone = this.layer.operator.operatorType.cloneWithModifications(operatorTypeOptions);
        const operatorClone = this.layer.operator.cloneWithModifications({
            operatorType: operatorTypeClone
        });

        const layerCloneOptions = {
            operator: operatorClone
        };
        // check if layer name is identical to the current parameter display value. If true change the layer name to match the new parameter
        if (this.layer.name === this.layer.operator.operatorType.getParameterDisplayValue(this.parameterName)) {
            layerCloneOptions['name'] = this.parameterOptionContainer.getDisplayValueForTick(this.sliderValue);
        }

        this.projectService.changeLayer(this.layer, layerCloneOptions);
    }

    ngOnInit(): void {
        this.updateParameterOptions();
    }


}
