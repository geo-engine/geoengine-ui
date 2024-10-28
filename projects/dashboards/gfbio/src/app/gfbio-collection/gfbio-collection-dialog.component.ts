import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
    LayerCollectionDict,
    LayerCollectionItemDict,
    LayerCollectionLayerDict,
    LayerCollectionService,
    NotificationService,
    ProjectService,
} from '@geoengine/core';
import {map, mergeMap} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {SelectionModel} from '@angular/cdk/collections';

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

    readonly okLayersInCollection$ = new BehaviorSubject(false);
    readonly addingLayers$ = new BehaviorSubject(false);

    selection = new SelectionModel<LayerCollectionItemDict>(true);

    constructor(
        private readonly projectService: ProjectService,
        private readonly layerService: LayerCollectionService,
        private readonly dialogRef: MatDialogRef<GfBioCollectionDialogComponent>,
        private readonly notificationService: NotificationService,
        @Inject(MAT_DIALOG_DATA) private config: {result: LayerCollectionDict},
    ) {
        this.collection = config.result;
        this.projectHasLayers$ = this.projectService.getLayerStream().pipe(map((layers) => layers.length > 0));
        this.okLayersInCollection$.next(this.getFilteredLayers().length > 0);

        for (const layer of this.getErrorLayers()) {
            this.notificationService.error(
                `The layer "${layer.name}" is supported by VAT, but could not be loaded. Please contact us, so we can fix this.`,
            );
        }

        this.toggleAllRows();
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

        const filteredLayers = this.getFilteredLayers();

        this.layerService.addCollectionLayersToProject(filteredLayers).subscribe(() => this.dialogRef.close());
    }

    replaceLayers(): void {
        this.addingLayers$.next(true);

        const filteredLayers = this.getFilteredLayers();

        this.projectService
            .clearLayers()
            .pipe(mergeMap(() => this.layerService.addCollectionLayersToProject(filteredLayers)))
            .subscribe(() => this.dialogRef.close());
    }

    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.collection.items.length;
        return numSelected === numRows;
    }

    toggleSelection(item: LayerCollectionItemDict): void {
        this.selection.toggle(item);
        this.okLayersInCollection$.next(this.getFilteredLayers().length > 0);
    }

    toggleAllRows(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.collection.items.forEach((row) => {
                this.selection.select(row);
            });
        }

        this.okLayersInCollection$.next(this.getFilteredLayers().length > 0);
    }

    layerIsUnit(item: LayerCollectionItemDict): boolean {
        if (item.type === 'layer') {
            const layer = item as LayerCollectionLayerDict;
            const abcdIdPos = layer.id.layerId.indexOf('urn:gfbio.org');

            if (abcdIdPos >= 0) {
                // detect units based on the number of components (seperated by ":") in the id
                const abcdLayerId = layer.id.layerId.substring(abcdIdPos);
                const numberOfComponents = (abcdLayerId.match(/:/g) || []).length;

                if (numberOfComponents > 3) {
                    return true;
                }
            }
        }

        return false;
    }

    private getFilteredLayers(): LayerCollectionItemDict[] {
        return this.collection.items.filter((item) => this.layerStatus(item) === LayerStatus.Ok && this.selection.isSelected(item));
    }

    private getErrorLayers(): LayerCollectionItemDict[] {
        return this.collection.items.filter((item) => this.layerStatus(item) === LayerStatus.Error);
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
