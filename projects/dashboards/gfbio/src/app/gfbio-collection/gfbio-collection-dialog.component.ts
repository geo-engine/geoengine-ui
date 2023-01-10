import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {LayerCollectionDict, LayerCollectionItemDict, LayerCollectionService, ProjectService} from '@geoengine/core';
import {map, mergeMap} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';

enum LayerStatus {
    Ok = 'ok',
    Unavailable = 'unavailable',
    Error = 'error',
}

@Component({
    selector: 'geoengine-gfbio-basket-dialog',
    templateUrl: './gfbio-collection-dialog.component.html',
    styleUrls: ['./gfbio-collection-dialog.component.scss'],
})
export class GfBioCollectionDialogComponent {
    collection: LayerCollectionDict;
    projectHasLayers$: Observable<boolean>;

    readonly okLayersInCollection$ = new BehaviorSubject(0);
    readonly addingLayers$ = new BehaviorSubject(false);

    constructor(
        private readonly projectService: ProjectService,
        private readonly layerService: LayerCollectionService,
        private dialogRef: MatDialogRef<GfBioCollectionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {result: LayerCollectionDict},
    ) {
        this.collection = config.result;
        this.projectHasLayers$ = this.projectService.getLayerStream().pipe(map((layers) => layers.length > 0));
        this.okLayersInCollection$.next(this.getOkLayers().length);
    }

    layerStatus(item: LayerCollectionItemDict): LayerStatus {
        const status = item.properties.find(([a, _]) => a === 'status');

        if (status) {
            return this.statusFromString(status[1]);
        } else {
            return LayerStatus.Error;
        }
    }

    appendLayers(): void {
        this.addingLayers$.next(true);

        const filteredCollection = this.collection;
        this.collection.items = this.getOkLayers();

        this.layerService.addCollectionLayersToProject(filteredCollection).subscribe(() => this.dialogRef.close());
    }

    replaceLayers(): void {
        this.addingLayers$.next(true);

        const filteredCollection = this.collection;
        this.collection.items = this.getOkLayers();

        this.projectService
            .clearLayers()
            .pipe(mergeMap(() => this.layerService.addCollectionLayersToProject(filteredCollection)))
            .subscribe(() => this.dialogRef.close());
    }

    private getOkLayers(): LayerCollectionItemDict[] {
        return this.collection.items.filter((item) => this.layerStatus(item) === LayerStatus.Ok);
    }

    private statusFromString(status: string): LayerStatus {
        switch (status) {
            case 'ok':
                return LayerStatus.Ok;
            case 'unavailable':
                return LayerStatus.Unavailable;
            default:
                return LayerStatus.Error;
        }
    }
}
