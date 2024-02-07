import {AfterViewInit, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Subject} from 'rxjs';
import {DatasetsService} from '../datasets.service';

@Component({
    selector: 'geoengine-manager-loading-info',
    templateUrl: './loading-info.component.html',
    styleUrl: './loading-info.component.scss',
})
export class LoadingInfoComponent implements AfterViewInit, OnChanges {
    @Input() datasetName?: string;

    loadingInfo$ = new Subject<string>();

    constructor(private datasetsService: DatasetsService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.datasetName) {
            this.datasetName = changes.datasetName.currentValue;
            this.setUpLoadingInfo();
        }
    }

    ngAfterViewInit(): void {
        this.setUpLoadingInfo();
    }

    setUpLoadingInfo(): void {
        if (!this.datasetName) {
            return;
        }

        this.datasetsService.getLoadingInfo(this.datasetName).then((info) => {
            this.loadingInfo$.next(JSON.stringify(info, null, 2));
        });
    }
}
