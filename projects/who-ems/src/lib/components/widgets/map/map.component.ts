import { Component, AfterViewInit, Input } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Apollo } from 'apollo-angular';
import { GetResourceByIdQueryResponse, GET_RESOURCE_BY_ID, GetFormByIdQueryResponse, GET_FORM_BY_ID } from '../../../graphql/queries';
import { Record } from '../../../models/record.model';

@Component({
  selector: 'who-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
/*  Map widget using Leaflet.
*/
export class WhoMapComponent implements AfterViewInit {

  // === MAP ===
  public mapId: string;
  private map: any;
  private southWest = L.latLng(-89.98155760646617, -180);
  private northEast = L.latLng(89.99346179538875, 180);
  private bounds = L.latLngBounds(this.southWest, this.northEast);

  // === MARKERS ===
  private markersLayer;
  private markersLayerGroup;
  private popupMarker;

  // === RECORDS ===
  private selectedRecord: Record;
  private records: Record[];

  // === WIDGET CONFIGURATION ===
  @Input() settings: any = null;

  constructor(
    private apollo: Apollo
  ) {
    this.mapId = this.generateUniqueId();
  }

  /*  Generation of an unique id for the map ( in case multiple widgets use map ).
  */
  private generateUniqueId(parts: number = 4): string {
    const stringArr = [];
    for (let i = 0; i < parts; i++) {
      // tslint:disable-next-line:no-bitwise
      const S4 = (((1 + Math.random()) * 0x10000) | 0)
        .toString(16)
        .substring(1);
      stringArr.push(S4);
    }
    return stringArr.join('-');
  }

  /*  Once template is ready, build the map.
  */
  ngAfterViewInit(): void {

    this.drawMap();

    if (this.settings && this.settings.source && this.settings.latitude && this.settings.longitude) {
      this.getRecords();
    }

    this.map.setMaxBounds(this.bounds);
    this.map.setZoom(this.settings.zoom);

    setTimeout(() => this.map.invalidateSize(), 100);
  }

  /*  Create the map with all useful parameters
  */
  private drawMap(): void {
    const centerLong = this.settings.centerLong ? Number(this.settings.centerLong) : 0;
    const centerLat = this.settings.centerLat ? Number(this.settings.centerLat) : 0;

    this.map = L.map(this.mapId, { zoomControl: false }).setView([centerLat, centerLong], this.settings.zoom || 3);

    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map',
      noWrap: true,
      minZoom: 1,
    }).addTo(this.map);

    this.markersLayerGroup = L.featureGroup().addTo(this.map);
    this.markersLayerGroup.on('click', event => {
      this.selectedRecord = this.records.find(x => x.id === event.layer.options.recordId);
      this.popupMarker = L.popup({})
        .setLatLng([event.latlng.lat, event.latlng.lng])
        .setContent(JSON.stringify(this.selectedRecord.data))
        .addTo(this.map);

    });

    this.markersLayer = L.markerClusterGroup({
    }).addTo(this.markersLayerGroup);
  }

  /*  Load the data, using widget parameters.
  */
  private getRecords(): void {
    this.map.closePopup(this.popupMarker);
    this.popupMarker = null;
    this.records = [];
    this.markersLayer.clearLayers();
    this.selectedRecord = null;
    const myIcon = L.icon({
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png',
    });
    if (!this.settings.from || this.settings.from === 'resource') {
      this.apollo.watchQuery<GetResourceByIdQueryResponse>({
        query: GET_RESOURCE_BY_ID,
        variables: {
          id: this.settings.source
        }
      }).valueChanges.subscribe(res => {
        res.data.resource.records.map(x => this.drawMarkers(myIcon, x));
      });
    } else {
      this.apollo.watchQuery<GetFormByIdQueryResponse>({
        query: GET_FORM_BY_ID,
        variables: {
          id: this.settings.source
        }
      }).valueChanges.subscribe(res => {
        res.data.form.records.map(x => this.drawMarkers(myIcon, x));
      });
    }
  }

  /*  Draw markers on the map if the record has coordinates
  */
  private drawMarkers(icon: any, record: Record): void {
    const latitude = Number(record.data[this.settings.latitude]);
    const longitude = Number(record.data[this.settings.longitude]);
    if (!isNaN(latitude) && latitude >= -90 && latitude <= 90) {
      if (!isNaN(longitude) && longitude >= -180 && longitude <= 180) {
        this.records.push(record);
        const marker = L.marker(
          [
            latitude,
            longitude
          ],
          {
            icon,
            recordId: record.id
          });
        this.markersLayer.addLayer(marker);
      }
    }
  }
}
