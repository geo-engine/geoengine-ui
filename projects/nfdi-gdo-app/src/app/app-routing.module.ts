import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IsLoggedInGuard} from '@geoengine/core';
import {LoginComponent} from './login/login.component';
import {MainComponent} from './main/main.component';

const routes: Routes = [
    {path: '', redirectTo: 'map', pathMatch: 'full'},
    {path: 'map', component: MainComponent, canActivate: [IsLoggedInGuard]},
    {path: 'signin', component: LoginComponent},
    // seems to be a good fallback if we cannot acces `map`
    {path: '**', redirectTo: 'signin', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    providers: [IsLoggedInGuard],
    exports: [RouterModule],
})
export class AppRoutingModule {}
