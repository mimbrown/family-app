import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 
import { LoginComponent } from 'app/components/login/login.component';
import { MainAppComponent } from 'app/components/main-app/main-app.component';
import { FamilyComponent } from 'app/components/main-app/family/family.component';
import { FamilyTreeComponent } from 'app/components/main-app/family-tree/family-tree.component';
import { HistoryComponent } from 'app/components/main-app/history/history.component';
import { WritingsComponent } from 'app/components/main-app/writings/writings.component';
import { ViewComponent } from 'app/components/main-app/writings/view/view.component';
import { ComposeComponent } from 'app/components/main-app/writings/compose/compose.component';
import { AuthGuard } from 'app/guards/auth.guard';
 
const routes: Routes = [
  { path: '', component: MainAppComponent, canActivate: [AuthGuard], children: [
    { path: '', redirectTo: 'family', pathMatch: 'full' },
    { path: 'family',  component: FamilyComponent },
    { path: 'history', component: HistoryComponent },
    { path: 'writings', component: WritingsComponent, children: [
      { path: '', redirectTo: 'view', pathMatch: 'full' },
      { path: 'view', component: ViewComponent },
      { path: 'compose', component: ComposeComponent }
    ] },
    { path: 'family-tree', component: FamilyTreeComponent }
  ] },
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',  component: LoginComponent },
];
 
@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}