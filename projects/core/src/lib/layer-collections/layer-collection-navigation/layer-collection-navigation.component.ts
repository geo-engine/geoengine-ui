import {Component, ViewChild, ElementRef, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef} from '@angular/core';
import {LayerCollectionItemDict, LayerCollectionListingDict, ProviderLayerCollectionIdDict, UUID} from '../../backend/backend.model';
import {MatInput} from '@angular/material/input';
import {LayerCollection, LayersApi, SearchCapabilities, SearchType, SearchTypes} from '@geoengine/openapi-client';
import {UserService} from '../../users/user.service';
import {firstValueFrom} from 'rxjs';

/**
 * TODO:
 *  - search on pressing enter, escape to abort
 *  - settings for search
 *  - TODO: loading animation
 */

@Component({
    selector: 'geoengine-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent implements OnInit {
    @Input({required: true}) rootCollectionItem!: LayerCollectionListingDict;

    collections: Array<LayerCollectionItemDict> = [];
    allTrails: Array<Array<LayerCollectionItemDict>> = [];
    displayedTrail: Array<LayerCollectionItemDict> = [];

    selectedCollection = -1;

    selectedId?: ProviderLayerCollectionIdDict;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @ViewChild('scrollElement', {read: ElementRef}) public scrollElement!: ElementRef<any>;

    searchCapabilities: SearchCapabilities = NO_SEARCH_CAPABILITIES;
    searchSettings: SearchSettings = {
        searchType: SearchType.Fulltext,
        filter: undefined,
    };
    isSearching = false;
    autocompleteResults: Array<string> = [];
    searchString = '';
    protected searchCapabilitiesProviderId: UUID = '';
    protected autocompleteAbortController?: AbortController;
    protected searchAbortController?: AbortController;

    constructor(
        protected readonly userService: UserService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.updateListView(undefined);
    }

    get title(): string {
        if (!this.rootCollectionItem) {
            return 'Layer Collection';
        }

        return this.rootCollectionItem.name;
    }

    scrollToRight(): void {
        setTimeout(() => {
            // wait until breadcrumbs are re-rendered before scrolling
            this.scrollElement.nativeElement.scrollLeft += this.scrollElement.nativeElement.scrollWidth;
        }, 0);
    }

    selectCollection(id: LayerCollectionItemDict): void {
        this.collections = this.collections.splice(0, this.displayedTrail.length);
        this.collections.push(id);
        this.selectedCollection += 1;

        // Create a new trail, append it to the collection and display it
        const clone = this.collections.map((x) => Object.assign({}, x));
        this.allTrails = this.allTrails.slice(0, this.selectedCollection);
        this.allTrails.push(clone);
        this.displayedTrail = this.allTrails[this.selectedCollection];

        this.scrollToRight();

        // TODO: update search capabilities if necessary

        this.updateListView(id);
    }

    selectListener(): (selection: LayerCollectionItemDict) => void {
        // return this.selectCollection.bind(this);
        return (selection: LayerCollectionItemDict) => this.selectCollection(selection);
    }

    back(): void {
        if (this.selectedCollection > 0) {
            this.selectedCollection -= 1;
            this.updateLayerView();
        } else if (this.selectedCollection === 0) {
            this.displayedTrail = [];
            this.showRoot();
            this.selectedCollection = -1;
        }
    }

    forward(): void {
        if (this.selectedCollection < this.allTrails.length - 1) {
            this.selectedCollection += 1;
            this.updateLayerView();
            this.scrollToRight();
        }
    }

    updateLayerView(): void {
        const currentTrail = this.allTrails[this.selectedCollection];
        this.displayedTrail = currentTrail;
        const lastId = currentTrail[currentTrail.length - 1];
        this.updateListView(lastId);
    }

    onBreadCrumbClick(index: number): void {
        // Creates and appends a new crumbtrail, then moves forward to it
        if (index === this.displayedTrail.length - 1) {
            return;
        }
        const newTrail = this.displayedTrail.map((x) => Object.assign({}, x)).slice(0, index + 1);
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    navigateToRoot(): void {
        if (this.selectedCollection === -1) {
            return;
        }
        const newTrail: Array<LayerCollectionItemDict> = [];
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    showRoot(): void {
        this.updateListView(undefined);
    }

    get hasSearchCapabilities(): boolean {
        const searchTypes = this.searchCapabilities.searchTypes;
        for (const searchType in searchTypes) {
            if (this.searchCapabilities.searchTypes[searchType as keyof SearchTypes]) {
                return true;
            }
        }

        return false;
    }

    toggleSearch(): void {
        if (this.isSearching && this.searchString) {
            this.search(this.searchString);
        }

        this.isSearching = !this.isSearching;
        this.changeDetectorRef.markForCheck();
    }

    // Focus the search field when it is shown
    @ViewChild('searchInput', {read: MatInput})
    set searchInput(searchInput: MatInput | undefined) {
        searchInput?.focus();
    }

    async triggerAutocomplete(searchString: string): Promise<void> {
        this.autocompleteAbortController?.abort();
        this.autocompleteAbortController = new AbortController();

        const collection = this.selectedId ?? this.rootCollectionItem.id;

        const session = await firstValueFrom(this.userService.getSessionOnce());

        const results = await new LayersApi(session.apiConfiguration)
            .autocompleteHandler(
                {
                    provider: collection.providerId,
                    collection: collection.collectionId,
                    searchType: this.searchSettings.searchType,
                    searchString,
                    limit: 10,
                    offset: 0,
                },
                {signal: this.autocompleteAbortController.signal},
            )
            // on error or abort, just return undefeind
            .catch(() => undefined);

        if (results === undefined) {
            return; // result was aborted and become invalid
        }

        this.autocompleteResults = results;

        this.changeDetectorRef.markForCheck();
    }

    async search(searchString: string): Promise<void> {
        console.log('searching for', searchString);

        this.searchAbortController?.abort();
        this.searchAbortController = new AbortController();

        const collection = this.selectedId ?? this.rootCollectionItem.id;

        const session = await firstValueFrom(this.userService.getSessionOnce());

        const resultCollection = await new LayersApi(session.apiConfiguration)
            .searchHandler(
                {
                    provider: collection.providerId,
                    collection: collection.collectionId,
                    searchType: this.searchSettings.searchType,
                    searchString,
                    limit: 10,
                    offset: 0,
                },
                {signal: this.searchAbortController.signal},
            )
            // on error or abort, just return undefeind
            .catch(() => undefined);

        if (resultCollection === undefined) {
            return; // result was aborted and become invalid
        }

        // this.selectCollection(resultCollection);

        console.log('got results', resultCollection);
    }

    private updateListView(id?: LayerCollectionItemDict): void {
        if (!id) {
            id = this.rootCollectionItem;
        }

        const providerLayer = id?.id as ProviderLayerCollectionIdDict;

        this.selectedId = providerLayer;

        this.updateSearchCapabilities(id);
    }

    private async updateSearchCapabilities(layerCollection: LayerCollectionItemDict): Promise<void> {
        const provider = layerCollection.id.providerId;
        if (this.searchCapabilitiesProviderId === provider) {
            return; // same provider, no need to re-query
        }

        const session = await firstValueFrom(this.userService.getSessionOnce());

        if (!session) {
            return;
        }

        this.searchCapabilities = await new LayersApi(session.apiConfiguration).searchCapabilitiesHandler({
            provider,
        });
        this.searchCapabilitiesProviderId = provider;

        // set some default settings
        this.searchSettings = {
            searchType: SearchType.Fulltext,
            filter: undefined,
        };
        // fulltext is the default, but if it is not supported, use the first supported search type
        if (!this.searchCapabilities.searchTypes.fulltext) {
            const searchTypes = this.searchCapabilities.searchTypes;
            for (const searchType in searchTypes) {
                if (this.searchCapabilities.searchTypes[searchType as keyof SearchTypes]) {
                    this.searchSettings.searchType = searchType as SearchType;
                    break;
                }
            }
        }

        this.changeDetectorRef.markForCheck();
    }
}

interface SearchSettings {
    searchType: SearchType;
    filter?: string;
}

const NO_SEARCH_CAPABILITIES: SearchCapabilities = {
    autocomplete: false,
    searchTypes: {
        fulltext: false,
        prefix: false,
    },
    filters: [],
};
