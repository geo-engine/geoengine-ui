import {Component} from 'angular2/core';
import {MATERIAL_DIRECTIVES} from 'ng2-material/all';

@Component({
    selector: 'wave-app',
    templateUrl: 'templates/app.component.html',
	directives: [MATERIAL_DIRECTIVES]
})
export class AppComponent {
    clicked(message: string) {
        alert(message);
    }
}