import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NavigationComponent} from './navigation/navigation.component';
import {LogInGuard} from './util/guards/log-in.guard';
import {BackendAvailableGuard, CanRegisterGuard, LoginComponent, RegisterComponent} from '@geoengine/common';

const routes: Routes = [
    {path: '', redirectTo: 'navigation', pathMatch: 'full'},
    {path: 'navigation', component: NavigationComponent, canActivate: [LogInGuard]},
    {path: 'signin', component: LoginComponent, data: {loginRedirect: '/navigation'}},
    {
        path: 'register',
        component: RegisterComponent,
        data: {loginRedirect: '/navigation'},
        canActivate: [BackendAvailableGuard, CanRegisterGuard],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true, onSameUrlNavigation: 'reload', bindToComponentInputs: true})],
    exports: [RouterModule],
})
export class AppRoutingModule {}
