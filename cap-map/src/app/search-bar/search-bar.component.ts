import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as EventActions from '../store/actions/event.actions';
import * as MapActions from '../store/actions/map.actions';
import * as EventSelectors from '../store/selectors/event.selectors';
import { Subscription, Observable } from 'rxjs';
import Fuse from 'fuse.js';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  standalone: false
})
export class SearchBarComponent implements OnInit, OnDestroy {
  events$!: Observable<any[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  searchResults: any[] = [];
  fuse!: Fuse<any>;
  isFocused = false;
  queryText = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(EventActions.loadEvents());

    this.events$ = this.store.select(EventSelectors.selectEvents);
    this.loading$ = this.store.select(EventSelectors.selectEventLoading);
    this.error$ = this.store.select(EventSelectors.selectEventError);

    const eventsSub = this.events$.subscribe(events => {
      if (events.length > 0) {
        this.initializeFuse(events);
      }
    });
    this.subscriptions.push(eventsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initializeFuse(events: any[]): void {
    const options = {
      keys: ['title', 'description', 'keywords'],
      threshold: 0.3
    };
    this.fuse = new Fuse(events, options);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    this.queryText = query;

    if (!query || !this.fuse) {
      this.searchResults = [];
      return;
    }

    const results = this.fuse.search(query);
    this.searchResults = results.map(result => result.item);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.isFocused = false;
    }, 200);
  }

  selectEvent(eventId: string): void {
    this.isFocused = false;
    this.searchResults = [];
    this.store.dispatch(EventActions.selectEvent({ eventId }));
    this.store.dispatch(MapActions.selectEvent({ eventId }));
  }

  clearSearch(): void {
    const input = document.querySelector('#search-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.queryText = '';
    this.searchResults = [];
  }
}