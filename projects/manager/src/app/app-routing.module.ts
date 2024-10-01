import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NavigationComponent} from './navigation/navigation.component';
import {LogInGuard} from './util/guards/log-in.guard';
import {LoginComponent} from './login/login.component';

const routes: Routes = [
    {path: '', redirectTo: 'navigation', pathMatch: 'full'},
    {path: 'navigation', component: NavigationComponent, canActivate: [LogInGuard]},
    {path: 'signin', component: LoginComponent},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true, onSameUrlNavigation: 'reload'})],
    exports: [RouterModule],
})
export class AppRoutingModule {}
