import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import get from 'lodash/get';
import { MapLayerI } from './map-layers/map-layers.component';
import {
  MapControls,
  DefaultMapControls,
  MapConstructorSettings,
} from '../../ui/map/interfaces/map.interface';
import { Layer } from '../../../models/layer.model';
import {
  popupElement,
  popupElementType,
} from './map-layer/layer-popup/layer-popup.interface';
import { IconName } from '../../icon-picker/icon-picker.const';

type Nullable<T> = { [P in keyof T]: T[P] | null };

/** Angular Form Builder */
const fb = new FormBuilder();

/** Default map value */
const DEFAULT_MAP: Nullable<MapConstructorSettings> = {
  title: null,
  basemap: null,
  initialState: {
    viewpoint: {
      center: {
        latitude: 0,
        longitude: 0,
      },
      zoom: 2,
    },
  },
  layers: [],
  controls: DefaultMapControls,
  arcGisWebMap: null,
};

/**
 * Create layer form from value
 *
 * @param value layer value ( optional )
 * @returns new form group
 */
export const createLayerForm = (value?: Layer) =>
  fb.group({
    // Layer properties
    id: [get(value, 'id', null)],
    title: [get(value, 'title', null), Validators.required],
    visibility: [get(value, 'visibility', true), Validators.required],
    opacity: [get(value, 'opacity', 1), Validators.required],
    layerDefinition: createLayerDefinitionForm(get(value, 'layerDefinition')),
    // Layer style
    // style: fb.group({
    //   color: [get(value, 'style.color', '#0090d1')],
    //   size: [get(value, 'style.size', 24)],
    //   icon: new FormControl<MapLayerI['style']['icon']>(
    //     get(value, 'style.icon', 'leaflet_default')
    //   ),
    // }),
    popupInfo: createPopupInfoForm(get(value, 'popupInfo')),
    // Layer datasource
    datasource: fb.group({
      origin: new FormControl<MapLayerI['datasource']['origin']>(
        get(value, 'datasource.source', 'resource'),
        Validators.required
      ),
      resource: [get(value, 'datasource.resource', null)],
      layout: [get(value, 'datasource.layout', null)],
      aggregation: [get(value, 'datasource.aggregation', null)],
      refData: [get(value, 'datasource.refData', null)],
    }),
  });

/**
 * Create layer definition form group
 *
 * @param value layer definition
 * @returns layer definition form group
 */
const createLayerDefinitionForm = (value?: any): FormGroup => {
  const formGroup = fb.group({
    minZoom: [get(value, 'minZoom', 2), Validators.required],
    maxZoom: [get(value, 'maxZoom', 18), Validators.required],
    drawingInfo: createLayerDrawingInfoForm(get(value, 'drawingInfo')),
    featureReduction: createLayerFeatureReductionForm(
      get(value, 'featureReduction')
    ),
  });
  const rendererType = formGroup.value.drawingInfo.renderer.type;
  // Add more conditions there to disabled aggregation
  if (rendererType === 'heatmap') {
    formGroup.get('featureReduction')?.disable();
  }
  formGroup.get('drawingInfo.renderer.type')?.valueChanges.subscribe((type) => {
    if (type === 'heatmap') {
      formGroup.get('featureReduction')?.disable();
    } else {
      formGroup.get('featureReduction')?.enable();
    }
  });
  return formGroup;
};

/**
 * Create layer feature reduction form
 *
 * @param value layer feature reduction
 * @returns layer feature reduction form
 */
export const createLayerFeatureReductionForm = (value: any): FormGroup =>
  fb.group({
    type: [get(value, 'type')],
  });

/**
 * Create layer drawing info form
 *
 * @param value layer drawing info
 * @returns layer drawing info form
 */
export const createLayerDrawingInfoForm = (value: any): FormGroup =>
  fb.group({
    renderer: fb.group({
      type: [get(value, 'type', 'simple'), Validators.required],
      symbol: fb.group({
        color: [get(value, 'symbol.color', ''), Validators.required],
        type: 'fa',
        size: [get(value, 'symbol.size', 24)],
        style: new FormControl<IconName>(
          get(value, 'symbol.style', 'leaflet_default')
        ),
      }),
    }),
  });

