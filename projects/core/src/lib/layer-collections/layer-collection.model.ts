import {SearchType} from '@geoengine/openapi-client';
import {LayerCollectionListingDict, ProviderLayerCollectionIdDict} from '../backend/backend.model';

export interface LayerCollectionItemOrSearch {
    type: 'collection' | 'search';
    id: ProviderLayerCollectionIdDict;
}

// TODO: use model from OpenAPI client
export interface LayerCollectionItem extends LayerCollectionItemOrSearch, LayerCollectionListingDict {
    type: 'collection';
}

export interface LayerCollectionSearch extends LayerCollectionItemOrSearch {
    type: 'search';
    searchType: SearchType;
    searchString: string;
}
