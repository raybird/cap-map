import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as MapActions from '../store/actions/map.actions';
import * as MapSelectors from '../store/selectors/map.selectors';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-layer-control',
  templateUrl: './layer-control.component.html',
  styleUrls: ['./layer-control.component.css'],
  standalone: false
})
export class LayerControlComponent implements OnInit, OnDestroy {
  activeLayers$!: Observable<string[]>;
  isOpen = false;

  private subscriptions: Subscription[] = [];

  availableLayers = [
    { id: 'terrain', name: '地形圖', description: '顯示海拔和地形資訊' },
    { id: 'climate', name: '氣候圖', description: '顯示雨量與溫度分布' },
    { id: 'boundaries', name: '行政區劃', description: '顯示各時期行政界線變化' },
    { id: 'economy', name: '經濟發展', description: '顯示產業與資源分布' },
    { id: 'population', name: '人口分布', description: '顯示歷史人口密度與遷移' },
    { id: 'transportation', name: '交通網絡', description: '顯示歷史路線與港口' }
  ];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.activeLayers$ = this.store.select(MapSelectors.selectMapActiveLayers);
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

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }
}