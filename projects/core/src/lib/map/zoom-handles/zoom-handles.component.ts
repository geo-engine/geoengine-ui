import {ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';

@Component({
    selector: 'geoengine-zoom-handles',
    templateUrl: './zoom-handles.component.html',
    styleUrls: ['./zoom-handles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomHandlesComponent {
    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();
}
