import { bootstrap }    from '@angular/platform-browser-dynamic';
import {HTTP_PROVIDERS} from '@angular/http';
import {OVERLAY_PROVIDERS} from '@angular2-material/core/overlay/overlay';
import {enableProdMode} from '@angular/core';

import {AppComponent} from './app/app.component';

import Config from './app/config.model';

// disable dev mode when not in debug mode
if (!Config.DEVELOPER_MODE) {
    enableProdMode();
}

bootstrap(
    AppComponent, [HTTP_PROVIDERS, OVERLAY_PROVIDERS]
).catch(
    error => console.error(error)
);
