import {Component, OnInit, ChangeDetectionStrategy, HostBinding} from '@angular/core';
import {UseCaseService} from '../use-case.service';
import {UseCase} from '../use-case.model';

@Component({
    selector: 'wave-dtt-use-case-details',
    templateUrl: './use-case-details.component.html',
    styleUrls: ['./use-case-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCaseDetailsComponent implements OnInit {

    @HostBinding('class') class = 'mat-typography';

    readonly useCase: UseCase;

    constructor(private readonly useCaseService: UseCaseService) {
        this.useCase = useCaseService.activeUseCase;
    }

    ngOnInit(): void {
    }

}
