import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ResultTypes} from '../../result-type.model';
import {Operator} from '../../operator.model';
import {Plot} from '../../../plots/plot.model';
import {ProjectService} from '../../../project/project.service';
import {WaveValidators} from '../../../util/form.validators';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {map} from 'rxjs/operators';
import {RasterLayer, VectorLayer} from '../../../layers/layer.model';
import {AbstractVectorSymbology, AbstractRasterSymbology} from '../../../layers/symbology/symbology.model';
import {RasterValueExtractionType} from '../../types/raster-value-extraction-type.model';
import {SpectralOverviewPlotType} from '../../types/spectral-overview-plot-type.model';
import {DataType} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {GdalSourceChannelOptions} from '../../types/gdal-source-type.model';
import {DictParameterArray} from '../../operator-type-parameter-options.model';
import {MappingSatelliteSensorRasterMethodology} from '../data-repository/mapping-source.model';

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
    formIsInvalid$: Observable<boolean>;
    rasterHasNoChannelConfigForSatelliteSensors$ = new BehaviorSubject(false);

    private readonly requiredParameterName = 'channelConfig';

    private parameterContainer: DictParameterArray<GdalSourceChannelOptions>;
    private rasterChangeSubscription: Subscription;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            pointLayer: [undefined, Validators.required],
            rasterLayer: [undefined, Validators.required],
            isValidRaster: [false, Validators.requiredTrue],
            name: ['Spectral Overview Plot', [Validators.required, WaveValidators.notOnlyWhitespace]],
        });

        this.rasterChangeSubscription = this.form.controls.rasterLayer.valueChanges.subscribe(
            (raster: RasterLayer<AbstractRasterSymbology>) => {
                const isValidRaster = this.isValidRaster(raster);

                this.rasterHasNoChannelConfigForSatelliteSensors$.next(!isValidRaster);
                this.form.controls.isValidRaster.setValue(isValidRaster);

                if (isValidRaster) {
                    this.parameterContainer = raster.operator.operatorTypeParameterOptions
                        .getParameterOption(this.requiredParameterName) as DictParameterArray<GdalSourceChannelOptions>;
                } else {
                    this.parameterContainer = undefined;
                }
            }
        );

        this.formIsInvalid$ = this.form.statusChanges.pipe(map(status => status !== 'VALID'));

        setTimeout(() => this.form.controls['rasterLayer'].enable({emitEvent: true})); // initially get attributes
        setTimeout(() => this.form.updateValueAndValidity()); // have a first check pass for submit button visibility
    }

    ngOnDestroy() {
        this.rasterChangeSubscription.unsubscribe();
        this.rasterHasNoChannelConfigForSatelliteSensors$.complete();
    }

    private isValidRaster(raster: RasterLayer<AbstractRasterSymbology>) {
        const containsRequiredParameter = () => raster.operator.operatorTypeParameterOptions.getParameterNames()
            .some(name => name === this.requiredParameterName);

        if (!raster || !raster.operator.operatorTypeParameterOptions || !containsRequiredParameter()) {
            return false;
        }

        const parameterContainer = raster.operator.operatorTypeParameterOptions
            .getParameterOption(this.requiredParameterName) as DictParameterArray<GdalSourceChannelOptions>;

        if (parameterContainer.lastTick <= 0) { // requires more than one channel
            return false;
        }

        for (let tick = parameterContainer.firstTick; tick <= parameterContainer.lastTick; ++tick) {
            const value = parameterContainer.getValueForTick(tick);
            if (!value.methodology || value.methodology.type !== 'SATELLITE_SENSOR'
                || !(value.methodology as MappingSatelliteSensorRasterMethodology).central_wave_length_nm) { // important component
                return false;
            }
        }

        return true;
    }

    add() {
        const pointLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls.pointLayer.value;
        const rasterLayer: RasterLayer<AbstractRasterSymbology> = this.form.controls.rasterLayer.value;
        const plotName: string = this.form.controls.name.value;

        const channelNames: Array<string> = [];
        const rasterSources = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        const waveLenghts = [];

        for (let tick = this.parameterContainer.firstTick; tick <= this.parameterContainer.lastTick; ++tick) {
            const channelName = this.parameterContainer.getDisplayValueForTick(tick);

            channelNames.push(channelName);
            waveLenghts.push(
                (this.parameterContainer.getValueForTick(tick)
                    .methodology as MappingSatelliteSensorRasterMethodology).central_wave_length_nm
            );

            const rasterSource = rasterLayer.operator.cloneWithModifications({
                operatorType: rasterLayer.operator.operatorType.cloneWithModifications(keyValueDict(
                    this.requiredParameterName,
                    this.parameterContainer.getValueForTick(tick),
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
                waveLenghts,
                unit: units.values().next().value, // use unit of first raster
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
}

function keyValueDict<T>(key: string, value: T): { [index: string]: T } {
    const dict = {};
    dict[key] = value;
    return dict;
}
