import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {GbifOperatorComponent} from '../gbif-operator/gbif-operator.component';
import {GFBioSourceType} from '../../types/gfbio-source-type.model';
import {LayoutService} from '../../../layout.service';
import {RasterRepositoryComponent} from '../../../../components/raster-repository.component';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {AbcdRepositoryComponent} from '../../../../components/abcd-repository.component';
import {ABCDSourceType} from '../../types/abcd-source-type.model';
import {CsvRepositoryComponent} from '../../../../components/csv-repository.component';
import {CsvSourceType} from '../../types/csv-source-type.model';
import {GfbioBasketsComponent} from '../../../../baskets/gfbio-baskets.component';

@Component({
    selector: 'wave-source-operator-list',
    templateUrl: './source-operator-list.component.html',
    styleUrls: ['./source-operator-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourceOperatorListComponent implements OnInit {
    // make available
    SourceOperatorListComponent = SourceOperatorListComponent;

    RasterRepositoryComponent = RasterRepositoryComponent;
    RasterSourceType = RasterSourceType;

    AbcdRepositoryComponent = AbcdRepositoryComponent;
    ABCDSourceType = ABCDSourceType;

    CsvRepositoryComponent = CsvRepositoryComponent;
    CsvSourceType = CsvSourceType;

    GfbioBasketsComponent = GfbioBasketsComponent;

    GbifOperatorComponent = GbifOperatorComponent;
    GFBioSourceType = GFBioSourceType;
    //

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

}
