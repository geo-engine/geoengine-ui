import {Component, ComponentFactory, ComponentRef, ComponentResolver, Input, Type,
     ViewContainerRef, ViewChild, OnChanges, AfterViewInit, SimpleChange,
 } from '@angular/core';

@Component({
    selector: 'wave-sidenav-container',
    template: '<div #target></div>',
})
export class SidenavContainerComponent<C> implements OnChanges, AfterViewInit {
    @ViewChild('target', {read: ViewContainerRef}) target: ViewContainerRef;
    @Input() type: Type;
    componentRef: ComponentRef<C>;

    private isViewInitialized: boolean = false;

    constructor(
        private componentResolver: ComponentResolver
    ) {}

    updateComponent() {
        if ( !this.isViewInitialized ) {
            throw 'View is not initialized!';
        }
        if ( this.componentRef ) {
            this.componentRef.destroy();
        }
        this.componentResolver.resolveComponent(this.type).then((factory: ComponentFactory<C>) => {
            this.componentRef = this.target.createComponent(factory);
            // to access the created instance use
            // this.compRef.instance.someProperty = 'someValue';
            // this.compRef.instance.someOutput.subscribe(val => doSomething());
        });
    }

    public load(type: Type) {
        if ( this.type !== type) {
            this.type = type;
            this.updateComponent();
        };
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {
        // this.updateComponent();
    }

    ngAfterViewInit() {
        this.isViewInitialized = true;
        // this.updateComponent();
    }

}
