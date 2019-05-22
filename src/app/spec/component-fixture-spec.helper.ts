import {ComponentFixture, TestBed} from '@angular/core/testing';
import {
    ChangeDetectorRef, DebugElement, SchemaMetadata, Type, Component, ViewChild,
    ViewContainerRef, ComponentFactoryResolver, Optional, NgModule
} from '@angular/core';
import {SelectSpecHelper} from './select-spec.helper';
import {Predicate} from '@angular/core/src/debug/debug_node';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';

@Component({
    selector: 'wave-test-host',
    template: `<ng-template #component></ng-template>`
})
class TestHostComponent {
    @ViewChild('component', {read: ViewContainerRef}) component: ViewContainerRef;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

    public load<T>(type: Type<T>, inputs: any): T {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(type);
        this.component.clear();
        const componentRef = this.component.createComponent(componentFactory);
        if (inputs) {
            for (const input in inputs) {
                if (inputs.hasOwnProperty(input)) {
                    componentRef.instance[input] = inputs[input];
                }
            }
        }
        return componentRef.instance;
    };
}

export class ComponentFixtureSpecHelper<T> {

    component: T;
    fixture: ComponentFixture<TestHostComponent>;
    cd: ChangeDetectorRef;
    el: any;
    de: DebugElement;

    constructor(_app_module: {
        providers?: any[];
        declarations?: any[];
        imports?: any[];
        schemas?: Array<SchemaMetadata | any[]>;
        aotSummaries?: () => any[];
    }, type: Type<T>, @Optional() inputs?: any) {

        @NgModule({
            entryComponents: [ type ]
        })
        class ENTRY_MODULE {};

        _app_module.declarations.push(TestHostComponent);
        _app_module.imports.push(
            ENTRY_MODULE
        );
        TestBed.configureTestingModule(_app_module)
            .overrideComponent(TestHostComponent, {
                add: {
                    providers: _app_module.providers
                }
            })
            .compileComponents();
        this.fixture = TestBed.createComponent(TestHostComponent);
        this.component = this.fixture.componentInstance.load(type, inputs);
        //this.component = this.fixture.componentInstance;
        this.fixture.detectChanges();
        this.de = this.fixture.debugElement;
        this.el = this.de.nativeElement;
        this.cd = this.fixture.componentRef.injector.get(ChangeDetectorRef);
    }

    public getInjected<S>(type: Type<S>): S {
        return this.fixture.componentRef.injector.get(type);
    }

    public detectChanges(): void {
        this.cd.detectChanges();
    }

    /**Creates a new select spec helper. Make sure that the
     * given select with the given id is visible in DOM.
     * When calling open() on the result object be sure that
     * the select is enabled.
     *
     * @param {string} id: id of the given select.
     * @returns {SelectSpecHelper}: A select helper instance for this select.
     */
    public getSelectHelper(id: string): SelectSpecHelper {
        return new SelectSpecHelper(this.de, this.cd, id);
    }

    public getComponentInstance(): T {
        return this.component;
    }

    public getDebugElement(): DebugElement {
        return this.de;
    }

    public getNativeElement(): any {
        return this.el;
    }

    public queryDOM(predicate: Predicate<DebugElement>): DebugElement {
        return this.de.query(predicate);
    }

    public getElementsByTagName(tagName: string): NodeListOf<HTMLElement> {
        return this.el.getElementsByTagName(tagName);
    }

    public whenStable(): Promise<any> {
        return this.fixture.whenStable();
    }
}

