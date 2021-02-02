import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ProjectService} from '../project.service';
import {Observable} from 'rxjs';
import {SpatialReference, SpatialReferences} from '../../operators/spatial-reference.model';

@Component({
    selector: 'wave-change-projection',
    templateUrl: './change-spatial-reference.component.html',
    styleUrls: ['./change-spatial-reference.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeSpatialReferenceComponent implements OnInit {

    readonly SpatialReferences = SpatialReferences;

    spatialReference$: Observable<SpatialReference>;

    constructor(public projectService: ProjectService) {
    }

    ngOnInit() {
        this.spatialReference$ = this.projectService.getSpatialReferenceStream();
    }

}
