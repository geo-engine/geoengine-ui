import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs';

import {MappingSource} from './mapping-source.model';
import {UserService} from '../../../users/user.service';

@Component({
    selector: 'wave-data-repository',
    templateUrl: './data-repository.component.html',
    styleUrls: ['./data-repository.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DataRepositoryComponent {

    searchTerm: String = '';
    sources: Observable<Array<MappingSource>>;

    constructor(
        private userService: UserService
    ) {
        this.sources = this.userService.getRasterSourcesStream();
    }

    reload() {
        this.userService.reloadRasterSources();
    }
}
