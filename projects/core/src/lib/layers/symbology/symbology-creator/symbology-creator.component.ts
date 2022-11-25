import {ChangeDetectionStrategy, Component, forwardRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {combineLatest, first, map, mergeMap, Observable, of, Subject, takeUntil} from 'rxjs';
import {BBoxDict, RasterResultDescriptorDict, SrsString, TimeIntervalDict, UUID} from '../../../backend/backend.model';
import {BackendService} from '../../../backend/backend.service';
import {StatisticsDict, StatisticsParams} from '../../../backend/operator.model';
import {TRANSPARENT} from '../../../colors/color';
import {ColorMapSelectorComponent} from '../../../colors/color-map-selector/color-map-selector.component';
import {MPL_COLORMAPS} from '../../../colors/color-map-selector/mpl-colormaps';
import {LinearGradient} from '../../../colors/colorizer.model';
import {RasterResultDescriptor} from '../../../datasets/dataset.model';
import {ProjectService} from '../../../project/project.service';
import {SpatialReferenceService} from '../../../spatial-references/spatial-reference.service';
import {Time} from '../../../time/time.model';
import {UserService} from '../../../users/user.service';
import {extentToBboxDict} from '../../../util/conversions';
import {RasterLayer} from '../../layer.model';
import {RasterSymbology} from '../symbology.model';

export enum SymbologyCreationType {
    AS_INPUT = 'AS_INPUT',
    COMPUTE_LINEAR_GRADIENT = 'COMPUTE_LINEAR_GRADIENT',
}

@Component({
    selector: 'geoengine-symbology-creator',
    templateUrl: './symbology-creator.component.html',
    styleUrls: ['./symbology-creator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SymbologyCreatorComponent),
            multi: true,
        },
    ],
})
export class SymbologyCreatorComponent implements OnInit, OnDestroy, ControlValueAccessor {
    AS_INPUT = SymbologyCreationType.AS_INPUT;
    COMPUTE_LINEAR_GRADIENT = SymbologyCreationType.COMPUTE_LINEAR_GRADIENT;

    value = new FormControl<SymbologyCreationType>(SymbologyCreationType.AS_INPUT, {
        nonNullable: false,
        validators: [Validators.required],
    });

    private _onChange?: (value: SymbologyCreationType | null) => void;
    private _onTouched?: () => void;

    // Can be used to complete subscriptions `OnDestroy` – need to call `next` and `complete` once.
    private unsubscribe$ = new Subject<void>();

