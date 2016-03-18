import {View, Component, Input, AfterViewInit, NgZone,
        Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef} from "angular2/core";
import {MATERIAL_DIRECTIVES} from "ng2-material/all";
@Component({
    selector: "tab-component",
    templateUrl: "templates/tab.html",
    styles: [`
    .selected {
      background-color: #f5f5f5 !important;
    }
    fieldset {
        border-style: solid;
        border-width: 1px;
        padding: 0px;
    }
    fieldset .material-icons {
        vertical-align: middle;
    }
    fieldset [md-fab] .material-icons {
        vertical-align: baseline;
    }
    button {
        height: 36px;
    }
    button[disabled] {
        background-color: transparent;
    }
    `],
    directives: [MATERIAL_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TabComponent implements AfterViewInit {
    @Input()
    private layerSelected: boolean;

    @Output("zoomIn")
    private zoomInEmitter = new EventEmitter<void>();

    @Output("zoomOut")
    private zoomOutEmitter = new EventEmitter<void>();

    @Output("zoomLayer")
    private zoomLayerEmitter = new EventEmitter<void>();

    @Output("zoomProject")
    private zoomProjectEmitter = new EventEmitter<void>();

    @Output("zoomMap")
    private zoomMapEmitter = new EventEmitter<void>();

    @Output("addData")
    private addDataEmitter = new EventEmitter<void>();

    @Output("removeLayer")
    private removeLayerEmitter = new EventEmitter<void>();

    constructor(private changeDetectorRef: ChangeDetectorRef,
                private ngZone: NgZone) {}

    ngAfterViewInit() {
        // do this one time for ngMaterial
        setTimeout(() => {
            this.changeDetectorRef.markForCheck();
        }, 0);
    }
}
