import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as EventActions from '../store/actions/event.actions';
import * as MapActions from '../store/actions/map.actions';
import { selectSelectedEvent, selectEventLoading, selectEventError } from '../store/selectors/event.selectors';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-event-sidebar',
  templateUrl: './event-sidebar.component.html',
  styleUrls: ['./event-sidebar.component.css'],
  standalone: false
})
export class EventSidebarComponent implements OnInit, OnDestroy {
  selectedEvent$!: Observable<any>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    // Set up observables
    this.selectedEvent$ = this.store.select(selectSelectedEvent);
    this.loading$ = this.store.select(selectEventLoading);
    this.error$ = this.store.select(selectEventError);
    
    // Optionally load events if not already loaded
    // this.store.dispatch(EventActions.loadEvents());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  closeSidebar(): void {
    this.store.dispatch(EventActions.clearSelectedEvent());
    this.store.dispatch(MapActions.clearSelectedEvent());
  }
}
