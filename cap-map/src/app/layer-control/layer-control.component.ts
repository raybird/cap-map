import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as MapActions from '../store/actions/map.actions';
import * as MapSelectors from '../store/selectors/map.selectors';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.css'],
  standalone: false
})
export class LayerControlComponent implements OnInit, OnDestroy {
  activeLayers$!: Observable<string[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isOpen = false;
  
  private subscriptions: Subscription[] = [];
  
  // Define available thematic layers
  availableLayers = [
    { id: 'terrain', name: '地形圖', description: '顯示海拔和地形資訊' },
    { id: 'climate', name: '氣候圖', description: '顯示雨量、溫度分布' },
    { id: 'boundaries', name: '行政區劃', description: '顯示歷史不同時期的行政區劃' },
    { id: 'economy', name: '經濟發展', description: '顯示產業分布和資源分布' },
    { id: 'population', name: '人口分布', description: '顯歷史人口密度和移動' },
    { id: 'transportation', name: '交通網絡', description: '顯歷史交通路線和港口' }
  ];

  constructor(
    private store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    // Set up observables
    this.activeLayers$ = this.store.select(MapSelectors.selectMapActiveLayers);
    // For loading and error, we'll create simple observables since they don't exist in selectors
    this.loading$ = new Observable<boolean>(observer => {
      observer.next(false); // Assume not loading for now
      observer.complete();
    });
    this.error$ = new Observable<string | null>(observer => {
      observer.next(null); // No error for now
      observer.complete();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleLayer(layerId: string): void {
    this.store.dispatch(MapActions.toggleMapLayer({ layerId }));
  }

  isLayerActive(layerId: string): boolean {
    let isActive = false;
    const sub = this.activeLayers$.subscribe(layers => {
      isActive = layers.includes(layerId);
    });
    this.subscriptions.push(sub);
    return isActive;
  }

  getLayerDescription(layerId: string): string {
    const layer = this.availableLayers.find(l => l.id === layerId);
    return layer ? layer.description : '';
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }
}
