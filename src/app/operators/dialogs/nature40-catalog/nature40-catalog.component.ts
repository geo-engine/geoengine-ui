import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Observable} from 'rxjs';
import {Nature40CatalogEntry, UserService} from '../../../users/user.service';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {OgrSourceType} from '../../types/ogr-source-type.model';

@Component({
    selector: 'wave-nature40-catalog',
    templateUrl: './nature40-catalog.component.html',
    styleUrls: ['./nature40-catalog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Nature40CatalogComponent implements OnInit {

    readonly RASTER_ICON_URL: string = RasterSourceType.ICON_URL;
    readonly VECTOR_ICON_URL: string = OgrSourceType.ICON_URL;
    readonly OTHER_ICON_URL: string;

    readonly catalog$: Observable<Map<string, Array<Nature40CatalogEntry>>>;

    constructor(private userService: UserService) {
        this.catalog$ = this.userService.getNature40Catalog();
    }

    ngOnInit() {
    }

}

