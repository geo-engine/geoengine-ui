import {AfterViewInit, ChangeDetectionStrategy, Component, inject, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {Breakpoints, BreakpointObserver} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {TemplatePortal} from '@angular/cdk/portal';
import {PortalModule} from '@angular/cdk/portal';
import {BehaviorSubject, Observable} from 'rxjs';
import {BackendService, CoreModule, MapContainerComponent, UserService} from '@geoengine/core';
import {CommonConfig, Layer, Time, VegaChartData} from '@geoengine/common';
import {utc} from 'moment';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CoreModule, PortalModule, AsyncPipe, MatGridListModule, MatMenuModule, MatIconModule, MatButtonModule, MatCardModule],
})
export class DashboardComponent implements AfterViewInit {
    private breakpointObserver = inject(BreakpointObserver);

    indicators = ['Land type', 'Vegetation'];

    @ViewChild(MapContainerComponent, {static: true}) mapComponent!: MapContainerComponent;

    @ViewChild('welcome') welcome!: TemplateRef<unknown>;
    @ViewChild('inspect') inspect!: TemplateRef<unknown>;
    @ViewChild('select') select!: TemplateRef<unknown>;
    @ViewChild('review') review!: TemplateRef<unknown>;

    private _viewContainerRef = inject(ViewContainerRef);

    cards = new BehaviorSubject<Array<{title: string; cols: number; rows: number; content: TemplatePortal}>>([]);
    layersReverse: Array<Layer> = [];

    timeSteps: Time[] = [
        new Time(utc('2024-01-01')),
        new Time(utc('2024-02-01')),
        new Time(utc('2024-03-01')),
        new Time(utc('2024-04-01')),
        new Time(utc('2024-05-01')),
        new Time(utc('2024-06-01')),
    ];

    chartData: VegaChartData = {
        vegaString: `{
                  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                  "width": "container",
                  "data": {
                    "values": [
                      {
                        "foobar": "bar",
                        "Frequency": 3
                      },
                      {
                        "foobar": "baz",
                        "Frequency": 10
                      },
                      {
                        "foobar": "foo",
                        "Frequency": 1
                      }
                    ]
                  },
                  "mark": "bar",
                  "encoding": {
                    "x": {
                      "field": "foobar",
                      "type": "nominal",
                      "axis": {
                          "labelAngle": -45
                      }
                    },
                    "y": {
                      "field": "Frequency",
                      "type": "quantitative"
                    }
                  }
                }`,
    };

    constructor(readonly userService: UserService) {}

    ngAfterViewInit(): void {
        this.breakpointObserver
            .observe(Breakpoints.Handset)
            .pipe(
                map(({matches}) => {
                    const cards = [
                        {
                            title: 'Welcome',
                            cols: 1,
                            rows: 1,
                            content: new TemplatePortal(this.welcome, this._viewContainerRef),
                        },
                        {
                            title: 'Inspect',
                            cols: 1,
                            rows: 2,
                            content: new TemplatePortal(this.inspect, this._viewContainerRef),
                        },
                        {
                            title: 'Draw Area and Select Time',
                            cols: 1,
                            rows: 1,
                            content: new TemplatePortal(this.select, this._viewContainerRef),
                        },
                        {
                            title: 'Review Indicator',
                            cols: 2,
                            rows: 1,
                            content: new TemplatePortal(this.review, this._viewContainerRef),
                        },
                    ];

                    if (matches) {
                        for (const card of cards) {
                            card.cols = 2;
                            card.rows = 1;
                        }
                    }

                    return cards;
                }),
            )
            .subscribe(this.cards);
    }

    idFromLayer(index: number, layer: Layer): number {
        return layer.id;
    }

    analyze(): void {
        throw new Error('Method not implemented.');
    }
    reset(): void {
        throw new Error('Method not implemented.');
    }
    draw(): void {
        throw new Error('Method not implemented.');
    }
}
