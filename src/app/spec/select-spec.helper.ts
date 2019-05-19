import {ComponentFixture, inject} from '@angular/core/testing';
import {OverlayContainer} from '@angular/cdk/overlay';
import {By} from '@angular/platform-browser';
import {ChangeDetectorRef} from '@angular/core';
import {MatSelect} from '@angular/material';

export class SelectSpecHelper {

    private oc: OverlayContainer;
    private oce: HTMLElement;
    private select: MatSelect;

    public constructor(private _fixture: ComponentFixture<any>, private _cdr: ChangeDetectorRef, private _id: string) {
        inject([OverlayContainer], (oc: OverlayContainer) => {
            this.oc = oc;
            this.oce = oc.getContainerElement();
        })();
        this.select = _fixture.debugElement.query(By.css('#' + _id)).componentInstance as MatSelect;
    }

    public open() {
        this._cdr.detectChanges();
        this.select.open();
        this.select.ngDoCheck();
        this._cdr.detectChanges();
        console.log(this.select.panelOpen);
    }

    public getOptions(): HTMLElement[] {
        return Array.from(this.oce.querySelectorAll('mat-option'));
    }

    public destroy() {
        this.oc.ngOnDestroy();
    }
}
