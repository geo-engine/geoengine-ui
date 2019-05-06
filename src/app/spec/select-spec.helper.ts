import {ComponentFixture, inject} from '@angular/core/testing';
import {OverlayContainer} from '@angular/cdk/overlay';
import {By} from '@angular/platform-browser';
import {ChangeDetectorRef} from '@angular/core';

export class SelectSpecHelper {

    private oc: OverlayContainer;
    private oce: HTMLElement;
    private trigger: HTMLElement;

    public constructor(private _fixture: ComponentFixture<any>, private _cdr: ChangeDetectorRef, private _id: string) {
        inject([OverlayContainer], (oc: OverlayContainer) => {
            this.oc = oc;
            this.oce = oc.getContainerElement();
        })();
        this.trigger = _fixture.debugElement.query(By.css('#' + _id)).query(By.css('.mat-select-trigger')).nativeElement;
        console.log(_fixture.debugElement.query(By.css('#' + _id)).nativeElement);
    }

    public open() {
        this._cdr.detectChanges();
        this.trigger.click();
        this._cdr.detectChanges();
    }

    public getOptions(): HTMLElement[] {
        return Array.from(this.oce.querySelectorAll('mat-option'));
    }

    public destroy() {
        this.oc.ngOnDestroy();
    }
}
