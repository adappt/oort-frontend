import { gql } from 'apollo-angular';
import { Layer } from '../../../../../models/layer.model';

// === GET LAYERS ===
/** Graphql request for getting layers */
export const GET_LAYERS = gql`
  query GetLayers {
    layers {
      id
      name
    }
  }
`;

/** Model for GetLayersQueryResponse object */
export interface GetLayersQueryResponse {
  layers: Layer[];
}
