import {bootstrap}    from "angular2/platform/browser";
import {AppComponent} from "./app.component";
import {MATERIAL_BROWSER_PROVIDERS} from "ng2-material/all";

bootstrap(AppComponent, [MATERIAL_BROWSER_PROVIDERS]).catch(err => console.error(err));
