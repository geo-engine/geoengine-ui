import {map, mergeMap, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, combineLatest, firstValueFrom, from} from 'rxjs';
import {AfterViewInit, ChangeDetectionStrategy, Component, effect, inject, input, Input, output, signal} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

import {TypedOperatorOperator, Workflow as WorkflowDict} from '@geoengine/openapi-client';
import {RasterLayer} from '../../layers/layer.model';
import {ResultTypes} from '../../operators/result-type.model';
import {RasterResultDescriptor, UUID} from '../../datasets/dataset.model';
import {SrsString} from '../../spatial-references/spatial-reference.model';
import {extentToBboxDict} from '../../util/conversions';
import {geoengineValidators} from '../../util/form.validators';
import {SymbologyQueryParams, MultiBandRasterColorizer} from '../symbology.model';
import {Color, TRANSPARENT} from '../../colors/color';

interface RgbSettingsForm {
    red: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
    green: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
    blue: FormGroup<{
        min: FormControl<number>;
        max: FormControl<number>;
        scale: FormControl<number>;
    }>;
    noDataColor: FormControl<Color>;
}

interface RgbRasterStats {
    red: {
        min: number;
        max: number;
    };
    green: {
        min: number;
        max: number;
    };
    blue: {
        min: number;
        max: number;
    };
}

type RgbColorName = 'red' | 'green' | 'blue';

/**
 * This dialog allows calculations on (one or more) raster layers.
 */
