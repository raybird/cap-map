import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';

import { AppComponent } from './app.component';
import { MapContainerComponent } from './map-container/map-container.component';
import { TimelineComponent } from './timeline/timeline.component';
import { EventSidebarComponent } from './event-sidebar/event-sidebar.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { LayerControlComponent } from './layer-control/layer-control.component';
import { appReducer } from './store/app.state';

@NgModule({
  declarations: [
    AppComponent,
    MapContainerComponent,
    TimelineComponent,
    EventSidebarComponent,
    SearchBarComponent,
    LayerControlComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    StoreModule.forRoot(appReducer)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
