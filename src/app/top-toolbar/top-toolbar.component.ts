import { Component, OnInit } from '@angular/core';
import {MdDialog} from '@angular/material';
import {Observable} from 'rxjs/Rx';

import {UserService} from '../users/user.service';
import {LayoutService} from '../layout.service';

import {RasterRepositoryComponent} from "../../components/raster-repository.component";
import {AbcdRepositoryComponent} from "../../components/abcd-repository.component";
import {CsvRepositoryComponent} from "../../components/csv-repository.component";
import {GfbioBasketsComponent} from "../../baskets/gfbio-baskets.component";
import {OperatorRepositoryComponent} from "../../components/operator-repository.component";

import {GbifOperatorComponent} from '../operators/dialogs/gbif-operator/gbif-operator.component';
import {Config} from '../config.service';

@Component({
  selector: 'wave-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.scss']
})
export class TopToolbarComponent implements OnInit {


  constructor(
      public config: Config,
      private layoutService: LayoutService
  ) { }

  ngOnInit() {
  }



}
