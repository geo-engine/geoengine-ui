import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractSymbology} from '../../../layers/symbology/symbology.model';
import {Layer} from '../../../layers/layer.model';
import {AbstractParameterContainer, ParameterContainerType, ParameterName} from '../../operator-type-parameter-options.model';
import {ProjectService} from '../../../project/project.service';
import {ParameterValue} from '../../operator-type.model';

/**
 * A component which allows to change operator parameters using a slider.
 * Inputs are the layer, the parameter name and a display name for the parameter.
 */
@Component({
    selector: 'wave-layer-list-workflow-parameter-slider',
    templateUrl: 'layer-list-workflow-parameter-slider.component.html',
    styleUrls: ['layer-list-workflow-parameter-slider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerListWorkflowParameterSliderComponent<L extends AbstractSymbology> implements OnChanges, OnInit {
    /**
     * The layer which is updated
     */
    @Input() layer: Layer<L>;
    /**
     * The layer parameter to update
     */
    @Input() parameterName: ParameterName;
    /**
     * The layer parameter display name
     */
    @Input() parameterDisplayName = undefined;

    // The changes by slider concept requires a range (start, stop, step) of parameters.
    sliderRangeStart = 0;
    sliderRangeStop = 0;
    sliderRangeStep = 1;
    // The current slider value
    sliderValue = 0;

    // the parameter option provider
    parameterOptionContainer: ParameterContainerType;
    // the selected parameter option value
    parameterValue: ParameterValue;

    constructor(public changeDetectorRef: ChangeDetectorRef, public projectService: ProjectService) {}

    ngOnChanges(changes: SimpleChanges): void {
        for (const propName in changes) {
            // eslint-disable-line guard-for-in
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
                default: {
                    // DO NOTHING
                }
            }
        }
    }

    get parameterDisplayString(): string {
        return this.parameterDisplayName ? this.parameterDisplayName : this.parameterName;
    }

    get parameterDisplayValue(): string {
        return this.parameterOptionContainer.getDisplayValueForTick(this.sliderValue);
    }

    get hasParameterOptions(): boolean {
        return !!this.parameterOptionContainer && this.parameterOptionContainer.hasTicks();
    }

    private updateParameterOptions() {
        if (this.layer && this.layer.operator && this.layer.operator.operatorType && this.layer.operator.operatorTypeParameterOptions) {
            const currentParameterValue = this.layer.operator.operatorType.getParameterValue(this.parameterName);
            const currentParameterOptionContainer = this.layer.operator.operatorTypeParameterOptions.getParameterOption(this.parameterName);
            this.parameterValue = currentParameterValue;
            this.parameterOptionContainer = currentParameterOptionContainer;

            this.sliderRangeStart = this.parameterOptionContainer.firstTick;
            this.sliderRangeStop = this.parameterOptionContainer.lastTick;
            this.sliderValue = (this.parameterOptionContainer as AbstractParameterContainer<ParameterValue>).getTickForValue(
                this.parameterValue,
            );
        }
    }

    /**
     * The main update method of the component is called from the template when the slider changes.
     */
    update(event: any) {
        // to update an operator, a dict with type options is generated.
        const operatorTypeOptions = {};

        // set the parameterName entry to the value of the current slider tick.
        operatorTypeOptions[this.parameterName] = this.parameterOptionContainer.getValueForTick(this.sliderValue);

        // clone the operatorType (this is the mapping operator) and apply the modifications from the options dict.
        const operatorTypeClone = this.layer.operator.operatorType.cloneWithModifications(operatorTypeOptions);

        // clone the operator with the new operator type supplied as modification.
        const operatorClone = this.layer.operator.cloneWithModifications({
            operatorType: operatorTypeClone,
        });

        // clone the layer with the new operator as modification.
        const layerCloneOptions = {
            operator: operatorClone,
        };
        // check if layer name is identical to the current parameter display value. If true change the layer name to match the new parameter
        if (this.layer.name === this.layer.operator.operatorType.getParameterDisplayValue(this.parameterName)) {
            layerCloneOptions['name'] = this.parameterOptionContainer.getDisplayValueForTick(this.sliderValue);
        }

        // submitt the changes to the project service.
        this.projectService.changeLayer(this.layer, layerCloneOptions);
    }

    ngOnInit(): void {
        this.updateParameterOptions();
    }
}
