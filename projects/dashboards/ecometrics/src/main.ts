import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/app.component';
import {CoreConfig} from '@geoengine/core';

CoreConfig.load().then(() => {
    bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
});
