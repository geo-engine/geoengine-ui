import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {GbifOperatorComponent} from '../gbif-operator/gbif-operator.component';
import {GFBioSourceType} from '../../types/gfbio-source-type.model';
import {LayoutService} from '../../../layout.service';
import {DataRepositoryComponent} from '../data-repository/data-repository.component';
import {RasterSourceType} from '../../types/raster-source-type.model';
import {AbcdRepositoryComponent} from '../abcd-repository/abcd-repository.component';
import {ABCDSourceType} from '../../types/abcd-source-type.model';
import {CsvSourceType} from '../../types/csv-source-type.model';
import {GfbioBasketsComponent} from '../baskets/gfbio-baskets.component';
import {FeaturedbSourceListComponent} from '../featuredb-source-list/featuredb-source-list.component';
import {OlDrawFeaturesComponent} from '../draw-features/ol-draw-features.component';
import {CountryPolygonSelectionComponent} from '../country-polygon-selection/country-polygon-selection.component';
import {SensorSourceOperatorComponent} from '../sensor-source-operator/sensor-source-operator.component';
import {ChronicleDbSourceComponent} from '../chronicle-db-source/chronicle-db-source.component';

@Component({
    selector: 'wave-source-operator-list',
    templateUrl: './source-operator-list.component.html',
    styleUrls: ['./source-operator-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SourceOperatorListComponent implements OnInit {
    // make available
    SourceOperatorListComponent = SourceOperatorListComponent;

    DataRepositoryComponent = DataRepositoryComponent;
    RasterSourceType = RasterSourceType;

    AbcdRepositoryComponent = AbcdRepositoryComponent;
    ABCDSourceType = ABCDSourceType;

    FeaturedbSourceListComponent = FeaturedbSourceListComponent;
    CsvSourceType = CsvSourceType;

    GfbioBasketsComponent = GfbioBasketsComponent;

    GbifOperatorComponent = GbifOperatorComponent;
    GFBioSourceType = GFBioSourceType;

    DrawFeaturesComponent = OlDrawFeaturesComponent;
    PolygonSelectionComponent = CountryPolygonSelectionComponent;
    SensorSourceOperatorComponent = SensorSourceOperatorComponent;

    ChronicleDbSourceComponent = ChronicleDbSourceComponent;
    //

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

}