    constructor(
        protected readonly projectService: ProjectService,
        protected readonly userService: UserService,
        protected readonly backend: BackendService,
        protected readonly spatialReferenceService: SpatialReferenceService,
    ) {
        this.value.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            if (!this._onChange) {
                return;
            }

            this._onChange(value);
        });
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    writeValue(obj: any): void {
        if (obj === null) {
            this.value.setValue(null);
            return;
        }

        if (!SymbologyCreationType.hasOwnProperty(obj)) {
            throw new Error('Value must be of type `SymbologyCreationType`.');
        }

        this.value.setValue(obj);
    }

    registerOnChange(fn: any): void {
        if (typeof fn !== 'function') {
            throw new Error('Expected a function.');
        }
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        if (typeof fn !== 'function') {
            throw new Error('Expected a function.');
        }
        this._onTouched = fn;
    }

    @HostListener('blur', ['$event']) onBlur(): void {
        if (!this._onTouched) {
            return;
        }
        this._onTouched();
    }

    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) {
            this.value.disable();
        } else {
            this.value.enable();
        }
    }

    symbologyForRasterLayer(workflowId: UUID, inputLayer: RasterLayer): Observable<RasterSymbology> {
        const value = this.value.getRawValue();

        if (!value) {
            throw new Error('Cannot call `symbologyForRasterLayer` on empty selection.');
        }

        switch (value) {
            case SymbologyCreationType.AS_INPUT: {
                return of(inputLayer.symbology);
            }
            case SymbologyCreationType.COMPUTE_LINEAR_GRADIENT: {
                return this.computeSymbologyForRasterLayer(workflowId);
            }
        }
    }

    protected computeSymbologyForRasterLayer(workflowId: UUID): Observable<RasterSymbology> {
        const rasterName = 'raster';

        const statisticsWorkflow$ = this.projectService.getWorkflow(workflowId).pipe(
            mergeMap((workflow) =>
                this.projectService.registerWorkflow({
                    type: 'Plot',
                    operator: {
                        type: 'Statistics',
                        params: {
                            columnNames: [rasterName],
                        } as StatisticsParams,
                        sources: {
                            source: [workflow['operator']],
                        },
                    } as StatisticsDict,
                }),
            ),
        );

        const queryParams$: Observable<{
            bbox: BBoxDict;
            crs: SrsString;
            time: TimeIntervalDict;
            spatialResolution: [number, number];
        }> = combineLatest([
            this.projectService
                .getWorkflowMetaData(workflowId)
                .pipe(map((resultDescriptor) => RasterResultDescriptor.fromDict(resultDescriptor as RasterResultDescriptorDict))),
            this.projectService.getTimeOnce(),
        ]).pipe(
            mergeMap(([resultDescriptor, time]) =>
                combineLatest([
                    // if we don't know the bbox of the dataset, we use the projection's whole bbox for guessing the symbology
                    // TODO: better use the screen extent?
                    resultDescriptor.bbox
                        ? of(resultDescriptor.bbox)
                        : this.spatialReferenceService
                              .getSpatialReferenceSpecification(resultDescriptor.spatialReference)
                              .pipe(map((spatialReferenceSpecification) => extentToBboxDict(spatialReferenceSpecification.extent))),
                    of(resultDescriptor.spatialReference),
                    of(time),
                ]),
            ),
            map(([bbox, crs, time]: [BBoxDict, SrsString, Time]) => {
                // for sampling, we choose a reasonable resolution
                const NUM_PIXELS = 1024;
                const xResolution = (bbox.upperRightCoordinate.x - bbox.lowerLeftCoordinate.x) / NUM_PIXELS;
                const yResolution = (bbox.upperRightCoordinate.y - bbox.lowerLeftCoordinate.y) / NUM_PIXELS;
                return {
                    bbox,
                    crs,
                    time: time.toDict(),
                    spatialResolution: [xResolution, yResolution],
                };
            }),
        );

        return combineLatest([statisticsWorkflow$, queryParams$, this.userService.getSessionOnce()]).pipe(
            first(),
            mergeMap(([statisticsWorkflow, queryParams, session]) =>
                this.backend.getPlot(statisticsWorkflow, queryParams, session.sessionToken),
            ),
            map((plot) => {
                if (plot.plotType !== 'Statistics') {
                    throw new Error('Expected `Statistics` plot.');
                }

                return plot.data as {
                    [name: string]: {
                        valueCount: number;
                        validCount: number;
                        min: number;
                        max: number;
                        mean: number;
                        stddev: number;
                    };
                };
            }),
            map((statistics) => {
                const NUMBER_OF_COLOR_STEPS = 16;
                const REVERSE_COLORS = false;

                const min = statistics[rasterName].min;
                const max = statistics[rasterName].max;
                const breakpoints = ColorMapSelectorComponent.createLinearBreakpoints(
                    MPL_COLORMAPS.VIRIDIS,
                    NUMBER_OF_COLOR_STEPS,
                    REVERSE_COLORS,
                    {
                        min,
                        max,
                    },
                );
                const colorizer = new LinearGradient(
                    breakpoints,
                    TRANSPARENT,
                    TRANSPARENT, // TODO: set under/over color to first and last breakpoint when avaialble
                );
                return new RasterSymbology(1.0, colorizer);
            }),
        );
    }
}
