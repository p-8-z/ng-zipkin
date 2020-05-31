import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PageNotFoundViewComponent} from './views/page-not-found-view/page-not-found-view.component';
import {HomeViewComponent} from './views/home-view/home-view.component';
import {TracingGetComponent} from "./views/tracing-get/tracing-get.component";


const routes: Routes = [
  {
    path: 'home',
    component: HomeViewComponent
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'tracing-get',
    component: TracingGetComponent
  },
  {path: '**', component: PageNotFoundViewComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
