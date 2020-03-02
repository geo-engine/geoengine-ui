import {configureWaveTesting} from '../spec/wave-testing.configuration';
import {fakeAsync, TestBed, TestModuleMetadata, tick} from '@angular/core/testing';
import {Config} from '../config.service';
import {UserService} from '../users/user.service';
import {NotificationService} from '../notification.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ProjectService} from './project.service';
import {MappingQueryService} from '../queries/mapping-query.service';
import {clear_user_service_requests, MockBackend} from '../users/user.service.spec';
import {LayerService} from '../layers/layer.service';
import {LayoutService} from '../layout.service';
import {ReplaySubject, Subject} from 'rxjs';
import {Plot} from '../plots/plot.model';
import {MapService} from '../map/map.service';
import {RScriptTypeDict} from '../operators/types/r-script-type.model';
import {Layer} from '../layers/layer.model';
import {RasterSourceType} from '../operators/types/raster-source-type.model';
import {RasterSymbologyDict} from '../layers/symbology/symbology.model';

class MockConfig {

    static MOCK_URL = 'localhost:8089/mapping-mock';
    static MOCK_USER = {
        GUEST: {
            NAME: 'guest',
            PASSWORD: 'guest',
        }
    };

    get MAPPING_URL(): string {
        return MockConfig.MOCK_URL;
    }

    get USER(): { GUEST: { NAME: string, PASSWORD: string} } {
        return MockConfig.MOCK_USER;
    }

    get DELAYS(): { LOADING: { MIN: number, }, TOOLTIP: number, DEBOUNCE: number, STORAGE_DEBOUNCE: number, GUEST_LOGIN_HINT: number } {
        return {
            LOADING: {
                MIN: 0,
            },
            TOOLTIP: 5,
            DEBOUNCE: 0,
            STORAGE_DEBOUNCE: 0,
            GUEST_LOGIN_HINT: 5,
        };
    }

    get DEFAULTS(): {PROJECT: { NAME: string, TIME: string, TIMESTEP:
                '15 minutes' | '1 hour' | '1 day' | '1 month' | '6 months' | '1 year', PROJECTION: 'EPSG:3857' | 'EPSG:4326', } } {
        return {
            PROJECT: {
                NAME: 'DEFAULT',
                TIME: '2000-01-01T00:00:00',
                TIMESTEP: '1 hour',
                PROJECTION: 'EPSG:3857'
            }
        };
    }
}

class MockNotificationService {
    info(message: string) {}
    error(message: string) {}
}

class MockLayoutService {
    private sidenavContentMaxWidth$: Subject<number> = new ReplaySubject(1);

    constructor() {
        this.sidenavContentMaxWidth$.next(200);
    }

    getSidenavWidthStream() {
        return this.sidenavContentMaxWidth$;
    }
}

const module = {
    providers: [
        {provide: Config, useClass: MockConfig},
        {provide: NotificationService, useClass: MockNotificationService},
        LayerService,
        {provide: LayoutService, useClass: MockLayoutService},
        MapService,
        UserService,
        MappingQueryService,
        ProjectService,
    ],
    imports: [
        HttpClientTestingModule
    ]
} as TestModuleMetadata;

function login(http: HttpTestingController, backend: MockBackend) {
    clear_user_service_requests(http);

    expect(http.match(req => true).length).toBe(0);

    let user = TestBed.get(UserService);

    let completed = null;
    user.login({user: 'test', password: 'test_pw'})
        .subscribe((login_response) => {
                expect(login_response).toBe(true);

                expect(user.getSession().user).toBe('test');
                expect(user.getSession().sessionToken).toBe('mockSessionToken');
            },
            (error) => {},
            () => {
                completed = true;
            }
        );

    backend.testLogin();
    http.verify();
    expect(user.getSession()).toEqual({
        user: 'test',
        sessionToken: 'mockSessionToken',
        staySignedIn: true,
        isExternallyConnected: false
    });
    expect(completed).toBeTruthy();
}

