import { createAction, props } from '@ngrx/store';

export const setMapEvents = createAction(
  '[Map] Set Events',
  props<{ events: any[] }>()
);

export const selectEvent = createAction(
  '[Map] Select Event',
  props<{ eventId: string }>()
);

export const clearSelectedEvent = createAction(
  '[Map] Clear Selected Event'
);

export const toggleMapLayer = createAction(
  '[Map] Toggle Layer',
  props<{ layerId: string }>()
);
