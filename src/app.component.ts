import {Component} from 'angular2/core';

@Component({
    selector: 'wave-app',
    template: `
    <div layout="column" style="height:500px;">
				<md-toolbar>
				  <paper-icon-button icon="menu"></paper-icon-button>
				  <div class="title">{{title}}</div>
				  <paper-icon-button icon="more-vert"></paper-icon-button>
				</md-toolbar>
				<paper-toolbar>
					<paper-tabs [selected]="tabNr" (selected-changed)="tabNr=$event.detail.value">
						<paper-tab>Tab 1</paper-tab>
						<paper-tab>Tab 2</paper-tab>
						<paper-tab>Tab 3</paper-tab>
					</paper-tabs>
					<br />
					<iron-pages [selected]="tabNr">
						<div>Page 1</div>
						<div>Page 2</div>
						<div>Page 3</div>
					</iron-pages>
					<br />
					<div (click)="traverse()">Page {{tabNr + 1}}</div>
				</paper-toolbar>
    </div>
    `
})
export class AppComponent {
	title = "Hello World!";
	
	people = [
	  {"name": "Bob"},
	  {"name": "Tim"},
	  {"name": "Mike"}
	];
	
	tabNr = 1;
	
	traverse() {
		this.tabNr = (this.tabNr + 1) % 3;
	}
	
}

/*
				<iron-list [items]="people" as="item">
					<template>
						<div>Name: [[item.name]]</div>
					</template>
				</iron-list>
*/