import {Component, ChangeDetectionStrategy} from 'angular2/core';

@Component({
    selector: 'add-data-component',
    template: `
    <md-sidenav name="right" align="right" layout="column"
                style="over" (onShown)="input.focus()">
      <md-toolbar class="md-theme-light">
        <h1 class="md-toolbar-tools">Sidenav Right</h1>
      </md-toolbar>
      <md-content layout-padding>
        <form>
          <md-input-container class="md-block">
            <label for="testInput">Test input</label>
            <input type="text" id="testInput" md-input #input
                   [(value)]="data" md-autofocus>
          </md-input-container>
        </form>
        <button md-raised-button (click)="close('right')" class="md-primary">
          Close Sidenav Right
        </button>
      </md-content>
    </md-sidenav>
    `,
    styles: [``],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class AddDataComponent {
    
}