describe('Service: Project Service', () => {
    describe('Plot tests', () => {
        configureWaveTesting(fakeAsync(() => {
            TestBed.configureTestingModule(module);
            this.service = TestBed.get(ProjectService);
            this.http = TestBed.get(HttpTestingController); // Mapping Query Service requires http for plot subscriptions
            this.backend = new MockBackend(this.http, MockConfig.MOCK_URL);
            this.service.setProject(this.service.createDefaultProject());

            login(this.http, this.backend);

            // add a plot to the service.

            this.plot = Plot.fromDict({
                name: 'test_plot',
                operator: {
                    id: 0,
                    operatorType: {
                        operatorType: 'r_script',
                        resultType: 'plot',
                        code: 'test_code'
                    } as RScriptTypeDict,
                    resultType: 'plot',
                    projection: 'EPSG:3857',
                    attributes: [],
                    dataTypes: [],
                    units: [],
                    rasterSources: [],
                    pointSources: [],
                    lineSources: [],
                    polygonSources: [],
                    operatorTypeParameterOptions: undefined,
                }
            });
            this.plotUrl = MockConfig.MOCK_URL +
                '?time=2000-01-01T00:00:00.000Z&service=plot&request=&sessiontoken=mockSessionToken&crs=EPSG:3857&bbox=0,0,0,' +
                '0&query=%7B%22type%22%3A%22r_script%22%2C%22params%22%3A%7B%22source%22%3A%22test_code%22%2C%22result%22%3A%' +
                '22plot%22%2C%22plot_width%22%3A168%2C%22plot_height%22%3A168%7D%7D';
            this.completed = false;

            this.service.addPlot(this.plot).subscribe(
                () => {},
                (error) => {},
                () => {
                    this.completed = true;
                });

            // Wait until all promises are resolved (chain of multiple function calls in addPlot)
            tick();

            const request = this.http.expectOne(this.plotUrl);
            request.flush({type: 'png', data: 'dummy_data'});
        }));

        it('uses the expected http calls', () => {
            this.http.verify();
        });

        it('finalizes addPlot-Observable', () => {
            expect(this.completed).toBeTruthy();
        });

        it('finalizes removePlot-Observable', async () => {
            let completed = false;
            await this.service.removePlot(this.plot).subscribe(() => {},
                (error) => {},
                () => {
                    completed = true;
                });
            expect(completed).toBeTruthy();
        });

        it('adds plot', async () => {
            await this.service.getProjectStream().subscribe((project) => {
                expect(project.plots.length).toBe(1);
            });
            await this.service.getPlotDataStream(this.plot).subscribe((data) => {
                expect(data.data).toEqual('dummy_data');
            });
        });

        it('removes plot', async () => {
            await this.service.removePlot(this.plot);
            await this.service.getProjectStream().subscribe((project) => {
                expect(project.plots.length).toBe(0);
            });
        });

        it('clears plots', async () => {
            this.service.clearPlots();
            await this.service.getProjectStream().subscribe((project) => {
                expect(project.plots.length).toBe(0);
            });
        });
    });

    describe('Layer tests', () => {
        configureWaveTesting(fakeAsync(() => {
            TestBed.configureTestingModule(module);
            this.service = TestBed.get(ProjectService);
            this.http = TestBed.get(HttpTestingController); // Mapping Query Service requires http for plot subscriptions
            this.backend = new MockBackend(this.http, MockConfig.MOCK_URL);
            this.service.setProject(this.service.createDefaultProject());

            login(this.http, this.backend);

            this.layer = Layer.fromDict({
                name: 'test_layer',
                operator: {
                    id: 0,
                    operatorType: new RasterSourceType({
                        channel: 0,
                        sourcename: 'source',
                        transform: false
                    }).toDict(),
                    resultType: 'raster',
                    projection: 'EPSG:3857',
                    attributes: [],
                    dataTypes: [],
                    units: [],
                    rasterSources: [],
                    pointSources: [],
                    lineSources: [],
                    polygonSources: [],
                    operatorTypeParameterOptions: undefined,
                },
                symbology: {
                    symbologyType: 'RASTER',
                    opacity: 0.5,
                    unit: {
                        measurement: 'row',
                        unit: 'unknown'
                    }
                } as RasterSymbologyDict,
                expanded: true,
                visible: true,
                editSymbology: false,
                type: 'raster'
            });

            this.completed = false;

            this.service.addLayer(this.layer).subscribe(
                () => {},
                (error) => {},
                () => {
                    this.completed = true;
                }
            );
        }));

        it('finalizes addLayer-Observable', () => {
            expect(this.completed).toBeTruthy();
        });

        it('adds layer', async () => {
            await this.service.getLayerStream().subscribe(arr => expect(arr.length).toBe(1));
        });

        it('removes layer and finalizes Observable', async () => {
            let completed = false;
            await this.service.removeLayer(this.layer).subscribe(
                () => {},
                (error) => {},
                () => {
                    completed = true;
                }
            );
            expect(completed).toBeTruthy();
            await this.service.getProjectStream().subscribe((project) => {
                expect(project.layers.length).toBe(0);
            });
        });

        it('clears layers', async () => {
            this.service.clearLayers();
            await this.service.getProjectStream().subscribe((project) => {
                expect(project.layers.length).toBe(0);
            });
        });
    });
});
