import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BackendStatusPageComponent, NotFoundPageComponent} from '@geoengine/core';
import {MainComponent} from './main/main.component';
import {BackendAvailableGuard, CanRegisterGuard, LoginComponent, LogInGuard, RegisterComponent} from '@geoengine/common';
import {routes as managerRoutes} from '@geoengine/manager';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: MainComponent, canActivate: [BackendAvailableGuard, LogInGuard]},
    {path: 'signin', component: LoginComponent, canActivate: [BackendAvailableGuard]},
    {path: 'register', component: RegisterComponent, canActivate: [BackendAvailableGuard, CanRegisterGuard]},
    {path: '404', component: NotFoundPageComponent},
    {path: 'backend-status', component: BackendStatusPageComponent},
    // manager
    {
        path: 'manager',
        children: managerRoutes,
        canActivate: [BackendAvailableGuard],
    },
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
