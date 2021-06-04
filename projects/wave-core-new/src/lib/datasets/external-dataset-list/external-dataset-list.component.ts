import {Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {UUID} from '../../backend/backend.model';
import {Dataset} from '../dataset.model';
import {DatasetService} from '../dataset.service';

@Component({
    selector: 'wave-external-dataset-list',
    templateUrl: './external-dataset-list.component.html',
    styleUrls: ['./external-dataset-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalDatasetListComponent implements OnInit, OnDestroy {
    @Input() providerId!: UUID;

    datasets$ = new Subject<Array<Dataset>>();

    subscription?: Subscription;

    constructor(public datasetService: DatasetService) {}

    ngOnInit(): void {
        this.subscription = this.datasetService.getExternalDatasets(this.providerId).subscribe((dataSets) => this.datasets$.next(dataSets));
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
