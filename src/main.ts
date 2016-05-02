import {bootstrap}    from "angular2/platform/browser";
import {AppComponent} from "./app.component";
import {MATERIAL_BROWSER_PROVIDERS} from "ng2-material/all";
import {enableProdMode} from "angular2/core";

import Config from "./config.model";

// disable dev mode when not in debug mode
if (!Config.DEBUG_MODE) {
    enableProdMode();
}

bootstrap(AppComponent, [MATERIAL_BROWSER_PROVIDERS]).catch(err => console.error(err));
