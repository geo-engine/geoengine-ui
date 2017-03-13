import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'wave-workspace-settings',
  templateUrl: './workspace-settings.component.html',
  styleUrls: ['./workspace-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceSettingsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
