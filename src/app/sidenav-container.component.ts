import {Component, ComponentFactory, ComponentRef, ComponentFactoryResolver, Input, Type,
     ViewContainerRef, ViewChild, OnChanges, AfterViewInit, SimpleChange,
 } from '@angular/core';
import {RasterRepositoryComponent} from "../components/raster-repository.component";

@Component({
    selector: 'wave-sidenav-container',
    template: '<div #target></div>',
})
export class SidenavContainerComponent<C> implements OnChanges, AfterViewInit {
    @ViewChild('target', {read: ViewContainerRef})
    target: ViewContainerRef;

    @Input() type: Type<C>;
    componentRef: ComponentRef<C>;

    private isViewInitialized: boolean = false;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) {

    }

    updateComponent() {
        if ( !this.isViewInitialized ) {
            throw 'View is not initialized!';
        }
        if ( this.componentRef ) {
            this.target.clear();
            this.componentRef.destroy();
        }
        let component_factory = this.componentFactoryResolver.resolveComponentFactory(this.type);
        this.componentRef = this.target.createComponent(component_factory);
    }

    public load(type: Type<C>) {
      console.log("resolveComponentFactory", this, type);
        if ( this.type !== type) {
            this.type = type;
            this.updateComponent();
        }
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        // this.updateComponent();
    }

    ngAfterViewInit() {
        this.isViewInitialized = true;
        // this.updateComponent();
    }

}
