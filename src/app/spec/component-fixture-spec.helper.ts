import {ComponentFixture, TestBed} from '@angular/core/testing';
import {
    ChangeDetectorRef, DebugElement, SchemaMetadata, Type, Component, ViewChild,
    ViewContainerRef, ComponentFactoryResolver, Optional, NgModule
} from '@angular/core';
import {SelectSpecHelper} from './select-spec.helper';
import {Predicate} from '@angular/core/src/debug/debug_node';
import {By} from '@angular/platform-browser';
import {TestIdComponentDirective} from './test-id-component.directive';

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

/**
 * A Component Fixture for testing components.
 * When initializing an instance of this we expect you to be inside an beforeEach cycle.
 * @param: _app_module: dictionary specifying an app module, i.e. the environment to emulate for our component
 * to run properly.
 * @param: type: type instance of T.
 * @param: inputs: (optional) the inputs to give to the tested component in form of a dictionary, i.e.
 * the key words are the names of the input, their values are the values passed to the component instance.
 * @generic: T is the type of the component to test.
 *
 * usage:
 * Initialization happens in beforeEach. A host component gets created and a fixture of this is internally saved.
 * Make sure that all necessary components for the tested component to run are passed by _app_module. (check your
 * dependencies)
 * getComponentInstance() gives you the instance of your testing component saved by our fixture. When making changes
 * be sure to call the detectChanges() function before making further changes that rely on your DOM to be up-to-date
 * or expecting results be processed already.
 *
 * example:
 * Lets say we have a component "Component" with Input "input" and want to associate the variable "value" to this input.
 * Further our component needs the provider "Service" which we wish to mock with a class "MockService" and the module
 * "Module" and has a child-component of type "Child".
 * The instantiation of this helper class would look something like this then:
 *
 * fixture = new ComponentFixtureSpecHelper({
 *      declarations: [ Component, Child ],
 *      providers: [ Service ],
 *      imports: [ Module ],
 *      providers: [ {provide: Service, useClass: MockService} ]
 *      }, Component, {input: value})
 *
 *  to test a function on the emulated component now, lets say it is called "doSomething()" and changes the DOM we
 *  first need to call the function
 *
 *  fixture.getComponentInstance().doSomething();
 *
 *  then call changeDetection to get the DOM changes
 *
 *  fixture.detectChanges();
 *
 *  and now we can test if the function did what it was designed for with the common jasmine expect functionalities.
 */
export class ComponentFixtureSpecHelper<T> {

    component: T;
    fixture: ComponentFixture<TestHostComponent>;
    changeDetectorRef: ChangeDetectorRef;
    nativeElement: any;
    debugElement: DebugElement;

    constructor(_app_module: {
        providers?: any[];
        declarations?: any[];
        imports?: any[];
        schemas?: Array<SchemaMetadata | any[]>;
        aotSummaries?: () => any[];
    }, type: Type<T>, @Optional() inputs?: {[key: string]: any }) {

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
        this.fixture.detectChanges();
        this.debugElement = this.fixture.debugElement;
        this.nativeElement = this.debugElement.nativeElement;
        this.changeDetectorRef = this.fixture.componentRef.injector.get(ChangeDetectorRef);
    }

    public getInjected<S>(type: Type<S>): S {
        return this.fixture.componentRef.injector.get(type);
    }

    public detectChanges(): void {
        this.changeDetectorRef.detectChanges();
    }

    /**Creates a new select spec helper. Make sure that the
     * given select with the given id is visible in DOM.
     * When calling open() on the result object be sure that
     * the select is enabled.
     *
     * @param {string} id: id of the given select.
     * @returns {SelectSpecHelper}: A select helper instance for this select.
     */
    public getSelectHelper(select: DebugElement): SelectSpecHelper {
        return new SelectSpecHelper(this.debugElement, this.changeDetectorRef, select);
    }

    public getComponentInstance(): T {
        return this.component;
    }

    public getDebugElement(): DebugElement {
        return this.debugElement;
    }

    public getNativeElement(): any {
        return this.nativeElement;
    }

    public queryDOM(predicate: Predicate<DebugElement>): DebugElement {
        return this.debugElement.query(predicate);
    }

    public querySelector(selector: string): HTMLElement {
        return this.nativeElement.querySelector(selector);
    }

    public getElementsByTagName(tagName: string): NodeListOf<HTMLElement> {
        return this.nativeElement.getElementsByTagName(tagName);
    }

    public getElementByTestId(id: string): DebugElement {
        let nodes = this.debugElement.queryAll(By.directive(TestIdComponentDirective));
        nodes = nodes.filter(node =>
            node.nativeElement.getAttribute('ng-reflect-test_id') === id
        );
        if (nodes.length === 0) {
            return null;
        }
        return nodes[0];
    }

    public whenStable(): Promise<any> {
        return this.fixture.whenStable();
    }
}

