import {Component, OnInit, ChangeDetectionStrategy, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Clipboard} from '@angular/cdk/clipboard';
import {Geometry} from 'ol/geom';
import OlFormatGeoJson from 'ol/format/GeoJSON';
import OlFormatWKT from 'ol/format/WKT';

/**
 * Opened as modal dialog to display a full set of coordinates and allow copying to clipboard
 */
@Component({
    selector: 'ge-full-display',
    templateUrl: './full-display.component.html',
    styleUrls: ['./full-display.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullDisplayComponent implements OnInit {
    xCoords: string[] = [];
    yCoords: string[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {xStrings: string[]; yStrings: string[]; geometry: Geometry},
        private clipboard: Clipboard,
    ) {}

    ngOnInit(): void {
        this.xCoords = this.data.xStrings;
        this.yCoords = this.data.yStrings;
    }

    copyAsGeoJson(): void {
        const geometryJson = JSON.stringify(new OlFormatGeoJson().writeGeometryObject(this.data.geometry), null, 2);
        this.stringToClipboard(geometryJson);
    }

    copyAsWkt(): void {
        const geometryWkT = new OlFormatWKT().writeGeometry(this.data.geometry);
        this.stringToClipboard(geometryWkT);
    }

    stringToClipboard(toCopy: string): void {
        const pending = this.clipboard.beginCopy(toCopy);
        let remainingAttempts = 3;
        function attempt(): void {
            const copied = pending.copy();
            if (!copied && --remainingAttempts) {
                setTimeout(attempt);
            } else {
                pending.destroy();
            }
        }
        attempt();
    }
}
