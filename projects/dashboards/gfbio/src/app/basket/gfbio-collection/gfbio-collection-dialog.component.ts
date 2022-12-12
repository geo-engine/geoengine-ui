import {Component, Inject} from '@angular/core';
import {BasketResult} from '../basket-model';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {LayerCollectionDict, LayerCollectionService, ProjectService} from '@geoengine/core';
import {map, mergeMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

@Component({
    selector: 'geoengine-gfbio-basket-dialog',
    templateUrl: './gfbio-collection-dialog.component.html',
    styleUrls: ['./gfbio-collection-dialog.component.scss'],
})
export class GfBioCollectionDialogComponent {
    collection: LayerCollectionDict;
    hasLayers$: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private readonly layerService: LayerCollectionService,
        private dialogRef: MatDialogRef<GfBioCollectionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {result: LayerCollectionDict},
    ) {
        this.collection = config.result;
        this.hasLayers$ = this.projectService.getLayerStream().pipe(map((layers) => layers.length > 0));
    }

    appendLayers(): void {
        this.layerService.addCollectionLayersToProject(this.collection);
        this.dialogRef.close();
    }

    replaceLayers(): void {
        this.projectService
            .clearLayers()
            .pipe(mergeMap(() => of(this.layerService.addCollectionLayersToProject(this.collection))))
            .subscribe();
        this.dialogRef.close();
    }
}
