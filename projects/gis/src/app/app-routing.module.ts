import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BackendStatusPageComponent, LogInGuard, NotFoundPageComponent, BackendAvailableGuard} from '@geoengine/core';
import {CanRegisterGuard} from './guards/can-register.guard';
import {MainComponent} from './main/main.component';
import {RegisterComponent} from './register/register.component';
import {LoginComponent} from '@geoengine/common';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: MainComponent, canActivate: [BackendAvailableGuard, LogInGuard]},
    {path: 'signin', component: LoginComponent, canActivate: [BackendAvailableGuard]},
    {path: 'register', component: RegisterComponent, canActivate: [BackendAvailableGuard, CanRegisterGuard]},
    {path: '404', component: NotFoundPageComponent},
    {path: 'backend-status', component: BackendStatusPageComponent},
    // fallback to not found page
    {path: '**', redirectTo: '404', pathMatch: 'full'},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            useHash: true,
            initialNavigation: 'disabled', // navigation is enabled in app component after removing query params before the hash
            onSameUrlNavigation: 'reload', // for reload the page and checking if the user is logged in again
        }),
    ],
    providers: [BackendAvailableGuard, LogInGuard, CanRegisterGuard],
    exports: [RouterModule],
})
export class AppRoutingModule {}
