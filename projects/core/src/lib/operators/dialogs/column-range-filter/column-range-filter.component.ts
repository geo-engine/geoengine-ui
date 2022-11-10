import {Component, OnInit, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {ResultTypes} from '../../result-type.model';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {combineLatest, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap} from 'rxjs/operators';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {VectorColumnDataType, VectorColumnDataTypes} from '../../datatype.model';
import {UUID, WorkflowDict} from '../../../backend/backend.model';
import {ClusteredPointSymbology, PointSymbology} from '../../../layers/symbology/symbology.model';
import {colorToDict} from '../../../colors/color';
import {RandomColorService} from '../../../util/services/random-color.service';
import {ColumnRangeFilterDict, HistogramDict, HistogramParams} from '../../../backend/operator.model';
import {VegaChartData} from '../../../plots/vega-viewer/vega-viewer.component';
import {MapService} from '../../../map/map.service';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';
import {extentToBboxDict} from '../../../util/conversions';
import {geoengineValidators} from '../../../util/form.validators';

interface ColumnRangeFilterForm {
    layer: FormControl<Layer | null>;
    name: FormControl<string>;
    filters: FormArray<FormGroup<FilterForm>>;
}

interface FilterForm {
    attribute: FormControl<string>;
    ranges: FormArray<FormGroup<RangeForm>>;
}

interface RangeForm {
    min: FormControl<string>;
    max: FormControl<string>;
}

@Component({
    selector: 'geoengine-column-range-filter',
    templateUrl: './column-range-filter.component.html',
    styleUrls: ['./column-range-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnRangeFilterComponent implements OnInit, OnDestroy {
    readonly inputTypes = ResultTypes.VECTOR_TYPES;

    attributes$ = new ReplaySubject<Array<string>>(1);

    form: FormGroup<ColumnRangeFilterForm>;

    histograms = new Map<number, ReplaySubject<VegaChartData>>();

    private subscriptions: Array<Subscription> = [];
    private columnTypes = new Map<string, VectorColumnDataType | undefined>();
    private currentLayerid = -1;

    constructor(
        private readonly projectService: ProjectService,
        private readonly formBuilder: FormBuilder,
        private randomColorService: RandomColorService,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
    ) {
        const layerControl = this.formBuilder.control<Layer | null>(null, Validators.required);
        this.form = this.formBuilder.group({
            layer: layerControl,
            filters: this.formBuilder.array<FormGroup<FilterForm>>([]),
            name: this.formBuilder.nonNullable.control<string>('Filtered Layer', [Validators.required]),
        });
        this.addFilter();
        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    mergeMap((layer: Layer | null) => {
                        if (layer instanceof VectorLayer) {
                            // reset filters and ranges only when a new Layer is selected
                            if (this.currentLayerid !== layer.id) this.resetFiltersAndRanges();
                            this.currentLayerid = layer.id;
                            return this.projectService.getVectorLayerMetadata(layer).pipe(
                                map((metadata: VectorLayerMetadata) => {
                                    const attribs = metadata.dataTypes
                                        .filter(
                                            (columnType: any) =>
                                                columnType === VectorColumnDataTypes.Float ||
                                                columnType === VectorColumnDataTypes.Int ||
                                                columnType === VectorColumnDataTypes.Text,
                                        )
                                        .keySeq()
                                        .toArray();
                                    attribs.forEach((a) => this.columnTypes.set(a, metadata.dataTypes.get(a)));
                                    return attribs;
                                }),
                            );
                        } else {
                            return of([]);
                        }
                    }),
                )
                .subscribe((attributes) => this.attributes$.next(attributes)),
        );
    }

    //control over filters
    get filters(): FormArray<FormGroup<FilterForm>> {
        return this.form.get('filters') as FormArray<FormGroup<FilterForm>>;
    }

    newFilter(): FormGroup<FilterForm> {
        return this.formBuilder.group({
            attribute: this.formBuilder.nonNullable.control<string>(''),
            ranges: this.formBuilder.array<FormGroup<RangeForm>>([]),
        });
    }

    addFilter(): void {
        this.filters.push(this.newFilter());
        this.addRange(this.filters.length - 1, false);
    }

    removeFilter(i: number): void {
        this.removeHistogram(i);
        this.filters.removeAt(i);
    }

    //control over the ranges
    ranges(filterIndex: number): FormArray<FormGroup<RangeForm>> {
        return this.filters.at(filterIndex).get('ranges') as FormArray<FormGroup<RangeForm>>;
    }

    // validators: [geoengineValidators.conditionalValidator(geoengineValidators.minAndMaxNumOrStr('min', 'max', {checkBothExist: true}), () => enableMinAndMaxValidator)]});
    newRange(min: string, max: string, enableMinAndMaxValidator: boolean): FormGroup<RangeForm> {
        return this.formBuilder.group(
            {
                min: this.formBuilder.nonNullable.control<string>(min, Validators.required),
                max: this.formBuilder.nonNullable.control<string>(max, Validators.required),
            },
            {
                validators: [
                    geoengineValidators.minAndMaxNumOrStr('min', 'max', {checkBothExist: true, checkIsNumber: enableMinAndMaxValidator}),
                ],
            },
        );
    }

    addRange(filterIndex: number, enableMinAndMaxValidator: boolean | undefined): void {
        let minAndMaxValidator = false;
        // when addRange is called from the template
        if (enableMinAndMaxValidator === undefined) {
            const att = this.filters.at(filterIndex).get('attribute')?.value;
            if (this.isNumericalAttribute(att)) {
                minAndMaxValidator = true;
            }
        } else {
            minAndMaxValidator = enableMinAndMaxValidator;
        }

        this.ranges(filterIndex).push(this.newRange('', '', minAndMaxValidator));
    }

    removeAllRanges(filterIndex: number): void {
        this.ranges(filterIndex).clear();
    }
    removeRange(filterIndex: number, rangeIndex: number): void {
        this.ranges(filterIndex).removeAt(rangeIndex);
    }

    updateRange(filterIndex: number, rangeIndex: number, min: number, max: number): void {
        this.ranges(filterIndex).at(rangeIndex).setValue({min: min.toString(), max: max.toString()});
    }

    resetFiltersAndRanges(): void {
        for (let index = 0; index < this.filters.controls.length; index++) {
            this.removeAllRanges(index);
        }
        this.filters.reset();
        this.histograms = new Map<number, ReplaySubject<VegaChartData>>();
    }

    isNumericalAttribute(attribute: string | undefined): boolean {
        if (!attribute || attribute === '') {
            return false;
        } else {
            const isNum = this.columnTypes.has(attribute) ? this.columnTypes.get(attribute)?.isNumeric : false;
            if (!isNum || isNum === undefined) {
                return false;
            } else {
                return isNum;
            }
        }
    }
    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    updateBounds(histogramSignal: {binStart: [number, number]} | null, filterIndex: number, rangeIndex: number): void {
        if (!histogramSignal || !histogramSignal.binStart || histogramSignal.binStart.length !== 2) {
            return;
        }

        const [min, max] = histogramSignal.binStart;
        this.updateRange(filterIndex, rangeIndex, min, max);
    }

    /**
     * Uses the user input
     * creates a new layer with the filtered values
     */
    add(): void {
        const name = (this.form.get('name')?.value as string) || ('Filtered Layer' as string);
        const inputLayer = this.form.controls['layer'].value as Layer;
        const filterValues = this.filters.value;

        this.projectService
            .getWorkflow(inputLayer.workflowId)
            .pipe(
                mergeMap((inputWorkflow: WorkflowDict) =>
                    this.projectService.registerWorkflow(this.createWorkflow(filterValues, 0, inputWorkflow)),
                ),
                mergeMap((workflowId) => this.createLayer(workflowId, name)),
            )
            .subscribe();
    }

    changeAttributeValue($event: string, filterIndex: number): void {
        this.removeAllRanges(filterIndex);
        if (this.isNumericalAttribute($event)) {
            this.addRange(filterIndex, true);
            this.addHistogram(filterIndex, $event);
        } else {
            this.addRange(filterIndex, false);
            this.removeHistogram(filterIndex);
        }
    }

    createWorkflow(filterValues: any, index: number, inputWorkflow: WorkflowDict): WorkflowDict {
        if (index === filterValues.length) return inputWorkflow;
        const attribute = filterValues[index]['attribute'] as string;
        return {
            type: 'Vector',
            operator: {
                type: 'ColumnRangeFilter',
                params: {
                    column: attribute,
                    ranges: this.extractRanges(filterValues[index].ranges, attribute),
                    keepNulls: false,
                },
                sources: {
                    vector: this.createWorkflow(filterValues, ++index, inputWorkflow).operator,
                },
            } as ColumnRangeFilterDict,
        } as WorkflowDict;
    }

    extractRanges(formRanges: any, attribute: string): any[][] {
        const filterRanges: any[][] = [];
        formRanges.forEach((range: any) => {
            const minMax: any[] = [];
            if (this.isAttributeText(attribute)) {
                minMax.push(range.min);
                minMax.push(range.max);
            } else {
                minMax.push(isNaN(Number(range.min)) ? range.min : Number(range.min));
                minMax.push(isNaN(Number(range.max)) ? range.max : Number(range.max));
            }
            filterRanges.push(minMax);
        });
        return filterRanges;
    }

    isAttributeText(attribute: string): boolean {
        return this.columnTypes.get(attribute)?.code === 'text';
    }

    createLayer(workflowId: string, name: string): Observable<void> {
        return this.projectService.addLayer(
            new VectorLayer({
                workflowId,
                name,
                symbology: ClusteredPointSymbology.fromPointSymbologyDict({
                    type: 'point',
                    radius: {
                        type: 'static',
                        value: PointSymbology.DEFAULT_POINT_RADIUS,
                    },
                    stroke: {
                        width: {
                            type: 'static',
                            value: 1,
                        },
                        color: {
                            type: 'static',
                            color: [0, 0, 0, 255],
                        },
                    },
                    fillColor: {
                        type: 'static',
                        color: colorToDict(this.randomColorService.getRandomColorRgba()),
                    },
                }),
                isLegendVisible: false,
                isVisible: true,
            }),
        );
    }

    addHistogram(filterIndex: number, attribute: string): void {
        const histogramWorkflow = new ReplaySubject<UUID>(1);
        const histogramSubject = new ReplaySubject<VegaChartData>(1);
        this.createHistogramWorkflowId(attribute).subscribe((histogramWorkflowId) => histogramWorkflow.next(histogramWorkflowId));
        this.createHistogramStream(histogramWorkflow).subscribe((histogramData) => histogramSubject.next(histogramData));
        this.histograms.set(filterIndex, histogramSubject);
    }

    removeHistogram(filterIndex: number): void {
        this.histograms.delete(filterIndex);
    }

    private createHistogramStream(histogramWorkflowId: ReplaySubject<UUID>): Observable<VegaChartData> {
        return combineLatest([
            histogramWorkflowId,
            this.projectService.getTimeStream(),
            this.mapService.getViewportSizeStream(),
            this.userService.getSessionTokenForRequest(),
            this.projectService.getSpatialReferenceStream(),
        ]).pipe(
            mergeMap(([workflowId, time, viewport, sessionToken, sref]) =>
                this.backend.getPlot(
                    workflowId,
                    {
                        bbox: extentToBboxDict(viewport.extent),
                        crs: sref.srsString,
                        spatialResolution: [viewport.resolution, viewport.resolution],
                        time: time.toDict(),
                    },
                    sessionToken,
                ),
            ),
            map((plotData) => plotData.data),
        );
    }

    private createHistogramWorkflowId(attribute: string): Observable<UUID> {
        const inputLayer = this.form.controls['layer'].value as Layer;
        const attributeName = attribute;
        return this.projectService.getWorkflow(inputLayer.workflowId).pipe(
            mergeMap((workflow) =>
                combineLatest([
                    of({
                        type: 'Plot',
                        operator: {
                            type: 'Histogram',
                            params: {
                                columnName: attributeName,
                                bounds: 'data',
                                interactive: true,
                            } as HistogramParams,
                            sources: {
                                source: workflow.operator,
                            },
                        } as HistogramDict,
                    } as WorkflowDict),
                    this.userService.getSessionTokenForRequest(),
                ]),
            ),
            mergeMap(([workflow, sessionToken]) => this.backend.registerWorkflow(workflow, sessionToken)),
            map((workflowRegistration) => workflowRegistration.id),
        );
    }
}
