import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import { TableComponent } from './table/table.component';
import { DialogComponent } from './dialog/dialog.component';
import { DialogImageComponent } from './dialog/image/dialog.image.component';
import { DialogAudioComponent } from './dialog/audio/dialog.audio.component';
import { DialogVideoComponent } from './dialog/video/dialog.video.component';

import { PlaylistComponent } from './dialog/playlist/playlist.component';
import { FileNamePipe } from './dialog/filename.pipe';

import { TableService } from './table/table.service';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        HttpModule,
        MaterialModule
    ],
    declarations: [
        TableComponent,
        DialogComponent,
        DialogImageComponent,
        DialogAudioComponent,
        DialogVideoComponent,
        PlaylistComponent,
        FileNamePipe
    ],
    entryComponents: [
        DialogImageComponent,
        DialogAudioComponent,
        DialogVideoComponent
    ],
    exports: [TableComponent],
    providers: [TableService]
})
export class DataTableModule { }
