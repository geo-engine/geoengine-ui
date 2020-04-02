import {Injectable} from '@angular/core';

import {BehaviorSubject, combineLatest, Observable} from 'rxjs';

import moment from 'moment/src/moment';

import {MapService, Projections, ProjectService, TimeInterval, TimePoint, TimeStepDuration} from 'wave-core';

import {UseCase} from './use-case.model';
import {first} from 'rxjs/operators';

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

    constructor(private readonly projectService: ProjectService,
                private readonly mapService: MapService) {
        this.setDefaultTimeConfigFromProjectSettings();


        // TODO: remove after proper usage of service in components
        const test_fn_a = () => {
            this.setUseCase({
                timeLimits: new TimeInterval(moment.utc('2019-06-01'), moment.utc('2019-06-30')),
                timeStep: {
                    durationAmount: 3,
                    durationUnit: 'days',
                },
                boundingBox: Projections.WEB_MERCATOR.getExtent(),
            });
        };
        const test_fn_b = () => {
            this.setUseCase({
                timeLimits: new TimeInterval(moment.utc('2020-01-01'), moment.utc('2020-12-31')),
                timeStep: {
                    durationAmount: 1,
                    durationUnit: 'month',
                },
                boundingBox: [
                    696142.044447, 6105335.329312,
                    1576696.610292, 7157108.838516,
                ],
            });
        };

        console.log('use these test functions', test_fn_a, test_fn_b);
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
    setUseCase(useCase: UseCase) {
        this.timeConfig.next({
            limits: useCase.timeLimits,
            step: useCase.timeStep,
        });

        this.mapService.zoomTo(useCase.boundingBox);
    }
}
