import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {AbstractVectorSymbology, RasterSymbology} from '../../../layers/symbology/symbology.model';
import {RasterValueExtractionType} from '../../types/raster-value-extraction-type.model';
import {SpectralOverviewPlotType} from '../../types/spectral-overview-plot-type.model';
import {DataType} from '../../datatype.model';
import {Unit} from '../../unit.model';

@Component({
    selector: 'wave-time-plot-operator',
    templateUrl: './spectral-overview-plot.component.html',
    styleUrls: ['./spectral-overview-plot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpectralOverviewPlotComponent implements OnInit, OnDestroy {

    readonly pointLayerTypes = [ResultTypes.POINTS];
    readonly rasterLayerTypes = [ResultTypes.RASTER];

    form: FormGroup;

    availableParameterNames$: Observable<Array<string>>;
    disabledParameterNameChoice$: Observable<boolean>;
    formIsInvalid$: Observable<boolean>;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            pointLayer: [undefined, Validators.required],
            rasterLayer: [undefined, Validators.required],
            parameterName: [undefined, Validators.required],
            name: ['Spectral Overview Plot', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });

        this.availableParameterNames$ = this.form.controls.rasterLayer.valueChanges.pipe(
            map((raster: RasterLayer<RasterSymbology>) => {
                if (!raster || !raster.operator.operatorTypeParameterOptions) {
                    return [];
                }

                const operatorTypeParameterOptions = raster.operator.operatorTypeParameterOptions;
                return operatorTypeParameterOptions.getParameterNames().filter(parameterName => {
                    return operatorTypeParameterOptions.getParameterOption(parameterName).lastTick > 0; // has more than one option
                });
            }),
            tap(names => this.form.controls.parameterName.setValue(names.length ? names[0] : undefined)),
        );
        this.disabledParameterNameChoice$ = this.availableParameterNames$.pipe(map(names => names.length <= 0));
        this.formIsInvalid$ = this.form.statusChanges.pipe(map(status => status !== 'VALID'));

        setTimeout(() => this.form.controls['rasterLayer'].enable({emitEvent: true})); // initially get attributes
        setTimeout(() => this.form.updateValueAndValidity()); // have a first check pass for submit button visibility
    }

    add() {
        const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls.pointLayer.value;
        const rasterLayer: RasterLayer<RasterSymbology> = this.form.controls.rasterLayer.value;
        const parameterName: string = this.form.controls.parameterName.value;
        const plotName: string = this.form.controls.name.value;

        let channelNames: Array<string> = [];
        let rasterSources = [];
        let dataTypes = new Map<string, DataType>();
        let units = new Map<string, Unit>();

        const rasterLayerParameterContainer = rasterLayer.operator.operatorTypeParameterOptions.getParameterOption(parameterName);
        for (let tick = rasterLayerParameterContainer.firstTick; tick <= rasterLayerParameterContainer.lastTick; ++tick) {
            const channelName = rasterLayerParameterContainer.getDisplayValueForTick(tick);

            channelNames.push(channelName);

            const rasterSource = rasterLayer.operator.cloneWithModifications({
                operatorType: rasterLayer.operator.operatorType.cloneWithModifications(keyValueDict(
                    parameterName,
                    rasterLayerParameterContainer.getValueForTick(tick),
                )),
            });

            rasterSources.push(rasterSource);
            dataTypes.set(channelName, rasterSource.getDataType('value'));
            units.set(channelName, rasterSource.getUnit('value'));
        }

        const rasterValueExtraction = new Operator({
            operatorType: new RasterValueExtractionType({
                attributeNames: channelNames,
                xResolution: 1024,
                yResolution: 1024,
            }),
            resultType: ResultTypes.POINTS,
            projection: pointLayer.operator.projection,
            pointSources: [pointLayer.operator],
            rasterSources,
            attributes: channelNames,
            dataTypes,
            units,
        });

        const plotOperator = new Operator({
            operatorType: new SpectralOverviewPlotType({
                instruments: channelNames,
            }),
            resultType: ResultTypes.PLOT,
            projection: rasterValueExtraction.projection,
            pointSources: [rasterValueExtraction],
        });

        const plot = new Plot({
            name: plotName,
            operator: plotOperator,
        });

        this.projectService.addPlot(plot);
    }

    ngOnDestroy() {
    }

}

function keyValueDict<T>(key: string, value: T): { [index: string]: T } {
    let dict = {};
    dict[key] = value;
    return dict;
}
