import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {LayerCollectionNavigationComponent} from '../../layer-collections/layer-collection-navigation/layer-collection-navigation.component';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {createIconDataUrl} from '../../util/icons';
import {AddWorkflowComponent} from '../add-workflow/add-workflow.component';
import {DatasetListComponent} from '../dataset-list/dataset-list.component';
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

    constructor(private layoutService: LayoutService) {}

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

    static createDatasetListButton(): AddDataButton {
        return {
            name: 'Datasets',
            description: 'Available Datasets',
            icon: 'storage',
            sidenavConfig: {component: DatasetListComponent, keepParent: true},
        };
    }

    static createLayerCollectionButton(): AddDataButton {
        return {
            name: 'Layers',
            description: 'Collection of existing layers',
            icon: 'sort',
            sidenavConfig: {component: LayerCollectionNavigationComponent, keepParent: true},
        };
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
