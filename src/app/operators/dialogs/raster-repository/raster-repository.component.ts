import {Component, ChangeDetectionStrategy} from '@angular/core';

import {Observable} from 'rxjs/Rx';

import {MappingSource} from './mapping-source.model';
import {UserService} from '../../../users/user.service';
// import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'wave-raster-repository',
    templateUrl: './raster-repository.component.html',
    styleUrls: ['./raster-repository.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RasterRepositoryComponent {

    searchTerm: String = '';
    private sources: Observable<Array<MappingSource>>;

    constructor(
        // private projectService: ProjectService,
        private userService: UserService
    ) {
        this.sources = this.userService.getRasterSourcesStream();
    }

    reload() {
        this.userService.reloadRasterSources();
    }
}
