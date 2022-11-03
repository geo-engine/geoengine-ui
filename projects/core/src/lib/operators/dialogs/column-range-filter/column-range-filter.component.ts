import {Component, OnInit, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {ResultTypes} from '../../result-type.model';
import {FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {combineLatest, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {map, mergeMap} from 'rxjs/operators';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {VectorColumnDataType, VectorColumnDataTypes} from '../../datatype.model';
import {WorkflowDict} from '../../../backend/backend.model';
import {ClusteredPointSymbology, PointSymbology} from '../../../layers/symbology/symbology.model';
import {colorToDict} from '../../../colors/color';
import {RandomColorService} from '../../../util/services/random-color.service';
import {ColumnRangeFilterDict} from '../../../backend/operator.model';
import {MapService} from '../../../map/map.service';
import {BackendService} from '../../../backend/backend.service';
import {UserService} from '../../../users/user.service';
import {VectorData} from '../../../layers/layer-data.model';

@Component({
    selector: 'geoengine-column-range-filter',
    templateUrl: './column-range-filter.component.html',
    styleUrls: ['./column-range-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnRangeFilterComponent implements OnInit, OnDestroy {
    readonly inputTypes = ResultTypes.VECTOR_TYPES;

    attributes$ = new ReplaySubject<Array<string>>(1);

    form: UntypedFormGroup;

    dataStream: VectorData | undefined;

    attributeError = false;
    errorHint = 'default error';

    protected layerDataSubscription?: Subscription = undefined;

    private subscriptions: Array<Subscription> = [];
    private columnTypes = new Map<string, VectorColumnDataType | undefined>();

    constructor(
        private readonly projectService: ProjectService,
        private readonly formBuilder: UntypedFormBuilder,
        private randomColorService: RandomColorService,
        protected readonly backend: BackendService,
        protected readonly userService: UserService,
        protected readonly mapService: MapService,
    ) {
        this.form = this.formBuilder.group({
            layer: [undefined, Validators.required],
            filters: this.formBuilder.array([]),
            name: ['Filtered Layer'],
        });
        this.addFilter();
        this.subscriptions.push(
            this.form.controls['layer'].valueChanges
                .pipe(
                    mergeMap((layer: Layer) => {
                        if (layer) {
                            this.selectLayer(layer);
                        }
                        if (layer instanceof VectorLayer) {
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
    selectLayer(layer: Layer): void {
        if (this.layerDataSubscription) {
            this.layerDataSubscription.unsubscribe();
        }

        const dataStream = this.projectService.getLayerDataStream(layer);
        const metadataStream = this.projectService.getLayerMetadata(layer);

        if (!dataStream || !metadataStream) {
            return;
        }

        this.layerDataSubscription = combineLatest([dataStream, metadataStream]).subscribe(
            ([data, metadata]) => {
                if (layer instanceof VectorLayer) {
                    this.processVectorLayer(layer, metadata as VectorLayerMetadata, data);
                }
            },
            (_error) => {
                // TODO: cope with error
            },
        );
    }

    processVectorLayer(_layer: VectorLayer, metadata: VectorLayerMetadata, data: VectorData): void {
        if (!data.data || (data.data && data.data.length === 0)) {
            return;
        }
        this.dataStream = data;
    }

    //control over filters
    get filters(): UntypedFormArray {
        return this.form.get('filters') as UntypedFormArray;
    }

    newFilter(): UntypedFormGroup {
        return this.formBuilder.group({
            attribute: new FormControl<string>(''),
            ranges: this.formBuilder.array([]),
        });
    }

    addFilter(): void {
        this.filters.push(this.newFilter());
        this.addRange(this.filters.length - 1, '', '');
    }

    removeFilter(i: number): void {
        this.filters.removeAt(i);
    }

    //control over the ranges
    ranges(filterIndex: number): UntypedFormArray {
        return this.filters.at(filterIndex).get('ranges') as UntypedFormArray;
    }

    newRange(min: string, max: string): UntypedFormGroup {
        return this.formBuilder.group({
            min: new FormControl(min),
            max: new FormControl(max),
        });
    }

    addRange(filterIndex: number, min: string, max: string): void {
        this.ranges(filterIndex).push(this.newRange(min, max));
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
    }

    isNumericalAttribute(attribute: string): boolean {
        if (attribute === '') {
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

    /**
     * Uses the user input
     * creates a new layer with the filtered values
     */
    add(): void {
        const name = (this.form.get('name')?.value as string) || ('Filtered Layer' as string);
        const inputLayer = this.form.controls['layer'].value as Layer;
        const filterValues = this.filters.value;

        if (this.checkInputErrors(filterValues)) return;

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

    changeValue($event: string, filterIndex: number): void {
        this.removeAllRanges(filterIndex);
        let minValue = '';
        let maxValue = '';
        if (this.isNumericalAttribute($event)) {
            if (this.dataStream) {
                const attvalues = this.dataStream.data.map((att) => att.get($event));
                const min = attvalues.reduce((a, b) => Math.min(a, b));
                const max = attvalues.reduce((a, b) => Math.max(a, b));
                minValue = Math.floor(min).toString();
                maxValue = Math.ceil(max).toString();
            }
            this.addRange(filterIndex, minValue, maxValue);
        } else {
            this.addRange(filterIndex, minValue, maxValue);
        }
    }

    checkInputErrors(filterValues: any): boolean {
        this.attributeError = false;
        this.errorHint = '';
        filterValues.forEach((value: any, index: number) => {
            if (value.attribute === '') {
                this.appendErrorMsg(`Filter ${index + 1}: Attribute can't be empty!\n`);
                return;
            }
            value.ranges.forEach((range: any) => {
                if (range.min === '' || range.max === '') {
                    this.appendErrorMsg(`Filter ${index + 1} (${value.attribute}): Range can't be empty!\n`);
                    return;
                }

                if (
                    this.columnTypes.get(value.attribute) !== VectorColumnDataTypes.Text &&
                    (isNaN(Number(range.min)) || isNaN(Number(range.max)))
                ) {
                    this.appendErrorMsg(
                        `Filter ${index + 1} (${value.attribute}): Numeric attributes can't be filtered lexicographically!\n`,
                    );
                    return;
                }

                if (this.columnTypes.get(value.attribute) !== VectorColumnDataTypes.Text && Number(range.min) > Number(range.max)) {
                    this.appendErrorMsg(`Filter ${index + 1} (${value.attribute}): Minimum must be smaller than maximum!\n`);
                } else if (range.min > range.max && this.columnTypes.get(value.attribute) === VectorColumnDataTypes.Text) {
                    this.appendErrorMsg(`Filter ${index + 1} (${value.attribute}): Minimum must be alphabetically before maximum!\n`);
                }
            });
        });
        return this.attributeError;
    }

    appendErrorMsg(msg: string): void {
        this.attributeError = true;
        this.errorHint = this.errorHint.concat(msg);
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
}
