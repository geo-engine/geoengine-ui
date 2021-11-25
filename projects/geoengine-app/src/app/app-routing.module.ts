import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IsLoggedInGuard} from 'wave-core';
import {CanRegisterGuard} from './guards/can-register.guard';
import {LoginComponent} from './login/login.component';
import {MainComponent} from './main/main.component';
import {RegisterComponent} from './register/register.component';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: MainComponent, canActivate: [IsLoggedInGuard]},
    {path: 'signin', component: LoginComponent},
    {path: 'register', component: RegisterComponent, canActivate: [CanRegisterGuard]},
    // seems to be a good fallback if we cannot acces `map`
    {path: '**', redirectTo: 'signin', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    providers: [IsLoggedInGuard, CanRegisterGuard],
    exports: [RouterModule],
})
export class AppRoutingModule {}
