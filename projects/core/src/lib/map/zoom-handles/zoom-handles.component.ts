import {ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'geoengine-zoom-handles',
    templateUrl: './zoom-handles.component.html',
    styleUrls: ['./zoom-handles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconButton, MatTooltip, MatIcon],
})
export class ZoomHandlesComponent {
    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();
}
