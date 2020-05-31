import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeViewComponent} from './views/home-view/home-view.component';
import {PageNotFoundViewComponent} from './views/page-not-found-view/page-not-found-view.component';
import {HttpClientModule} from '@angular/common/http';
import {ZipkinModule} from 'ng-zipkin';
import {TracingGetComponent} from './views/tracing-get/tracing-get.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeViewComponent,
    PageNotFoundViewComponent,
    TracingGetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ZipkinModule.forRoot({debug: true})
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
