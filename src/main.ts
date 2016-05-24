import { bootstrap }    from '@angular/platform-browser-dynamic';
import {AppComponent} from './components/app.component';
import {MATERIAL_BROWSER_PROVIDERS} from 'ng2-material';
import {enableProdMode} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';

import Config from './models/config.model';

// disable dev mode when not in debug mode
if (!Config.DEBUG_MODE) {
    enableProdMode();
}

bootstrap(
    AppComponent,
    [...MATERIAL_BROWSER_PROVIDERS, ...HTTP_PROVIDERS]
).catch(err => console.error(err));
