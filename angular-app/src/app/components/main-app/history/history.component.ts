import { Component, OnInit, ElementRef } from '@angular/core';
import { Element } from '@angular/compiler';
import { DatePipe } from '@angular/common';

import { TravelService } from 'app/stores/travel.service';
import { Travel } from 'app/models/travel';

import * as L from 'leaflet';
// import { Arc } from 'leaflet-arc';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  providers: [DatePipe]
})
export class HistoryComponent implements OnInit {
  private map;
  private baselayer: L.Layer;
  private liveGroup: L.FeatureGroup;
  private travelGroup: L.FeatureGroup;
  private livePathsGroup: L.FeatureGroup;
  private travelPathsGroup: L.FeatureGroup;

  constructor(private el: ElementRef, private store: TravelService, private date: DatePipe) { }

  ngOnInit() {
    // console.log(this.el.nativeElement);
    let map = this.map = L.map(this.el.nativeElement, {
      center: [40, -100],
      zoom: 5,
      minZoom: 2,
      zoomControl: false
    });

    let baselayer = this.baselayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

    map.addLayer(baselayer);
    this.liveGroup = L.featureGroup();
    this.travelGroup = L.featureGroup();
    this.livePathsGroup = L.featureGroup();
    this.travelPathsGroup = L.featureGroup();

    map.addLayer(this.liveGroup);
    map.addLayer(this.travelGroup);
    map.addLayer(this.livePathsGroup);
    map.addLayer(this.travelPathsGroup);

    this.store.getData()
      .then(this.buildLayers.bind(this));
  }

  buildLayers(travels: Travel[]): void {
    let map = this.map;
    let i = 0, len = travels.length,
      travel, nextTravel, latLng, nextLatLng, allLayers;

    for (; i < len; i++) {
      travel = travels[i];
      latLng = [travel.lat, travel.lng];
      nextTravel = travels[i+1];
      
      if (travel.type === 'live') {
        this.liveGroup.addLayer(
          L.circleMarker(latLng)
            .bindPopup(this.buildPointPopup(travel))
        );
        while (nextTravel && nextTravel.type === 'travel') {
          nextLatLng = [nextTravel.lat, nextTravel.lng];
          this.travelGroup.addLayer(
            L.circleMarker(nextLatLng)
              .bindPopup(this.buildPointPopup(nextTravel))
          );
          this.travelPathsGroup.addLayer(
            L.polyline([latLng, nextLatLng])
            // L.Polyline.Arc(latLng, nextLatLng)
              .bindPopup(this.buildArcPopup(travel, nextTravel))
          );
          ++i;
          nextTravel = travels[i+1];
        }
        if (nextTravel) {
          this.livePathsGroup.addLayer(
            L.polyline([latLng, [nextTravel.lat, nextTravel.lng]])
            // L.Polyline.Arc(latLng, [nextTravel.lat, nextTravel.lng])
              .bindPopup(this.buildArcPopup(travel, nextTravel))
          );
        }
      } else {
        this.travelGroup.addLayer(
          L.circleMarker(latLng)
            .bindPopup(this.buildPointPopup(travel))
        );
      }
    }
    this.liveGroup.setStyle({
      radius: 5
    });
    this.travelGroup.setStyle({
      color: 'red',
      radius: 5
    });
    this.travelPathsGroup.setStyle({
      color: 'red'
    });
    allLayers = L.featureGroup([
      this.livePathsGroup,
      this.travelPathsGroup,
      this.liveGroup,
      this.travelGroup
    ]);
    map.fitBounds(allLayers.getBounds());
    map.addLayer(allLayers);
  }

  buildPointPopup(point: Travel) {
    if (point.type === 'live') {
      return `Lived in ${point.city}, ${point.state} from ${this.getDate(point.start_date)} to ${this.getDate(point.end_date)}.`;
    } else {
      return `Traveled to ${point.city}, ${point.state} from ${this.getDate(point.start_date)} to ${this.getDate(point.end_date)}.`;
    }
  }

  buildArcPopup(from: Travel, to: Travel) {
    if (to.type === 'live') {
        return `Moved from ${from.city}, ${from.state} to ${to.city}, ${to.state} on ${this.getDate(from.end_date)}.`;
    } else {
        return `Traveled to ${to.city}, ${to.state} on ${this.getDate(to.start_date)}.`;
    }
  }

  getDate(date: Date): string {
    return date ? this.date.transform(date, 'mediumDate') : 'Present';
  }

}
