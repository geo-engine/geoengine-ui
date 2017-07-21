import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {ProjectService} from '../project/project.service';
import {LayoutService} from '../layout.service';
import {TimeConfigComponent} from '../time-config/time-config.component';
import {Time} from '../time/time.model';

@Component({
    selector: 'wave-small-time-interaction',
    templateUrl: './small-time-interaction.component.html',
    styleUrls: ['./small-time-interaction.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmallTimeInteractionComponent implements OnInit {

    private timeRepresentation: string;
    // private timeIsPlaying = false;

    static formatTime(time: Time): string {
        let s = time.getStart().format('DD.MM.YYYY HH:mm:ss');
        if (!time.getStart().isSame(time.getEnd())) {
            s += ' - ' + time.getEnd().format('DD.MM.YYYY HH:mm:ss');
        }
        return s;
    }

    constructor(private projectService: ProjectService,
                private layoutService: LayoutService,
                private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.projectService.getTimeStream().subscribe(t => {
            this.timeRepresentation = SmallTimeInteractionComponent.formatTime(t);
            this.changeDetectorRef.markForCheck();
        });
    }

    timeFwd() {
        this.projectService.getTimeStream().first().subscribe(time => {
            let nt = time.clone().add(1, 'month');
            this.projectService.setTime(nt);
        });
    }

    timeRwd() {
        this.projectService.getTimeStream().first().subscribe(time => {
            this.projectService.setTime(time.clone().subtract(1, 'month'));
        });
    }

    /*
     timePlay() {
     this.timeIsPlaying = true;
     }

     timeStop() {
     this.timeIsPlaying = false;
     }
     **/

    openTimeConfig() {
        this.layoutService.setSidenavContentComponent({component: TimeConfigComponent});
    }
}
