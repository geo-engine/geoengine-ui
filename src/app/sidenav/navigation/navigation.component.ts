import {Component, OnInit, ChangeDetectionStrategy, Type} from '@angular/core';
import {LayoutService} from '../../layout.service';
import {GbifOperatorComponent} from '../../operators/dialogs/gbif-operator/gbif-operator.component';
import {SourceOperatorListComponent} from '../../operators/dialogs/source-operator-list/source-operator-list.component';
import {OperatorRepositoryComponent} from '../../../components/operator-repository.component';

@Component({
    selector: 'wave-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationComponent implements OnInit {

    // make available
    SourceOperatorListComponent = SourceOperatorListComponent;
    OperatorRepositoryComponent = OperatorRepositoryComponent;

    constructor(public layoutService: LayoutService) {
    }

    ngOnInit() {
    }

    buttonColor(selectedComponent: Type<Component>, component: Type<Component>) {
        if (selectedComponent && selectedComponent === component) {
            return 'primary';
        } else {
            return 'default';
        }
    }

}
