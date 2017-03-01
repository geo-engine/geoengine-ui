import {
    Component, OnInit, ChangeDetectionStrategy, ViewChild, ViewContainerRef, Type,
    ComponentRef, ComponentFactoryResolver, OnDestroy
} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';
import {LayoutService} from '../../layout.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-sidenav-container',
    templateUrl: './sidenav-container.component.html',
    styleUrls: ['./sidenav-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavContainerComponent implements OnInit, OnDestroy {

    @ViewChild('target', {read: ViewContainerRef})
    target: ViewContainerRef;

    componentRef: ComponentRef<Component>;

    private subscriptions: Array<Subscription> = [];

    constructor(private componentFactoryResolver: ComponentFactoryResolver,
                public sidenavRef: SidenavRef,
                public layoutService: LayoutService) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.sidenavRef.getCloseStream().subscribe(() => this.close())
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    load(type: Type<Component>) {
        this.sidenavRef.setTitle(undefined);
        this.sidenavRef.setBackButtonComponent(undefined);

        if (this.componentRef) {
            this.target.clear();
            this.componentRef.destroy();
        }
        if (this.target && type) {
            let componentFactory = this.componentFactoryResolver.resolveComponentFactory(type);
            this.componentRef = this.target.createComponent(componentFactory);
        }
    }

    close() {
        this.layoutService.setSidenavContentComponent(undefined);
    }

    back() {
        this.layoutService.setSidenavContentComponent(this.sidenavRef.getBackButtonComponent());
    }

}
