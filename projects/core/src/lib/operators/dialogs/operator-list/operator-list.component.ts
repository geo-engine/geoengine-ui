import {BehaviorSubject, combineLatest, Observable, ReplaySubject} from 'rxjs';
import {map} from 'rxjs/operators';

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, Type} from '@angular/core';
import {LayoutService} from '../../../layout.service';
import {StatisticsPlotComponent} from '../statistics-plot/statistics-plot.component';
import {createIconDataUrl} from '../../../util/icons';
import {HistogramOperatorComponent} from '../histogram-operator/histogram-operator.component';
import {BoxPlotOperatorComponent} from '../boxplot-operator/boxplot-operator.component';
// eslint-disable-next-line max-len
import {MeanRasterPixelValuesOverTimeDialogComponent} from '../mean-raster-pixel-values-over-time-dialog/mean-raster-pixel-values-over-time-dialog.component';
import {PointInPolygonFilterOperatorComponent} from '../point-in-polygon-filter/point-in-polygon-filter.component';
import {RasterVectorJoinComponent} from '../raster-vector-join/raster-vector-join.component';
import {FeatureAttributeOvertimeComponent} from '../feature-attribute-over-time/feature-attribute-over-time.component';
import {TemporalRasterAggregationComponent} from '../temporal-raster-aggregation/temporal-raster-aggregation.component';
import {ScatterplotOperatorComponent} from '../scatterplot-operator/scatterplot-operator.component';
import {ExpressionOperatorComponent} from '../expression-operator/expression-operator.component';
import {ClassHistogramOperatorComponent} from '../class-histogram-operator/class-histogram-operator.component';
import {ColumnRangeFilterComponent} from '../column-range-filter/column-range-filter.component';
import {RasterTypeConversionComponent} from '../raster-type-conversion/raster-type-conversion.component';
import {InterpolationComponent} from '../interpolation/interpolation.component';

/**
 * This type encapsulates…
 *  * a component to select,
 *  * a type to display (name and icon) and
 *  * a short description text.
 */
export interface OperatorListType {
    component: Type<any>;
    config?: {[key: string]: any};
    type: {NAME: string; ICON_URL: string};
    description: string;
}

/**
 * This types groups operator list types
 */
export type OperatorListButtonGroups = Array<{
    name: string;
    list: Array<OperatorListType>;
}>;

/**
 * This component provides a list of operator dialogs to choose from.
 *
 * It provides a set of default operators but they can be overridden.
 */
