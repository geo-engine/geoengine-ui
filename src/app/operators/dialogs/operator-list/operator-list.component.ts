import {Component, OnInit, ChangeDetectionStrategy, Type} from '@angular/core';
import {RasterValueExtractionType} from '../../types/raster-value-extraction-type.model';

import {NumericAttributeFilterType} from '../../types/numeric-attribute-filter-type.model';
import {NumericAttributeFilterOperatorComponent} from '../numeric-attribute-filter/numeric-attribute-filter.component';

import {PointInPolygonFilterType} from '../../types/point-in-polygon-filter-type.model';
import {PointInPolygonFilterOperatorComponent} from '../point-in-polygon-filter/point-in-polygon-filter.component';

import {ExpressionOperatorComponent} from '../expression-operator/expression-operator.component';
import {ExpressionType} from '../../types/expression-type.model';

import {HistogramType} from '../../types/histogram-type.model';
import {RasterValueExtractionOperatorComponent} from '../raster-value-extraction/raster-value-extraction.component';
import {HistogramOperatorComponent} from '../histogram-operator/histogram-operator.component';
import {LayoutService} from '../../../layout.service';
import {Observable, BehaviorSubject} from 'rxjs/Rx';
import {ROperatorComponent} from '../r/r-operator/r-operator.component';
import {RScriptType} from '../../types/r-script-type.model';
import {PieChartComponent} from '../pie-chart-operator/pie-chart-operator.component';
import {PieChartType} from '../../types/piechart-type.model';
import {ScatterPlotComponent} from '../scatter-plot-operator/scatter-plot-operator.component';
import {ScatterPlotType} from '../../types/scatterplot-type.model';

interface OperatorListType {
    component: Type<any>;
    type: {NAME: string, ICON_URL: string};
    description: string;
}

const MIXED_OPERATORS: Array<OperatorListType> = [
    {
        component: RasterValueExtractionOperatorComponent,
        type: RasterValueExtractionType,
        description: 'Attach raster values to vector data',
    },
    {
        component: ROperatorComponent,
        type: RScriptType,
        description: 'Execute an R script (experimental)'
    }
];

const PLOT_OPERATORS: Array<OperatorListType> = [
    {
        component: HistogramOperatorComponent,
        type: HistogramType,
        description: 'Create a histogram from vector or raster data',
    },
    {
        component: PieChartComponent,
        type: PieChartType,
        description: 'Plot your data as a pie chart',
    },
    {
        component: ScatterPlotComponent,
        type: ScatterPlotType,
        description: 'Scatter plot your data'
    },
];

const RASTER_OPERATORS: Array<OperatorListType> = [
    {
        component: ExpressionOperatorComponent,
        type: ExpressionType,
        description: 'Calculate an expression on a raster',
    },
];

const VECTOR_OPERATORS: Array<OperatorListType> = [
    {
        component: NumericAttributeFilterOperatorComponent,
        type: NumericAttributeFilterType,
        description: 'Filter data via numeric range',
    },
    {
        component: PointInPolygonFilterOperatorComponent,
        type: PointInPolygonFilterType,
        description: 'Filter points that are enclosed by a polygon',
    },
];

const ALL_OPERATORS: Array<{name: string, list: Array<OperatorListType>}> = [
    {name: 'Mixed', list: MIXED_OPERATORS},
    {name: 'Plots', list: PLOT_OPERATORS},
    {name: 'Raster', list: RASTER_OPERATORS},
    {name: 'Vector', list: VECTOR_OPERATORS},
];

@Component({
    selector: 'wave-operator-list',
    templateUrl: './operator-list.component.html',
    styleUrls: ['./operator-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorListComponent implements OnInit {

    operatorGroups$: Observable<Array<{name: string, list: Array<OperatorListType>}>>;
    searchString$ = new BehaviorSubject<string>('');

    constructor(private layoutService: LayoutService) {
    }

    ngOnInit() {
        this.operatorGroups$ = Observable.combineLatest(
            Observable.of(ALL_OPERATORS),
            this.searchString$.map(s => s.toLowerCase()),
            (operatorGroups, searchString) => {
                const nameComparator = (a: string, b: string): number => {
                    const stripped = (s: string): string => s.replace(' ', '');

                    return stripped(a).localeCompare(stripped(b));
                };

                const filteredGroups = [];
                for (const group of operatorGroups) {
                    const operators = [];
                    for (const operator of group.list) {
                        const typeName = operator.type.NAME.toLowerCase();
                        const description = operator.description.toLowerCase();
                        if (typeName.indexOf(searchString) >= 0 || description.indexOf(searchString) >= 0) {
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
            }
        );
    }

    load(component: Type<Component>) {
        this.layoutService.setSidenavContentComponent({component: component, parent: OperatorListComponent});
    }

}
