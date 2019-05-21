import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ChangeDetectorRef, DebugElement, SchemaMetadata, Type} from '@angular/core';
import {SelectSpecHelper} from './select-spec.helper';

class ComponentFixtureSpecHelper<T> {

    component: T;
    fixture: ComponentFixture<T>;
    cd: ChangeDetectorRef;
    el: any;
    de: DebugElement;

    constructor(_app_module: {
        providers?: any[];
        declarations?: any[];
        imports?: any[];
        schemas?: Array<SchemaMetadata | any[]>;
        aotSummaries?: () => any[];
    }, type: Type<T>) {
        TestBed.configureTestingModule(_app_module).compileComponents();
        this.fixture = TestBed.createComponent(type);
        this.component = this.fixture.componentInstance;
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
}
