import { bootstrap }    from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http';
import {enableProdMode} from '@angular/core';

import {AppComponent} from './app/app.component';

import Config from './app/config.model';

// disable dev mode when not in debug mode
if (!Config.DEBUG_MODE) {
    enableProdMode();
}

bootstrap(
    AppComponent, [HTTP_PROVIDERS]
).catch(
    console.error
);
