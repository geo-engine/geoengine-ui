import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {ProjectService} from '../../project/project.service';

@Component({
  selector: 'wave-plot-list',
  templateUrl: './plot-list.component.html',
  styleUrls: ['./plot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlotListComponent implements OnInit {

  constructor(private projectService: ProjectService) { }

  ngOnInit() {
  }

}
