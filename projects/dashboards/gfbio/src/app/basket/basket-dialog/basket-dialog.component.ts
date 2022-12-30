import {Component, Inject} from '@angular/core';
import {BasketResult} from '../basket-model';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ProjectService} from '@geoengine/core';
import {map, mergeMap} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
    selector: 'geoengine-gfbio-basket-dialog',
    templateUrl: './basket-dialog.component.html',
    styleUrls: ['./basket-dialog.component.scss'],
})
export class BasketDialogComponent {
    result: BasketResult;
    hasLayers$: Observable<boolean>;

    constructor(
        private readonly projectService: ProjectService,
        private dialogRef: MatDialogRef<BasketDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private config: {result: BasketResult},
    ) {
        this.result = config.result;
        this.hasLayers$ = this.projectService.getLayerStream().pipe(map((layers) => layers.length > 0));
    }

    appendLayers(): void {
        this.projectService.addLayers(this.result.layers).subscribe();
        this.dialogRef.close();
    }

    replaceLayers(): void {
        this.projectService
            .clearLayers()
            .pipe(mergeMap(() => this.projectService.addLayers(this.result.layers)))
            .subscribe();
        this.dialogRef.close();
    }
}
