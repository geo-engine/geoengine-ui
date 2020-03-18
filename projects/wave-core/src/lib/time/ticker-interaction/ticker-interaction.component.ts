import {ChangeDetectionStrategy, OnInit, Component, OnDestroy} from '@angular/core';
import {first, map, mapTo, startWith, switchMap} from 'rxjs/operators';
import {BehaviorSubject, merge, Observable, of, Subscription, timer} from 'rxjs';
import {ProjectService} from '../../project/project.service';
import {TimeStepDuration} from '../time.model';
import {empty} from 'rxjs/internal/Observer';

@Component({
    selector: 'wave-ticker-interaction',
    templateUrl: './ticker-interaction.component.html',
    styleUrls: ['./ticker-interaction.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerInteractionComponent implements OnInit, OnDestroy {

    public run$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    protected timer$: Observable<number> = this.run$
        .pipe(
            startWith(false),
            switchMap(x => (x ? timer(0, (this.countdownSeconds * 1000)) : of(null)))
        );

    protected countup$: Observable<number> = merge(this.timer$.pipe(mapTo(true)), this.run$).pipe(
        switchMap(y => y ? timer(0, this.countdown_interval) : of(null))
    );

    protected countdown$: Observable<number> = this.countup$.pipe(
        map((x: number)  => (this.countdownSeconds - 1 - x))
    );

    public countdown_percent$: Observable<number> = this.countup$.pipe(
        map((x: number)  => ((this.countdownSeconds - (x * this.countdownSeconds  / (this.countdownSeconds - 1))) / this.countdownSeconds * 100 ))
    );

    countdownSeconds = 10;
    countdown_interval = 1000;

    timeStepDurationStreamSubscription: Subscription;
    timeStepDuration: TimeStepDuration = {durationAmount: 1, durationUnit: 'months'};

    constructor(private projectService: ProjectService) {
    }

    ngOnInit() {
        this.timeStepDurationStreamSubscription = this.projectService.getTimeStepDurationStream().subscribe(timeStepDuration => {
            this.timeStepDuration = timeStepDuration;
        });

        this.timer$.subscribe(x => {
            this.timeForward();
            console.log(x);
        })
    }

    ngOnDestroy(): void {
        this.timeStepDurationStreamSubscription.unsubscribe();
    }

    timeForward() {
        this.projectService.getTimeStream().pipe(first()).subscribe(time => {
            let nt = time.clone().add(this.timeStepDuration.durationAmount, this.timeStepDuration.durationUnit);
            this.projectService.setTime(nt);
        });
    }
}
