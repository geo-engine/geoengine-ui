import {Component, ChangeDetectionStrategy, ViewChild, Output, EventEmitter, ElementRef} from '@angular/core';

@Component({
    selector: 'geoengine-drag-and-drop',
    templateUrl: './drag-and-drop.component.html',
    styleUrls: ['./drag-and-drop.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragAndDropComponent {
    selectedFiles?: Array<File>;
    @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

    @Output() public selectFilesEvent = new EventEmitter();

    selectFiles(target: HTMLInputElement | null): void {
        const fileList = target?.files;

        if (!fileList) {
            return;
        }
        if (!this.selectedFiles) {
            this.selectedFiles = Array.from(fileList);
            if (this.fileInput) {
                this.fileInput.nativeElement.value = '';
            }
            this.selectFilesEvent.emit(this.selectedFiles);
            return;
        }

        for (const file of Array.from(fileList)) {
            this.selectedFiles.unshift(file);
            if (this.fileInput) {
                this.fileInput.nativeElement.value = '';
            }
        }
        this.selectFilesEvent.emit(this.selectedFiles);
    }

    removeFile(file: File): void {
        if (this.selectedFiles) {
            const index: number = this.selectedFiles.indexOf(file);
            this.selectedFiles?.splice(index, 1);
        } else return;
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
    }
}
