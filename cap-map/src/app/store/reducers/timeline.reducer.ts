import { createReducer, on } from '@ngrx/store';
import * as TimelineActions from '../actions/timeline.actions';

export interface TimelineState {
  periods: any[];
  currentPeriodId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialTimelineState: TimelineState = {
  periods: [],
  currentPeriodId: null,
  loading: false,
  error: null
};

export const timelineReducer = createReducer(
  initialTimelineState,
  on(TimelineActions.loadTimelinePeriods, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(TimelineActions.loadTimelinePeriodsSuccess, (state, { periods }) => ({
    ...state,
    periods,
    loading: false,
    error: null
  })),
  on(TimelineActions.loadTimelinePeriodsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(TimelineActions.setCurrentPeriod, (state, { periodId }) => ({
    ...state,
    currentPeriodId: periodId
  }))
);
