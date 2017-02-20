import { Component, OnInit } from '@angular/core';
import {MdDialog} from "@angular/material";
import {LayoutService} from "../../layout.service";
import {Observable} from "rxjs";

@Component({
  selector: 'wave-next-layer-list',
  templateUrl: 'next-layer-list.component.html',
  styleUrls: ['next-layer-list.component.scss']
})
export class NextLayerListComponent implements OnInit {

  layerListVisibility$: Observable<boolean>;


  constructor(
     public dialog: MdDialog,
     private layoutService: LayoutService,
  ) {
     this.layerListVisibility$ = this.layoutService.getLayerListVisibilityStream();
  }

  ngOnInit() {
  }

}
