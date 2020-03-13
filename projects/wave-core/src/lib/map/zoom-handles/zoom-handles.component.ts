import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
    selector: 'wave-zoom-handles',
    templateUrl: './zoom-handles.component.html',
    styleUrls: ['./zoom-handles.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomHandlesComponent implements OnInit {

    @Output() zoomIn = new EventEmitter<void>();

    @Output() zoomOut = new EventEmitter<void>();

    constructor() {
    }

    ngOnInit() {
    }

}
