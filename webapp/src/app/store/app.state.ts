import { ActionReducerMap } from '@ngrx/store';
import * as fromMap from './reducers/map.reducer';
import * as fromTimeline from './reducers/timeline.reducer';
import * as fromEvent from './reducers/event.reducer';

export interface AppState {
  map: fromMap.MapState;
  timeline: fromTimeline.TimelineState;
  event: fromEvent.EventState;
  // Other state slices will be added later
}

export const appReducer: ActionReducerMap<AppState> = {
  map: fromMap.mapReducer,
  timeline: fromTimeline.timelineReducer,
  event: fromEvent.eventReducer
  // Other reducers will be added here
};
