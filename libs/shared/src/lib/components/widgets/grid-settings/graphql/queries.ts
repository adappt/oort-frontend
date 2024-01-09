import { gql } from 'apollo-angular';

/** Graphql request for getting channels (optionally by an application id) */
export const GET_CHANNELS = gql`
  query getChannels($application: ID) {
    channels(application: $application) {
      id
      title
    }
  }
`;

/** Graphql request for getting the meta fields of a grid by form id */
export const GET_GRID_FORM_META = gql`
  query GetFormAsTemplate($id: ID!, $layoutIds: [ID], $first: Int) {
    form(id: $id) {
      id
      name
      queryName
      layouts(ids: $layoutIds, first: $first) {
        edges {
          node {
            id
            name
            createdAt
            query
            display
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

/** Graphql request for getting resource meta date for a grid */
export const GET_GRID_RESOURCE_META = gql`
  query GetGridResourceMeta(
    $resource: ID!
    $layoutIds: [ID]
    $firstLayouts: Int
    $aggregationIds: [ID]
    $firstAggregations: Int
    $formId: ID
  ) {
    resource(id: $resource) {
      id
      name
      queryName
      form(id: $formId) {
        id
        name
      }
      layouts(ids: $layoutIds, first: $firstLayouts) {
        edges {
          node {
            id
            name
            query
            createdAt
            display
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
      aggregations(ids: $aggregationIds, first: $firstAggregations) {
        edges {
          node {
            id
            name
            sourceFields
            pipeline
            createdAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

/** Graphql request for getting the related forms of a resource */
export const GET_RELATED_FORMS = gql`
  query GetGridResourceMeta($resource: ID!) {
    resource(id: $resource) {
      relatedForms {
        id
        name
        fields
        resource {
          id
          queryName
          name
          fields
        }
      }
    }
  }
`;

/** Graphql request for getting the related templates of a resource */
export const GET_RESOURCE_TEMPLATES = gql`
  query GetGridResourceMeta($resource: ID!) {
    resource(id: $resource) {
      forms {
        id
        name
      }
    }
  }
`;
