import {Project} from './project.model';
import {ProjectService} from './project.service';
import {SpatialReferences} from '../operators/spatial-reference.model';
import {Time} from '../time/time.model';
import moment from 'moment';
import {Session} from '../users/session.model';
import {User} from '../users/user.model';
import {NEVER, of} from 'rxjs';
import {Config, WAVE_DEFAULT_CONFIG} from '../config.service';
import {CreateProjectResponseDict, STRectangleDict, TimeStepDict, UUID} from '../backend/backend.model';
import {waitForAsync} from '@angular/core/testing';
import {NotificationService} from '../notification.service';
import {MapService} from '../map/map.service';
import {BackendService} from '../backend/backend.service';
import {UserService} from '../users/user.service';

let notificationServiceSpy: {get: jasmine.Spy};
let mapServiceSpy: {get: jasmine.Spy};
let backendSpy: {createProject: jasmine.Spy; listProjects: jasmine.Spy};
let userServiceSpy: {getSessionStream: jasmine.Spy; getSessionTokenForRequest: jasmine.Spy};

let projectService: ProjectService;

beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['error']);
    mapServiceSpy = jasmine.createSpyObj('MapService', ['getViewportSizeStream']);
    backendSpy = jasmine.createSpyObj('BackendService', ['createProject', 'listProjects']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getSessionStream', 'getSessionTokenForRequest']);

    // always return the same session
    userServiceSpy.getSessionStream.and.returnValue(
        of<Session>({
            sessionToken: 'ffffffff-ffff-4fff-afff-ffffffffffff',
            user: new User({
                id: 'cccccccc-cccc-4ccc-accc-cccccccccccc',
            }),
            validUntil: moment.utc('3000-01-01'),
        }),
    );
    userServiceSpy.getSessionTokenForRequest.and.returnValue(of<UUID>('ffffffff-ffff-4fff-afff-ffffffffffff'));

    // for constructor
    backendSpy.listProjects.and.returnValue(NEVER); // never complete and set any project

    projectService = new ProjectService(
        WAVE_DEFAULT_CONFIG as Config,
        (notificationServiceSpy as any) as NotificationService,
        (mapServiceSpy as any) as MapService,
        (backendSpy as any) as BackendService,
        (userServiceSpy as any) as UserService,
    );
});

it(
    'should create a default project',
    waitForAsync(() => {
        backendSpy.createProject.and.returnValue(
            of<CreateProjectResponseDict>({
                id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
            }),
        );

        projectService.createDefaultProject().subscribe(
            (project) =>
                expect(project.toDict()).toEqual(
                    new Project({
                        id: 'dddddddd-dddd-4ddd-addd-dddddddddddd',
                        name: 'Default',
                        description: 'Default project',
                        spatialReference: SpatialReferences.WGS_84,
                        time: new Time(moment.utc('2014-04-01 12:00:00')),
                        plots: [],
                        layers: [],
                        timeStepDuration: {
                            durationAmount: 1,
                            durationUnit: 'month',
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
                            granularity: 'Months',
                        } as TimeStepDict,
                    },
                    'ffffffff-ffff-4fff-afff-ffffffffffff',
                );
            },
        );
    }),
);
