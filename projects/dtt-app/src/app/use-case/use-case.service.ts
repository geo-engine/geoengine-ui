import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {first, flatMap, map, skipUntil, skipWhile} from 'rxjs/operators';

import moment from 'moment/src/moment';

import {transformExtent} from 'ol/proj';

import {
    Config, MappingSource,
    MapService,
    NotificationService, Projections,
    ProjectService,
    TimeInterval,
    TimePoint,
    TimeStepDuration,
    UserService
} from 'wave-core';

import {UseCase, UseCaseDict} from './use-case.model';
import {AppConfig} from '../app-config.service';

interface TimeConfig {
    limits: TimeInterval;
    step: TimeStepDuration;
}

@Injectable({
    providedIn: 'root'
})
export class UseCaseService {

    private readonly timeConfig = new BehaviorSubject<TimeConfig>({ // some defaults are required for having a behavior subject
        limits: new TimeInterval(moment(), moment()),
        step: {durationAmount: 1, durationUnit: 'day'},
    });

    private readonly _useCaseList = new ReplaySubject<Array<UseCase>>(1);
    private useCase: UseCase = undefined;

    constructor(private readonly projectService: ProjectService,
                private readonly mapService: MapService,
                private readonly userService: UserService,
                @Inject(Config) private readonly config: AppConfig,
                private readonly httpClient: HttpClient,
                private readonly notificationService: NotificationService,
    ) {
        this.setDefaultTimeConfigFromProjectSettings();
        this.loadUseCaseList();

        this.loadActiveUseCaseFromStorage();
    }

    private setDefaultTimeConfigFromProjectSettings() {
        combineLatest([
            this.projectService.getTimeStream(),
            this.projectService.getTimeStepDurationStream(),
        ]).pipe(
            first(), // ensures completing the subscription
        ).subscribe(([time, step]) => {
            let limits;
            if (time instanceof TimePoint) {
                limits = new TimeInterval(time.getStart(), time.getStart().clone().add(step.durationAmount, step.durationUnit));
            } else if (time instanceof TimeInterval) {
                limits = time;
            } else {
                throw Error('unknown time type');
            }
            this.timeConfig.next({
                limits,
                step,
            });
        });
    }

    private loadUseCaseList() {
        combineLatest([
            this.httpClient.get<Array<UseCaseDict>>(this.config.DTT.USE_CASE_FILE),
            this.userService.getRasterSourcesStream(), // there can be newer lists of sources, the first one is empty
        ]).subscribe(
            ([useCaseDicts, datasets]) => {
                // sort by name
                useCaseDicts.sort((a, b) => a.name.localeCompare(b.name));

                const useCases = useCaseDicts.map(useCaseDict => this.parseUseCaseDict(useCaseDict, datasets));

                this._useCaseList.next(useCases);
            },
            error => {
                this.notificationService.error(`Unable to load use cases »${error}«`);
            }
        );
    }

    private parseUseCaseDict(useCaseDict: UseCaseDict, availableDatasets: Array<MappingSource>): UseCase {
        const datasetNameSet = new Set(useCaseDict.datasets);
        const filteredDatasets = availableDatasets
            .filter(dataset => datasetNameSet.has(dataset.source))
            .sort((a, b) => a.name.localeCompare(b.name));

        return {
            name: useCaseDict.name,
            shortDescription: useCaseDict.shortDescription,
            description: useCaseDict.description,
            timeLimits: TimeInterval.fromDict(useCaseDict.timeLimits),
            timeStep: useCaseDict.timeStep,
            boundingBox: useCaseDict.boundingBox,
            datasets: filteredDatasets,
        };
    }

    get timeLimits(): TimeInterval {
        return this.timeConfig.getValue().limits;
    }

    get timeStep(): TimeStepDuration {
        return this.timeConfig.getValue().step;
    }

    get timeConfigStream(): Observable<TimeConfig> {
        return this.timeConfig;
    }

    /**
     * Defines the current selected use case
     */
    setUseCase(useCase: UseCase): Observable<void> {
        const result = new ReplaySubject<void>(1);

        this.useCase = useCase;

        if (useCase) {
            this.projectService.getProjectionStream().pipe(first()).subscribe(projection => {
                this.timeConfig.next({
                    limits: useCase.timeLimits,
                    step: useCase.timeStep,
                });

                const bboxInWgs84 = useCase.boundingBox;
                const bboxInCurrentProjection = transformExtent(
                    bboxInWgs84,
                    Projections.WGS_84.getOpenlayersProjection(),
                    projection.getOpenlayersProjection(),
                );
                this.mapService.zoomTo(bboxInCurrentProjection);

                result.next();
                result.complete();
            });
        } else {
            this.resetLayersAndPlots();
            result.next();
            result.complete();
        }

        this.saveActiveUseCaseInStorage(useCase);

        return result;
    }

    private resetLayersAndPlots() {
        this.projectService.clearLayers();
        this.projectService.clearPlots();
    }

    /**
     * Return the active use case.
     *  - can be `undefined`
     */
    get activeUseCase(): UseCase {
        return this.useCase;
    }

    /**
     * Retrieve a list of use cases.
     * This is initially read from a config file.
     */
    get useCaseList(): Observable<Array<UseCase>> {
        return this._useCaseList;
    }

    /**
     * Loads the active use case on startup.
     * TODO: extend `StorageService` as well as both `StorageProvider`s with method of saving and loading a use case
     */
    private loadActiveUseCaseFromStorage() {
        // taken from `projects/wave-core/src/lib/storage/providers/browser-storage-provider.model.ts`
        const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

        const activeUseCaseDict: UseCaseDict = JSON.parse(localStorage.getItem(PATH_PREFIX + 'usecase'));

        if (activeUseCaseDict) {
            this.userService.getRasterSourcesStream().pipe(
                skipWhile(datasets => datasets.length <= 0), // this is a hack since the first list is empty
                map(datasets => this.parseUseCaseDict(activeUseCaseDict, datasets)),
            ).subscribe(
                useCase => this.setUseCase(useCase),
            );
        }
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Stores the active use case.
     * TODO: extend `StorageService` as well as both `StorageProvider`s with method of saving and loading a use case
     */
    private saveActiveUseCaseInStorage(useCase: UseCase) {
        // taken from `projects/wave-core/src/lib/storage/providers/browser-storage-provider.model.ts`
        const PATH_PREFIX = window.location.pathname.replace(/\//g, '_').replace(/-/g, '_');

        if (useCase) {
            const useCaseDict: UseCaseDict = {
                name: useCase.name,
                shortDescription: useCase.shortDescription,
                description: useCase.description,
                boundingBox: useCase.boundingBox,
                timeLimits: useCase.timeLimits.asDict(),
                timeStep: useCase.timeStep,
                datasets: useCase.datasets.map(dataset => dataset.source),
            };

            localStorage.setItem(PATH_PREFIX + 'usecase', JSON.stringify(useCaseDict));
        } else {
            localStorage.removeItem(PATH_PREFIX + 'usecase');
        }
    }
}
