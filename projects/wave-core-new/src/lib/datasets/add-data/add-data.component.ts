import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {DatasetListComponent} from '../dataset-list/dataset-list.component';

export interface AddDataListButton {
    name: string;
    description: string;
    icon?: string;
    iconSrc?: string;
    sidenavConfig: SidenavConfig | undefined;
    // TODO: restrict registered/anonymous? Tie to role/groups?
}

@Component({
    selector: 'wave-add-data',
    templateUrl: './add-data.component.html',
    styleUrls: ['./add-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDataComponent implements OnInit {
    /**
     * A list of data source dialogs to display
     */
    @Input() buttons!: Array<AddDataListButton>;

    constructor(private layoutService: LayoutService) {}

    ngOnInit(): void {}

    /**
     * Load a selected component into the sidenav
     */
    setComponent(sidenavConfig: SidenavConfig): void {
        if (!sidenavConfig) {
            return;
        }

        this.layoutService.setSidenavContentComponent(sidenavConfig);
    }

    static createDataSetListButton(): AddDataListButton {
        return {
            name: 'Data Sets',
            description: 'Available Data Sets',
            iconSrc: this.createIconDataUrl('DataSets'),
            sidenavConfig: {component: DatasetListComponent, keepParent: true},
        };
    }

    /**
     * Each operator type must have a method that returns
     * an icon as a data uri image. This provides a default
     * out of the operator name.
     */
    static createIconDataUrl(iconName: string): string {
        // TODO: replace with proper icons
        // from `http://stackoverflow.com/questions/3426404/
        // create-a-hexadecimal-colour-based-on-a-string-with-javascript`
        const hashCode = (str: string): number => {
            // java String#hashCode
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line no-bitwise
            }
            return hash;
        };
        const intToRGB = (i: number): string => {
            const c = (i & 0x00ffffff).toString(16).toUpperCase(); // eslint-disable-line no-bitwise

            return '00000'.substring(0, 6 - c.length) + c;
        };

        const color = '#' + intToRGB(hashCode(iconName));
        const size = 64;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        context.fillStyle = color;
        context.fillRect(0, 0, 64, 64);
        return canvas.toDataURL('image/png');
    }
}
