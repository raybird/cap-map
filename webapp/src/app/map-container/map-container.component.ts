import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import { selectEvent } from '../store/actions/map.actions';
import * as EventActions from '../store/actions/event.actions';
import { selectMapEvents, selectSelectedEventId } from '../store/selectors/map.selectors';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map-container',
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.css'],
  standalone: false
})
export class MapContainerComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private markers: L.LayerGroup = L.layerGroup();
  private selectedLayer: L.Layer | null = null;
  private currentSelectedEventId: string | null = null;
  private eventSubscriptions: Subscription[] = [];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.initMap();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.eventSubscriptions.forEach(sub => sub.unsubscribe());
  }

  private initMap(): void {
    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([23.7, 121.0], 7);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      className: 'old-maps-layer'
    }).addTo(this.map);

    this.map.addLayer(this.markers);
  }

  private setupEventListeners(): void {
    const eventsSub = this.store.select(selectMapEvents).subscribe(events => {
      this.updateEventMarkers(events);
    });
    this.eventSubscriptions.push(eventsSub);

    const selectedEventSub = this.store.select(selectSelectedEventId).subscribe(eventId => {
      this.currentSelectedEventId = eventId;
      this.highlightMarker(eventId);
    });
    this.eventSubscriptions.push(selectedEventSub);
  }

  private createInkIcon(color: string = '#c41e3a', size: number = 18): L.DivIcon {
    return L.divIcon({
      className: 'ink-marker',
      html: `<div class="ink-marker-inner" style="width:${size}px;height:${size}px;">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.85"/>
          <circle cx="12" cy="12" r="6" fill="${color}" opacity="0.4"/>
          <circle cx="12" cy="12" r="2.5" fill="#2c241b" opacity="0.9"/>
        </svg>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  private updateEventMarkers(events: any[]): void {
    this.markers.clearLayers();
    this.selectedLayer = null;

    events.forEach(event => {
      if (event.location && event.location.coordinates) {
        const [lat, lng] = event.location.coordinates;
        const marker = L.marker([lat, lng], { icon: this.createInkIcon() });
        (marker as any)._eventId = event.id;

        const popupContent = `<div class="marker-popup">
          <h3>${event.title}</h3>
          <p>${event.date?.start || ''} ${event.location?.name || ''}</p>
        </div>`;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          this.store.dispatch(selectEvent({ eventId: event.id }));
          this.store.dispatch(EventActions.selectEvent({ eventId: event.id }));
        });

        this.markers.addLayer(marker);
      }
    });

    this.highlightMarker(this.currentSelectedEventId);
  }

  private highlightMarker(eventId: string | null): void {
    this.markers.eachLayer((layer: L.Layer) => {
      const el = (layer as any).getElement?.();
      if (el) {
        el.classList.remove('selected-marker');
        el.classList.remove('dimmed-marker');
      }
    });
    this.selectedLayer = null;

    if (!eventId) return;

    this.markers.eachLayer((layer: L.Layer) => {
      const el = (layer as any).getElement?.();
      if (!el) return;
      if ((layer as any)._eventId === eventId) {
        el.classList.add('selected-marker');
        this.selectedLayer = layer;
      } else {
        el.classList.add('dimmed-marker');
      }
    });
  }
}