@Component({
    selector: 'geoengine-operator-list',
    templateUrl: './operator-list.component.html',
    styleUrls: ['./operator-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorListComponent implements OnInit, OnChanges {
    static readonly DEFAULT_MIXED_OPERATOR_DIALOGS: Array<OperatorListType> = [
        {
            component: RasterVectorJoinComponent,
            type: {
                NAME: 'Raster Vector Join',
                ICON_URL: createIconDataUrl('Raster Vector Join'),
            },
            description: 'Attach raster values to multi-point data',
        },
        // {
        //     component: RasterPolygonClipOperatorComponent,
        //     type: {
        //         NAME: 'Raster Polygon Clip',
        //         ICON_URL: OperatorType.createIconDataUrl('Raster Polygon Clip'),
        //     },
        //     description: 'Clip a raster image via polygon boundaries',
        // },
        // {
        //     component: ROperatorComponent,
        //     type: RScriptType,
        //     description: 'Execute an R script (experimental)'
        // }
    ];

    static readonly DEFAULT_PLOT_OPERATOR_DIALOGS: Array<OperatorListType> = [
        {
            component: HistogramOperatorComponent,
            type: {
                NAME: 'Histogram',
                ICON_URL: createIconDataUrl('Histogram'),
            },
            description: 'Create a histogram from vector or raster data',
        },
        {
            component: ClassHistogramOperatorComponent,
            type: {
                NAME: 'Class Histogram',
                ICON_URL: createIconDataUrl('Class Histogram'),
            },
            description: 'Create a class histogram from categorical vector or raster data',
        },
        //     {
        //         component: PieChartComponent,
        //         type: PieChartType,
        //         description: 'Plot your data as a pie chart',
        //     },
        {
            component: ScatterplotOperatorComponent,
            type: {
                NAME: 'Scatter Plot',
                ICON_URL: createIconDataUrl('Scatter Plot'),
            },
            description: 'Scatter plot your data',
        },
        {
            component: BoxPlotOperatorComponent,
            type: {
                NAME: 'Box Plot',
                ICON_URL: createIconDataUrl('Box Plot'),
            },
            description: 'Box plot your data',
        },
        {
            component: StatisticsPlotComponent,
            type: {
                NAME: 'Basic Statistics',
                ICON_URL: createIconDataUrl('Basic Statistics'),
            },
            description: 'Get statistics for raster or vector layer',
        },
        {
            component: MeanRasterPixelValuesOverTimeDialogComponent,
            type: {
                NAME: 'Temporal Raster Mean Plot',
                ICON_URL: createIconDataUrl('Temporal Raster Mean Plot'),
            },
            description: 'Create an area chart over the mean pixel values of the images of a raster time series',
        },
        {
            component: FeatureAttributeOvertimeComponent,
            type: {
                NAME: 'Temporal Feature Attribute Plot',
                ICON_URL: createIconDataUrl('Temporal Feature Attribute Plot'),
            },
            description: 'Create a multi line chart over the attribute values of a feature layer',
        },
    ];

    static readonly DEFAULT_RASTER_OPERATOR_DIALOGS: Array<OperatorListType> = [
        {
            component: ExpressionOperatorComponent,
            type: {
                NAME: 'Expression',
                ICON_URL: 'assets/operator-type-icons/expression.png',
            },
            description: 'Calculate an expression on a raster',
        },
        {
            component: TemporalRasterAggregationComponent,
            type: {
                NAME: 'Temporal Raster Aggregation',
                ICON_URL: createIconDataUrl('Temporal Raster Aggregation'),
            },
            description: 'Aggregate raster time series',
        },
        {
            component: RasterTypeConversionComponent,
            type: {
                NAME: 'Convert Raster Data Type',
                ICON_URL: createIconDataUrl('Raster Type Conversion'),
            },
            description: 'Converts (casts) the raster type',
        },
        {
            component: InterpolationComponent,
            type: {
                NAME: 'Interpolation',
                ICON_URL: createIconDataUrl('Interpolation'),
            },
            description: 'Interpolates raster data',
        },
        // {
        //     component: RasterMaskComponent,
        //     type: {
        //         NAME: 'Raster Mask',
        //         ICON_URL: OperatorType.createIconDataUrl('Raster Mask'),
        //     },
        //     description: 'Apply a mask to a raster',
        // },
        // {
        //     component: RgbCompositeComponent,
        //     type: RgbaCompositeType,
        //     description: 'Create an RGB composite from a set of rasters',
        // }
    ];

    static readonly DEFAULT_VECTOR_OPERATOR_DIALOGS: Array<OperatorListType> = [
        // {
        //     component: NumericAttributeFilterOperatorComponent,
        //     type: NumericAttributeFilterType,
        //     description: 'Filter data via numeric range',
        // },
        // {
        //     component: HeatmapOperatorComponent,
        //     type: HeatmapType,
        //     description: 'Create a heatmap for points',
        // },
        {
            component: ColumnRangeFilterComponent,
            type: {
                NAME: 'Column Range Filter',
                ICON_URL: createIconDataUrl('Column Range Filter'),
            },
            description: 'Filter columns by numbers or strings',
        },
        {
            component: PointInPolygonFilterOperatorComponent,
            type: {
                NAME: 'Point in Polygon',
                ICON_URL: createIconDataUrl('Point in Polygon'),
            },
            description: 'Filter points that are enclosed by a polygon',
        },
        // {
        //     component: TextualAttributeFilterOperatorComponent,
        //     type: TextualAttributeFilterType,
        //     description: 'Filter data via text filter',
        // },
    ];

    /**
     * Specify (optionally) a custom set of operator groups and list entries (buttons)
     */
    @Input() operators: OperatorListButtonGroups = [
        // default operator set
        {name: 'Mixed', list: OperatorListComponent.DEFAULT_MIXED_OPERATOR_DIALOGS},
        {name: 'Plots', list: OperatorListComponent.DEFAULT_PLOT_OPERATOR_DIALOGS},
        {name: 'Raster', list: OperatorListComponent.DEFAULT_RASTER_OPERATOR_DIALOGS},
        {name: 'Vector', list: OperatorListComponent.DEFAULT_VECTOR_OPERATOR_DIALOGS},
    ];

    readonly operators$ = new ReplaySubject<OperatorListButtonGroups>(1);
    readonly operatorGroups$: Observable<Array<{name: string; list: Array<OperatorListType>}>>;
    readonly searchString$ = new BehaviorSubject<string>('');

    /**
     * DI of services
     */
    constructor(private layoutService: LayoutService) {
        this.operatorGroups$ = combineLatest([this.operators$, this.searchString$.pipe(map((s) => s.toLowerCase()))]).pipe(
            map(([operatorGroups, searchString]) => {
                const nameComparator = (a: string, b: string): number => {
                    const stripped = (s: string): string => s.replace(' ', '');

                    return stripped(a).localeCompare(stripped(b));
                };

                const filteredGroups = [];
                for (const group of operatorGroups) {
                    const operators = [];
                    for (const operator of group.list) {
                        const searchMatchesTypeName = (): boolean => operator.type.NAME.toLowerCase().includes(searchString);
                        const searchMatchesDescription = (): boolean => operator.description.toLowerCase().includes(searchString);

                        if (searchMatchesTypeName() || searchMatchesDescription()) {
                            operators.push(operator);
                        }
                    }

                    if (operators.length > 0) {
                        filteredGroups.push({
                            name: group.name,
                            list: operators.sort((a, b) => nameComparator(a.type.NAME, b.type.NAME)),
                        });
                    }
                }

                return filteredGroups.sort((a, b) => nameComparator(a.name, b.name));
            }),
        );
    }

    ngOnInit(): void {
        this.operators$.next(this.operators);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.operators) {
            this.operators$.next(this.operators);
        }
    }

    /**
     * Load a selected dialog into the sidenav
     */
    load(component: Type<any>, config?: {[key: string]: any}): void {
        this.layoutService.setSidenavContentComponent({component, config, keepParent: true});
    }
}
