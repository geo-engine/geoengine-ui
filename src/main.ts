import { bootstrap }    from '@angular/platform-browser-dynamic';
import {AppComponent} from './app/app.component';
import {enableProdMode} from '@angular/core';

import Config from './models/config.model';

// disable dev mode when not in debug mode
if (!Config.DEBUG_MODE) {
    enableProdMode();
}

bootstrap(
    AppComponent
).catch(
    console.error
);
