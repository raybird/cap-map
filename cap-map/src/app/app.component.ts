import { Component } from '@angular/core';
import { MapContainerComponent } from './map-container/map-container.component';
import { TimelineComponent } from './timeline/timeline.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'cap-map';
  showExamMode = false;

  toggleExamMode(): void {
    this.showExamMode = !this.showExamMode;
  }
}
