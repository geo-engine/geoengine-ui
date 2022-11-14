import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BackendStatusPageComponent, LogInGuard, NotFoundComponent, BackendAvailableGuard} from '@geoengine/core';
import {CanRegisterGuard} from './guards/can-register.guard';
import {LoginComponent} from './login/login.component';
import {MainComponent} from './main/main.component';
import {RegisterComponent} from './register/register.component';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: MainComponent, canActivate: [BackendAvailableGuard, LogInGuard]},
    {path: 'signin', component: LoginComponent},
    {path: 'register', component: RegisterComponent, canActivate: [CanRegisterGuard]},
    {path: '404', component: NotFoundComponent},
    {path: 'backend-status', component: BackendStatusPageComponent},
    // fallback to not found page
    {path: '**', component: NotFoundComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    providers: [BackendAvailableGuard, LogInGuard, CanRegisterGuard],
    exports: [RouterModule],
})
export class AppRoutingModule {}