@Component({
    selector: 'geoengine-raster-multiband-symbology-editor',
    templateUrl: './raster-multiband-symbology-editor.component.html',
    styleUrls: ['./raster-multiband-symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RasterMultibandSymbologyEditorComponent {
    private readonly formBuilder = inject(FormBuilder);

    readonly band = input.required<string>();
    readonly workflowId = input.required<UUID>();
    readonly queryParams = input<SymbologyQueryParams>();
    readonly colorizer = input.required<MultiBandRasterColorizer>();
    readonly colorizerChange = output<MultiBandRasterColorizer>();

    readonly RASTER_TYPE = [ResultTypes.RASTER];
    readonly CHANNELS: Array<{color: RgbColorName; label: string}> = [
        {color: 'red', label: 'A'},
        {color: 'green', label: 'B'},
        {color: 'blue', label: 'C'},
    ];
    readonly form: FormGroup<RgbSettingsForm>;

    readonly isLoadingRasterStats = signal(false);

    /**
     * Set up the form and disable it if the raster stats are loading
     */
    constructor() {
        const formBuilder = this.formBuilder.nonNullable;
        this.form = new FormGroup<RgbSettingsForm>({
            red: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
            green: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
            blue: formBuilder.group(
                {
                    min: formBuilder.control(0, Validators.required),
                    max: formBuilder.control(255, Validators.required),
                    scale: formBuilder.control(1, [Validators.required, Validators.min(0), Validators.max(1)]),
                },
                {
                    validators: geoengineValidators.minAndMax('min', 'max', {
                        checkBothExist: true,
                        mustNotEqual: true,
                    }),
                },
            ),
            noDataColor: formBuilder.control<Color>(TRANSPARENT, Validators.required),
        });

        effect(() => {
            if (this.isLoadingRasterStats()) {
                this.form.disable();
            } else {
                this.form.enable();
            }
        });
    }

    calculateRasterStats(): void {
        if (this.isLoadingRasterStats()) {
            return; // checked by form validator
        }

        // const rasterLayers: Array<RasterLayer> | undefined = this.form.controls.rasterLayers.value;

        // if (!rasterLayers || rasterLayers.length !== 3) {
        //     return; // checked by form validator
        // }

        // this.isRasterStatsNotLoading$.next(false);

        // from(this.queryRasterStats(rasterLayers[0], rasterLayers[1], rasterLayers[2])).subscribe({
        //     next: (plotData) => {
        //         this.isRasterStatsNotLoading$.next(true);

        //         const colors: Array<RgbColorName> = ['red', 'green', 'blue'];

        //         for (const color of colors) {
        //             this.form.controls[color].controls.min.setValue(plotData[color].min);
        //             this.form.controls[color].controls.max.setValue(plotData[color].max);
        //         }

        //         this.form.updateValueAndValidity();
        //     },
        //     error: (error) => {
        //         const errorMsg = error.error.message;
        //         this.notificationService.error(errorMsg);

        //         this.isRasterStatsNotLoading$.next(true);
        //     },
        // });
    }

    // protected async queryRasterStats(layerRed: RasterLayer, layerGreen: RasterLayer, layerBlue: RasterLayer): Promise<RgbRasterStats> {
    //     const [redOperator, greenOperator, blueOperator] = await firstValueFrom(
    //         this.projectService.getAutomaticallyProjectedOperatorsFromLayers([layerRed, layerGreen, layerBlue]),
    //     );

    //     const workflow: WorkflowDict = {
    //         type: 'Plot',
    //         operator: {
    //             type: 'Statistics',
    //             params: {columnNames: ['red', 'green', 'blue']},
    //             sources: {
    //                 source: [redOperator, greenOperator, blueOperator],
    //             },
    //         } as StatisticsDict,
    //     };

    //     const [workflowId, sessionToken, queryParams] = await firstValueFrom(
    //         combineLatest([
    //             this.projectService.registerWorkflow(workflow),
    //             this.userService.getSessionTokenForRequest(),
    //             this.estimateQueryParams(redOperator), // we use the red operator to estimate the query params
    //         ]),
    //     );

    //     const plot = await firstValueFrom(this.backend.getPlot(workflowId, queryParams, sessionToken));
    //     const plotData = plot.data as {
    //         [name: string]: {
    //             valueCount: number;
    //             validCount: number;
    //             min: number;
    //             max: number;
    //             mean: number;
    //             stddev: number;
    //         };
    //     };

    //     return {
    //         red: {
    //             min: plotData.red.min,
    //             max: plotData.red.max,
    //         },
    //         green: {
    //             min: plotData.green.min,
    //             max: plotData.green.max,
    //         },
    //         blue: {
    //             min: plotData.blue.min,
    //             max: plotData.blue.max,
    //         },
    //     };
    // }

    /**
     * TODO: put function to util or service?
     * A similar function is used in the symbology component
    //  */
    // protected async estimateQueryParams(rasterOperator: TypedOperatorOperator): Promise<{
    //     bbox: BBoxDict;
    //     crs: SrsString;
    //     time: TimeIntervalDict;
    //     spatialResolution: [number, number];
    // }> {
    //     const rasterWorkflowId = await firstValueFrom(
    //         this.projectService.registerWorkflow({
    //             type: 'Raster',
    //             operator: rasterOperator as TypedOperatorOperator,
    //         }),
    //     );

    //     const resultDescriptorDict = await firstValueFrom(this.projectService.getWorkflowMetaData(rasterWorkflowId));

    //     const resultDescriptor = RasterResultDescriptor.fromDict(resultDescriptorDict as RasterResultDescriptorDict);

    //     let bbox = resultDescriptor.bbox;

    //     if (!bbox) {
    //         // if we don't know the bbox of the dataset, we use the projection's whole bbox for guessing the symbology
    //         // TODO: better use the screen extent?
    //         bbox = await firstValueFrom(
    //             this.spatialReferenceService
    //                 .getSpatialReferenceSpecification(resultDescriptor.spatialReference)
    //                 .pipe(map((spatialReferenceSpecification) => extentToBboxDict(spatialReferenceSpecification.extent))),
    //         );
    //     }

    //     const time = await this.projectService.getTimeOnce();

    //     // for sampling, we choose a reasonable resolution
    //     const NUM_PIXELS = 1024;
    //     const xResolution = (bbox.upperRightCoordinate.x - bbox.lowerLeftCoordinate.x) / NUM_PIXELS;
    //     const yResolution = (bbox.upperRightCoordinate.y - bbox.lowerLeftCoordinate.y) / NUM_PIXELS;
    //     return {
    //         bbox,
    //         crs: resultDescriptor.spatialReference,
    //         time: time.toDict(),
    //         spatialResolution: [xResolution, yResolution],
    //     };
    // }
}
