import {Project} from './project.model';
import {ProjectService} from './project.service';
import moment from 'moment';
import {Session} from '../users/session.model';
import {User} from '../users/user.model';
import {NEVER, of} from 'rxjs';
import {CoreConfig, DEFAULT_CONFIG} from '../config.service';
import {CreateProjectResponseDict, STRectangleDict, TimeStepDict, UUID} from '../backend/backend.model';
import {NotificationService} from '../notification.service';
import {MapService} from '../map/map.service';
import {BackendService} from '../backend/backend.service';
import {UserService} from '../users/user.service';
import {SpatialReferenceService, WGS_84} from '../spatial-references/spatial-reference.service';
import {first, mergeMap, tap} from 'rxjs/operators';
import {Configuration, DefaultConfig} from '@geoengine/openapi-client';
import {SpatialReferenceSpecification, Time} from '@geoengine/common';

describe('test project methods in projectService', () => {
    let notificationServiceSpy: {get: jasmine.Spy};
    let mapServiceSpy: {get: jasmine.Spy};
    let backendSpy: {createProject: jasmine.Spy; listProjects: jasmine.Spy; updateProject: jasmine.Spy};
    let userServiceSpy: {getSessionStream: jasmine.Spy; getSessionTokenForRequest: jasmine.Spy};
    let spatialReferenceSpy: {getSpatialReferenceSpecification: jasmine.Spy};

    let projectService: ProjectService;

    beforeEach(() => {
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['error']);
        mapServiceSpy = jasmine.createSpyObj('MapService', ['getViewportSizeStream']);
        backendSpy = jasmine.createSpyObj('BackendService', ['createProject', 'listProjects', 'setSessionProject', 'updateProject']);
        userServiceSpy = jasmine.createSpyObj('UserService', ['getSessionStream', 'getSessionTokenForRequest']);
        spatialReferenceSpy = jasmine.createSpyObj('SpatialRefernceService', ['getSpatialReferenceSpecification']);

        const sessionToken = 'ffffffff-ffff-4fff-afff-ffffffffffff';

        // always return the same session
        userServiceSpy.getSessionStream.and.returnValue(
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

        userServiceSpy.getSessionTokenForRequest.and.returnValue(of<UUID>('ffffffff-ffff-4fff-afff-ffffffffffff'));

        spatialReferenceSpy.getSpatialReferenceSpecification.and.returnValue(
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
        backendSpy.listProjects.and.returnValue(NEVER); // never complete and set any project

        backendSpy.createProject.and.returnValue(
            of<CreateProjectResponseDict>({
                id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            }),
        );

        backendSpy.updateProject.and.returnValue(
            of<CreateProjectResponseDict>({
                id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            }),
        );

        projectService = new ProjectService(
            DEFAULT_CONFIG as CoreConfig,
            notificationServiceSpy as unknown as NotificationService,
            mapServiceSpy as unknown as MapService,
            backendSpy as unknown as BackendService,
            userServiceSpy as unknown as UserService,
            spatialReferenceSpy as unknown as SpatialReferenceService,
        );
    });

    it('#createDefaultProject should create a default project', (done) => {
        projectService.createDefaultProject().subscribe(
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
                expect(backendSpy.createProject).toHaveBeenCalledOnceWith(
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

                done();
            },
        );
    });

    it('#createProject should create a project', (done) => {
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
                () => {
                    done();
                },
            );
    });

    it('#cloneProject should clone a project', (done) => {
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
            () => {
                done();
            },
        );
    });

    it('#getProjectStream should return project stream', (done) => {
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
                complete: () => {
                    done();
                },
            });
    });

    it('#getProjectOnce should return current project and #setProject should set a project', (done) => {
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
                complete: () => {
                    done();
                },
            });
    });
});
