import {Component, OnInit, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import {ResultTypes} from '../../result-type.model';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {of, ReplaySubject, Subscription} from 'rxjs';
import {ProjectService} from '../../../project/project.service';
import {map, tap, mergeMap} from 'rxjs/operators';
import {Layer, VectorLayer} from '../../../layers/layer.model';
import {VectorLayerMetadata} from '../../../layers/layer-metadata.model';
import {VectorColumnDataTypes} from '../../datatype.model';
import {WorkflowDict} from '../../../backend/backend.model';
import {ClusteredPointSymbology, PointSymbology} from '../../../layers/symbology/symbology.model';
import {colorToDict} from '../../../colors/color';
import {RandomColorService} from '../../../util/services/random-color.service';
import {ColumnRangeFilterDict} from '../../../backend/operator.model';
import {Vector} from 'ol/source';

@Component({
    selector: 'wave-column-range-filter',
    templateUrl: './column-range-filter.component.html',
    styleUrls: ['./column-range-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnRangeFilterComponent implements OnInit, OnDestroy {
    readonly inputTypes = ResultTypes.VECTOR_TYPES;

    attributes$ = new ReplaySubject<Array<string>>(1);

    form: FormGroup;

    private subscriptions: Array<Subscription> = [];
    public attributeError: boolean = false;
    public errorHint: string = 'default error';
    private columnTypes = new Map<string, string | undefined>();

    constructor(
        private readonly projectService: ProjectService,
        private readonly formBuilder: FormBuilder,
        private randomColorService: RandomColorService,
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
                                    attribs.forEach((a) => this.columnTypes.set(a, metadata.dataTypes.get(a)?.toString()));
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
        console.log(this.columnTypes);
    }

    //control over filters
    get filters(): FormArray {
        return this.form.get('filters') as FormArray;
    }

    newFilter(): FormGroup {
        return this.formBuilder.group({
            attribute: '',
            ranges: this.formBuilder.array([]),
        });
    }

    addFilter(): void {
        this.filters.push(this.newFilter());
        this.addRange(this.filters.length - 1);
    }

    removeFilter(i: number): void {
        this.filters.removeAt(i);
    }

    //control over the ranges
    ranges(filterIndex: number): FormArray {
        return this.filters.at(filterIndex).get('ranges') as FormArray;
    }

    newRange(): FormGroup {
        return this.formBuilder.group({
            min: '',
            max: '',
        });
    }

    addRange(filterIndex: number): void {
        this.ranges(filterIndex).push(this.newRange());
    }

    removeRange(filterIndex: number, rangeIndex: number): void {
        this.ranges(filterIndex).removeAt(rangeIndex);
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
        let filterValues = this.filters.value;

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

    checkInputErrors(filterValues: any): boolean {
        this.attributeError = false;
        this.errorHint = "";
        filterValues.forEach((value: any) => {
            this.attributeError = value.attribute == '';
            value.ranges.forEach((range: any) => {
                if (
                    this.columnTypes.get(value.attribute) != 'text' &&
                    (Number(range.min) > Number(range.max) || range.min == '' || range.max == '')
                ) {
                    this.attributeError = true;
                    this.errorHint = this.errorHint.concat(value.attribute + ": Minimum must be smaller than maximum!\n");
                } else {
                    if (range.min > range.max || range.min == '' || range.max == '') {
                        this.attributeError = true;
                        this.errorHint = this.errorHint.concat(value.attribute + ": Minimum must be alphabetically before maximum!\n");
                    }
                }
                if (this.columnTypes.get(value.attribute) != 'text' && (isNaN(Number(range.min)) || isNaN(Number(range.max))))
                    this.attributeError = true;
                    this.errorHint = this.errorHint.concat(value.attribute + ": Numeric attributes can not be filtered lexicographically.\n")
            });
        });
        return this.attributeError
    }

    createWorkflow(filterValues: any, index: number, inputWorkflow: WorkflowDict): WorkflowDict {
        if (index == filterValues.length) return inputWorkflow;
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
        let filterRanges: any[][] = [];
        formRanges.forEach((range: any) => {
            const min_max: any[] = [];
            if (this.isAttributeText(attribute)) {
                min_max.push(range.min);
                min_max.push(range.max);
            } else {
                min_max.push(isNaN(Number(range.min)) ? range.min : Number(range.min));
                min_max.push(isNaN(Number(range.max)) ? range.max : Number(range.max));
            }
            filterRanges.push(min_max);
        });
        console.log(filterRanges);
        return filterRanges;
    }

    isAttributeText(attribute: string): boolean {
        return this.columnTypes.get(attribute) == 'text';
    }

    createLayer(workflowId: string, name: string) {
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
