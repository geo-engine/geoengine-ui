import {AfterViewInit, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DatasetsService} from '@geoengine/common';
import {MetaDataDefinition} from '@geoengine/openapi-client';

// TODO: replace this component with editors for the different metadata types
@Component({
    selector: 'geoengine-manager-loading-info',
    templateUrl: './loading-info.component.html',
    styleUrl: './loading-info.component.scss',
})
export class LoadingInfoComponent implements AfterViewInit, OnChanges {
    @Input() datasetName?: string;
    @Input() editable = false;

    loadingInfo = '';

    constructor(private datasetsService: DatasetsService) {}

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes.datasetName) {
            this.datasetName = changes.datasetName.currentValue;
            this.setUpLoadingInfo();
        }
    }

    ngAfterViewInit(): void {
        this.setUpLoadingInfo();
    }

    async setUpLoadingInfo(): Promise<void> {
        if (!this.datasetName) {
            return;
        }

        const loadingInfo = await this.datasetsService.getLoadingInfo(this.datasetName);

        this.loadingInfo = JSON.stringify(loadingInfo, null, 2);
    }

    getMetadataDefinition(): MetaDataDefinition | undefined {
        try {
            return JSON.parse(this.loadingInfo);
        } catch (e) {
            console.error('Could not parse metadata definition:', e);
            return undefined;
        }
    }
}
