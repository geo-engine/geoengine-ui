import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ProjectService} from '../project.service';
import {Projections, Projection} from '../../operators/projection.model';
import {Observable} from 'rxjs';

@Component({
    selector: 'wave-change-projection',
    templateUrl: './change-projection.component.html',
    styleUrls: ['./change-projection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeProjectionComponent implements OnInit {

    // make available
    Projections = Projections;
    //

    projection$: Observable<Projection>;

    constructor(public projectService: ProjectService) {
    }

    ngOnInit() {
        this.projection$ = this.projectService.getProjectionStream();
    }

}
