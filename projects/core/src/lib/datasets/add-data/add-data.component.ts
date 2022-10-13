import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {mergeMap, Observable, range, reduce, takeWhile} from 'rxjs';
import {LayerCollectionNavigationComponent} from '../../layer-collections/layer-collection-navigation/layer-collection-navigation.component';
import {LayerCollectionService} from '../../layer-collections/layer-collection.service';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {AddWorkflowComponent} from '../add-workflow/add-workflow.component';
import {DrawFeaturesComponent} from '../draw-features/draw-features.component';
import {UploadComponent} from '../upload/upload.component';

export interface AddDataButton {
    name: string;
    description: string;
    icon?: string;
    iconSrc?: string;
    sidenavConfig: SidenavConfig | undefined;
    // TODO: restrict registered/anonymous? Tie to role/groups?
}

@Component({
    selector: 'geoengine-add-data',
    templateUrl: './add-data.component.html',
    styleUrls: ['./add-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDataComponent implements OnInit {
    /**
     * A list of data source dialogs to display
     */
    @Input() buttons!: Array<AddDataButton>;

    constructor(protected readonly layoutService: LayoutService) {}

    ngOnInit(): void {}

    /**
     * Load a selected component into the sidenav
     */
    setComponent(sidenavConfig: SidenavConfig | undefined): void {
        if (!sidenavConfig) {
            return;
        }

        this.layoutService.setSidenavContentComponent(sidenavConfig);
    }

    static createLayerRootCollectionButtons(layerService: LayerCollectionService): Observable<Array<AddDataButton>> {
        const MAX_NUMBER_OF_QUERIES = 10;
        const BATCH_SIZE = 20;
        return range(0, MAX_NUMBER_OF_QUERIES).pipe(
            mergeMap((i) => {
                const start = i * BATCH_SIZE;
                return layerService.getRootLayerCollectionItems(start, BATCH_SIZE);
            }),
            takeWhile((collection) => collection.items.length > 0),
            reduce((acc, collection) => {
                const buttons: Array<AddDataButton> = collection.items.map((item) => ({
                    name: item.name,
                    description: item.description,
                    icon: 'layers',
                    sidenavConfig: {
                        component: LayerCollectionNavigationComponent,
                        keepParent: true,
                        config: {rootCollectionItem: item},
                    },
                }));
                return acc.concat(buttons);
            }, [] as Array<AddDataButton>),
        );
    }

    static createUploadButton(): AddDataButton {
        return {
            name: 'Upload',
            description: 'Upload data from you local computer',
            icon: 'publish',
            sidenavConfig: {component: UploadComponent, keepParent: true},
        };
    }

    /**
     * Default for a draw features entry.
     */
    static createDrawFeaturesButton(): AddDataButton {
        return {
            name: 'Draw Features',
            description: 'Draw features on the map',
            icon: 'create',
            sidenavConfig: {component: DrawFeaturesComponent, keepParent: true},
        };
    }

    /**
     * Add workflow id dialog
     */
    static createAddWorkflowByIdButton(): AddDataButton {
        return {
            name: 'Add Workflow by Id',
            description: 'Add a workflow by its id',
            icon: 'build',
            sidenavConfig: {component: AddWorkflowComponent, keepParent: true},
        };
    }
}
