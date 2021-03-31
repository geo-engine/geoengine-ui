import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DataSet} from '../dataset.model';
import {ProjectService} from '../../project/project.service';

@Component({
    selector: 'wave-dataset',
    templateUrl: './dataset.component.html',
    styleUrls: ['./dataset.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSetComponent implements OnInit {
    @Input() dataset: DataSet;

    constructor(private projectService: ProjectService) {}

    ngOnInit(): void {}

    add(): void {
        this.projectService.addDataSetToMap(this.dataset).subscribe();
    }
}
