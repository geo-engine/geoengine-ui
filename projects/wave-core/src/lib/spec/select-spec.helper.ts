import {inject} from '@angular/core/testing';
import {OverlayContainer} from '@angular/cdk/overlay';
import {By} from '@angular/platform-browser';
import {ChangeDetectorRef, DebugElement} from '@angular/core';

/**Spec Helper for Mat-Selects.
 * Please take care that the functions are called in the proper environments (beforeEach, it, fakeAsync,...)
 */
export class SelectSpecHelper {
    private overlayContainer: OverlayContainer;
    private overlayContainerElement: HTMLElement;
    private trigger: DebugElement;

    /**Construct the helper class. This uses the inject keyword meaning that you need to call it inside
     * a beforeEach
     *
     * @param {DebugElement} de: DebugElement of the ambient fixture, i.e. fixture.debugElement.
     * @param {ChangeDetectorRef} _cdr: changeDetector of the wrapped component
     *         (make sure this is the injected one and not the from fixture), i.e. fixture.componentRef.injector.get(ChangeDetectorRef)
     * @param {string} _id: ID of the select to test. Make sure it is shown in DOM and is not disabled. (Actually it suffices that it is
     *         shown in DOM. That it is not disabled is necessary when calling open().
     */
    public constructor(private de: DebugElement, private changeDetectorRef: ChangeDetectorRef, private select: DebugElement) {
        inject([OverlayContainer], (oc: OverlayContainer) => {
            this.overlayContainer = oc;
            this.overlayContainerElement = oc.getContainerElement();
        })();
        this.trigger = select.query(By.css('.mat-select-trigger'));
    }

    /**
     * Gets called in it-environment to open the select. Be sure it is shown in DOM and is enabled.
     */
    public open() {
        this.changeDetectorRef.detectChanges();
        this.trigger.nativeElement.click();
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Called in it-environment
     * @returns {HTMLElement[]} list of mat-options as HTMLElements.
     */
    public getOptions(): HTMLElement[] {
        return Array.from(this.overlayContainerElement.querySelectorAll('mat-option'));
    }

    /**
     * Gets called in afterEach-environment.
     */
    public destroy() {
        this.overlayContainer.ngOnDestroy();
    }
}
