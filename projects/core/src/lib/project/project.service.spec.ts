import {vi, type Mock} from 'vitest';
import {Project} from './project.model';
import {ProjectService} from './project.service';
import moment from 'moment';
import {Session} from '../users/session.model';
import {User} from '../users/user.model';
import {NEVER, of} from 'rxjs';
import {CoreConfig, DEFAULT_CORE_CONFIG} from '../config.service';
import {CreateProjectResponseDict, STRectangleDict, TimeStepDict, UUID} from '../backend/backend.model';
import {MapService} from '../map/map.service';
import {BackendService} from '../backend/backend.service';
import {SpatialReferenceService, WGS_84} from '../spatial-references/spatial-reference.service';
import {first, mergeMap, tap} from 'rxjs/operators';
import {Configuration, DefaultConfig} from '@geoengine/openapi-client';
import {LayersService, NotificationService, SpatialReferenceSpecification, Time, UserService} from '@geoengine/common';
import {TestBed} from '@angular/core/testing';

describe('test project methods in projectService', () => {
    let notificationServiceSpy: {
        error: Mock;
    };
    let mapServiceSpy: {
        getViewportSizeStream: Mock;
    };
    let backendSpy: {
        createProject: Mock;
        listProjects: Mock;
        setSessionProject: Mock;
        updateProject: Mock;
    };
    let userServiceSpy: {
        getSessionStream: Mock;
        getSessionTokenForRequest: Mock;
    };
    let spatialReferenceSpy: {
        getSpatialReferenceSpecification: Mock;
    };
    let layersServiceSpy: {
        resolveLayer: Mock;
    };

    let projectService: ProjectService;

    beforeEach(() => {
        notificationServiceSpy = {
            error: vi.fn().mockName('NotificationService.error'),
        };
        mapServiceSpy = {
            getViewportSizeStream: vi.fn().mockName('MapService.getViewportSizeStream'),
        };
        backendSpy = {
            createProject: vi.fn().mockName('BackendService.createProject'),
            listProjects: vi.fn().mockName('BackendService.listProjects'),
            setSessionProject: vi.fn().mockName('BackendService.setSessionProject'),
            updateProject: vi.fn().mockName('BackendService.updateProject'),
        };
        userServiceSpy = {
            getSessionStream: vi.fn().mockName('UserService.getSessionStream'),
            getSessionTokenForRequest: vi.fn().mockName('UserService.getSessionTokenForRequest'),
        };
        spatialReferenceSpy = {
            getSpatialReferenceSpecification: vi.fn().mockName('SpatialRefernceService.getSpatialReferenceSpecification'),
        };
        layersServiceSpy = {
            resolveLayer: vi.fn().mockName('LayersSerivce.resolveLayer'),
        };

        const sessionToken = 'ffffffff-ffff-4fff-afff-ffffffffffff';

        // always return the same session
        userServiceSpy.getSessionStream.mockReturnValue(
            of<Session>({
                sessionToken,
                apiConfiguration: new Configuration({
                    basePath: DefaultConfig.basePath,
                    fetchApi: DefaultConfig.fetchApi,
                    middleware: DefaultConfig.middleware,
                    queryParamsStringify: DefaultConfig.queryParamsStringify,
                    username: DefaultConfig.username,
                    password: DefaultConfig.password,
                    apiKey: DefaultConfig.apiKey,
                    accessToken: sessionToken,
                    headers: DefaultConfig.headers,
                    credentials: DefaultConfig.credentials,
                }),
                user: new User({
                    id: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
                }),
                validUntil: moment.utc('3000-01-01'),
            }),
        );

        userServiceSpy.getSessionTokenForRequest.mockReturnValue(of<UUID>('ffffffff-ffff-4fff-afff-ffffffffffff'));

        spatialReferenceSpy.getSpatialReferenceSpecification.mockReturnValue(
            of<SpatialReferenceSpecification>(
                new SpatialReferenceSpecification({
                    name: 'WGS84',
                    spatialReference: 'EPSG:4326',
                    projString: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
                    extent: {
                        lowerLeftCoordinate: {
                            x: -180,
                            y: -90,
                        },
                        upperRightCoordinate: {
                            x: 180,
                            y: 90,
                        },
                    },
                    axisLabels: ['longitude', 'latitude'],
                }),
            ),
        );

        // for constructor
        backendSpy.listProjects.mockReturnValue(NEVER); // never complete and set any project

        backendSpy.createProject.mockReturnValue(
            of<CreateProjectResponseDict>({
                id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            }),
        );

        backendSpy.updateProject.mockReturnValue(
            of<CreateProjectResponseDict>({
                id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            }),
        );

        TestBed.configureTestingModule({
            providers: [
                ProjectService,
                {provide: CoreConfig, useValue: DEFAULT_CORE_CONFIG},
                {provide: NotificationService, useValue: notificationServiceSpy},
                {provide: MapService, useValue: mapServiceSpy},
                {provide: BackendService, useValue: backendSpy},
                {provide: UserService, useValue: userServiceSpy},
                {provide: SpatialReferenceService, useValue: spatialReferenceSpy},
                {provide: LayersService, useValue: layersServiceSpy},
            ],
        });

        projectService = TestBed.inject(ProjectService);
    });

    it('#createDefaultProject should create a default project', async () => {
        projectService.createDefaultProject().subscribe(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            (project) =>
                expect(project.toDict()).toEqual(
                    new Project({
                        id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                        name: 'Default',
                        description: 'Default project',
                        spatialReference: WGS_84.spatialReference,
                        time: new Time(moment.utc('2014-04-01 12:00:00')),
                        bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                        plots: [],
                        layers: [],
                        timeStepDuration: {
                            durationAmount: 1,
                            durationUnit: 'month',
                        },
                        version: {
                            changed: project.version.changed,
                            id: '0',
                        },
                    }).toDict(),
                ),
            (error) => fail(error),
            () => {
                expect(backendSpy.createProject).toHaveBeenCalledTimes(1);
                expect(backendSpy.createProject).toHaveBeenCalledWith(
                    {
                        name: 'Default',
                        description: 'Default project',
                        bounds: {
                            boundingBox: {
                                lowerLeftCoordinate: {
                                    x: -180,
                                    y: -90,
                                },
                                upperRightCoordinate: {
                                    x: 180,
                                    y: 90,
                                },
                            },
                            spatialReference: 'EPSG:4326',
                            timeInterval: {start: 1396353600000, end: 1396353600000},
                        } as STRectangleDict,
                        timeStep: {
                            step: 1,
                            granularity: 'months',
                        } as TimeStepDict,
                    },
                    'ffffffff-ffff-4fff-afff-ffffffffffff',
                );
            },
        );
    });

    it('#createProject should create a project', async () => {
        projectService
            .createProject({
                name: 'testProject',
                description: 'testDescription',
                spatialReference: WGS_84.spatialReference,
                time: new Time(moment.utc('2021-07-04 11:00:00')),
                bounds: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                timeStepDuration: {
                    durationAmount: 1,
                    durationUnit: 'month',
                },
            })
            .subscribe(
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                (project) =>
                    expect(project.toDict()).toEqual(
                        new Project({
                            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                            name: 'testProject',
                            description: 'testDescription',
                            spatialReference: WGS_84.spatialReference,
                            time: new Time(moment.utc('2021-07-04 11:00:00')),
                            bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                            plots: [],
                            layers: [],
                            timeStepDuration: {
                                durationAmount: 1,
                                durationUnit: 'month',
                            },
                            version: {
                                changed: project.version.changed,
                                id: '0',
                            },
                        }).toDict(),
                    ),
                (error) => fail(error),
                () => {},
            );
    });

    it('#cloneProject should clone a project', async () => {
        //erstelle Projekt Instanz
        projectService.createDefaultProject().subscribe((project) => {
            projectService.setProject(project);
        });

        //kopiere das aktuelle Projekt und teste
        projectService.cloneProject('newTestName').subscribe(
            (project) => {
                expect(project.toDict()).toEqual(
                    new Project({
                        id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                        name: 'newTestName',
                        description: 'Default project',
                        spatialReference: WGS_84.spatialReference,
                        time: new Time(moment.utc('2014-04-01 12:00:00')),
                        bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                        plots: [],
                        layers: [],
                        timeStepDuration: {
                            durationAmount: 1,
                            durationUnit: 'month',
                        },
                        version: {
                            changed: project.version.changed,
                            id: '0',
                        },
                    }).toDict(),
                );
            },
            (error) => fail(error),
            () => {},
        );
    });

    it('#getProjectStream should return project stream', async () => {
        projectService
            .createDefaultProject()
            .pipe(
                tap((project) => projectService.setProject(project)),
                mergeMap(() => projectService.getProjectStream().pipe(first())),
                tap((project) => {
                    expect(project.toDict()).toEqual(
                        new Project({
                            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                            name: 'Default',
                            description: 'Default project',
                            spatialReference: WGS_84.spatialReference,
                            time: new Time(moment.utc('2014-04-01 12:00:00')),
                            bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                            plots: [],
                            layers: [],
                            timeStepDuration: {
                                durationAmount: 1,
                                durationUnit: 'month',
                            },
                            version: {
                                changed: project.version.changed,
                                id: '0',
                            },
                        }).toDict(),
                    );
                }),
                mergeMap(() =>
                    projectService.createProject({
                        name: 'testProject',
                        description: 'testDescription',
                        spatialReference: WGS_84.spatialReference,
                        time: new Time(moment.utc('2021-07-04 11:00:00')),
                        bounds: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                        timeStepDuration: {
                            durationAmount: 1,
                            durationUnit: 'month',
                        },
                    }),
                ),
                tap((project) => projectService.setProject(project)),
                mergeMap(() => projectService.getProjectOnce()),
            )
            .subscribe({
                next: (project) => {
                    expect(project.toDict()).toEqual(
                        new Project({
                            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                            name: 'testProject',
                            description: 'testDescription',
                            spatialReference: WGS_84.spatialReference,
                            time: new Time(moment.utc('2021-07-04 11:00:00')),
                            bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                            plots: [],
                            layers: [],
                            timeStepDuration: {
                                durationAmount: 1,
                                durationUnit: 'month',
                            },
                            version: {
                                changed: project.version.changed,
                                id: '0',
                            },
                        }).toDict(),
                    );
                },
                error: (error) => fail(error),
                complete: () => {},
            });
    });

    it('#getProjectOnce should return current project and #setProject should set a project', async () => {
        projectService
            .createDefaultProject()
            .pipe(
                tap((project) => projectService.setProject(project)),
                mergeMap(() => projectService.getProjectOnce()),
                tap((project) => {
                    expect(project.toDict()).toEqual(
                        new Project({
                            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                            name: 'Default',
                            description: 'Default project',
                            spatialReference: WGS_84.spatialReference,
                            time: new Time(moment.utc('2014-04-01 12:00:00')),
                            bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                            plots: [],
                            layers: [],
                            timeStepDuration: {
                                durationAmount: 1,
                                durationUnit: 'month',
                            },
                            version: {
                                changed: project.version.changed,
                                id: '0',
                            },
                        }).toDict(),
                    );
                }),
                mergeMap(() =>
                    projectService.createProject({
                        name: 'testProject',
                        description: 'testDescription',
                        spatialReference: WGS_84.spatialReference,
                        time: new Time(moment.utc('2021-07-04 11:00:00')),
                        bounds: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                        timeStepDuration: {
                            durationAmount: 1,
                            durationUnit: 'month',
                        },
                    }),
                ),
                tap((project) => projectService.setProject(project)),
                mergeMap(() => projectService.getProjectOnce()),
            )
            .subscribe({
                next: (project) => {
                    expect(project.toDict()).toEqual(
                        new Project({
                            id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                            name: 'testProject',
                            description: 'testDescription',
                            spatialReference: WGS_84.spatialReference,
                            time: new Time(moment.utc('2021-07-04 11:00:00')),
                            bbox: {lowerLeftCoordinate: {x: -180, y: -90}, upperRightCoordinate: {x: 180, y: 90}},
                            plots: [],
                            layers: [],
                            timeStepDuration: {
                                durationAmount: 1,
                                durationUnit: 'month',
                            },
                            version: {
                                changed: project.version.changed,
                                id: '0',
                            },
                        }).toDict(),
                    );
                },
                error: (error) => fail(error),
                complete: () => {},
            });
    });
});
