import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {DataPath, GdalMultiBand} from '@geoengine/openapi-client';
import {GdalMultiBandComponent} from '../gdal-multiband/gdal-multiband.component';
import {GdalMultiBandTilesComponent} from '../gdal-multiband-tiles/gdal-multiband-tiles.component';
import {MatDivider} from '@angular/material/list';

@Component({
    selector: 'geoengine-manager-gdal-multiband-editor',
    templateUrl: './gdal-multiband-editor.component.html',
    styleUrl: './gdal-multiband-editor.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GdalMultiBandComponent, GdalMultiBandTilesComponent, MatDivider],
})
export class GdalMultiBandEditorComponent {
    readonly dataPath = input<DataPath>();
    readonly metaData = input.required<GdalMultiBand>();
    readonly datasetName = input.required<string>();
}