/**
 * Create popup info form group
 *
 * @param value popup info value
 * @returns popup info form group
 */
export const createPopupInfoForm = (value: any): FormGroup =>
  fb.group({
    title: get(value, 'title', ''),
    description: get(value, 'description', ''),
    popupElements: fb.array(
      get(value, 'popupElements', []).map((element: popupElement) =>
        createPopupElementForm(element)
      )
    ),
  });

/**
 * Create popup element form group
 *
 * @param value popup element value
 * @returns popup element form group
 */
export const createPopupElementForm = (value: popupElement): FormGroup => {
  switch (get(value, 'type', 'fields') as popupElementType) {
    case 'text': {
      return fb.group({
        type: 'text',
        text: get(value, 'text', ''),
      });
    }
    default:
    case 'fields': {
      return fb.group({
        type: 'fields',
        title: get(value, 'title', ''),
        description: get(value, 'description', ''),
      });
    }
  }
};

/**
 * Create layer cluster form from value
 *
 * @param value cluster value ( optional )
 * @returns new form group
 */
export const createClusterForm = (value?: any): FormGroup =>
  fb.group({
    overrideSymbol: [get(value, 'overrideSymbol', false), Validators.required],
    symbol: [get(value, 'symbol ', 'leaflet_default')],
    radius: [get(value, 'radius', 80), Validators.required],
    sizeRangeStart: [get(value, 'sizeRangeStart', 2), Validators.required],
    sizeRangeEnd: [get(value, 'sizeRangeEnd', 8)],
    fields: [get(value, 'fields', ''), Validators.required],
    label: [get(value, 'label', ''), Validators.required],
    popups: [get(value, 'popups', ''), Validators.required],
  });

export type LayerFormT = ReturnType<typeof createLayerForm>;

// === MAP ===

/**
 * Create map controls from value
 *
 * @param value map controls value ( optional )
 * @returns new form group
 */
export const createMapControlsForm = (value?: MapControls): FormGroup =>
  fb.group({
    timedimension: [get(value, 'timedimension', false)],
    download: [get(value, 'download', true)],
    legend: [get(value, 'legend', true)],
    measure: [get(value, 'measure', false)],
    layer: [get(value, 'layer', true)],
    search: [get(value, 'search', false)],
  });

/**
 * Create map form from value
 *
 * @param id widget id
 * @param value map settings ( optional )
 * @returns map form
 */
export const createMapWidgetFormGroup = (id: any, value?: any): FormGroup =>
  fb.group({
    id,
    title: [get(value, 'title', DEFAULT_MAP.title)],
    initialState: fb.group({
      viewpoint: fb.group({
        zoom: [
          get(
            value,
            'initialState.viewpoint.zoom',
            DEFAULT_MAP.initialState?.viewpoint.zoom
          ),
          [Validators.min(2), Validators.max(18)],
        ],
        center: fb.group({
          longitude: [
            get(
              value,
              'initialState.viewpoint.center.longitude',
              DEFAULT_MAP.initialState?.viewpoint.center.longitude
            ),
            [Validators.min(-180), Validators.max(180)],
          ],
          latitude: [
            get(
              value,
              'initialState.viewpoint.center.latitude',
              DEFAULT_MAP.initialState?.viewpoint.center.latitude
            ),
            [Validators.min(-90), Validators.max(90)],
          ],
        }),
      }),
    }),
    basemap: [get(value, 'basemap', DEFAULT_MAP.basemap)],
    // popupFields: [get(value, 'popupFields', DEFAULT_MAP.popupFields)],
    // onlineLayers: [get(value, 'onlineLayers', DEFAULT_MAP.onlineLayers)],
    layers: [get(value, 'layers', [])] as string[],
    controls: createMapControlsForm(
      get(value, 'controls', DEFAULT_MAP.controls)
    ),
    arcGisWebMap: [get(value, 'arcGisWebMap', DEFAULT_MAP.arcGisWebMap)],
  });
