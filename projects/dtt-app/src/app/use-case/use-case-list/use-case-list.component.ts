import {Component, OnInit, ChangeDetectionStrategy, HostBinding, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

import {Observable} from 'rxjs';

import {LayoutService} from 'wave-core';

import {UseCaseService} from '../use-case.service';
import {UseCase} from '../use-case.model';
import {UseCaseDetailsComponent} from '../use-case-details/use-case-details.component';
import {UseCaseResetDialogComponent} from '../use-case-reset-dialog/use-case-reset-dialog.component';


@Component({
    selector: 'wave-dtt-use-case-list',
    templateUrl: './use-case-list.component.html',
    styleUrls: ['./use-case-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCaseListComponent implements OnInit {

    @HostBinding('class') class = 'mat-typography';

    @Input() resetUseCase = false;

    readonly useCases: Observable<Array<UseCase>> = this.useCaseService.useCaseList;

    constructor(private readonly useCaseService: UseCaseService,
                private readonly layoutService: LayoutService,
                private readonly dialog: MatDialog) {
    }

    ngOnInit() {
        if (this.resetUseCase) {
            this.dialog.open(
                UseCaseResetDialogComponent
            ).afterClosed().subscribe(reset => {
                if (reset) {
                    this.useCaseService.setUseCase(undefined);
                } else {
                    this.redirectIfActiveUseCase();
                }
            });
        } else {
            this.redirectIfActiveUseCase();
        }
    }

    private redirectIfActiveUseCase() {
        if (this.useCaseService.activeUseCase) {
            this.loadDetailsComponent();
        }
    }

    private loadDetailsComponent() {
        this.layoutService.setSidenavContentComponent({
            component: UseCaseDetailsComponent,
            parent: {
                component: UseCaseListComponent,
                config: {
                    resetUseCase: true,
                },
            }
        });
    }

    workOn(useCase: UseCase) {
        this.useCaseService.setUseCase(useCase).subscribe(() => this.loadDetailsComponent());
    }
}
