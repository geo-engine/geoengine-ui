import {
    Component,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy,
    Input,
    OnInit,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges,
    OnDestroy,
    HostListener,
} from '@angular/core';
import {LayerCollectionListingDict, ProviderLayerCollectionIdDict, UUID} from '../../backend/backend.model';
import {MatInput} from '@angular/material/input';
import {SearchCapabilities, SearchType, SearchTypes} from '@geoengine/openapi-client';
import {UserService} from '../../users/user.service';
import {BehaviorSubject, Observable, debounceTime, distinctUntilChanged, switchMap} from 'rxjs';
import {LayerCollectionItem, LayerCollectionItemOrSearch, LayerCollectionSearch} from '../layer-collection.model';
import {Config} from '../../config.service';
import {LayerCollectionService} from '../layer-collection.service';

@Component({
    selector: 'geoengine-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent implements OnInit, OnChanges, OnDestroy {
    @Input({required: true}) rootCollectionItem!: LayerCollectionListingDict;

    @ViewChild('scrollElement', {read: ElementRef}) public scrollElement!: ElementRef<HTMLDivElement>;

    breadcrumbs: BreadcrumbNavigation = this.createBreadcrumbNavigation();
    search: Search = this.createSearch();

    selectedCollection?: LayerCollectionItemOrSearch;

    constructor(
        protected readonly userService: UserService,
        protected readonly config: Config,
        protected readonly layerCollectionService: LayerCollectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.updateListView(undefined);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rootCollectionItem) {
            this.breadcrumbs = this.createBreadcrumbNavigation();
            this.search.onDestroy();
            this.search = this.createSearch();
            this.updateListView(undefined);
        }
    }

    ngOnDestroy(): void {
        this.search.onDestroy();
    }

    /** Cast method for the template */
    layerCollectionItem(item: LayerCollectionItemOrSearch): LayerCollectionItem {
        if (item.type === 'collection') {
            return item as LayerCollectionItem;
        }

        throw Error('not a collection item');
    }

    /** Cast method for the template */
    layerCollectionSearch(item: LayerCollectionItemOrSearch): LayerCollectionSearch {
        if (item.type === 'search') {
            return item as LayerCollectionSearch;
        }

        throw Error('not a search item');
    }

    // Focus the search field when it is shown
    @ViewChild('searchInput', {read: MatInput})
    set searchInput(searchInput: MatInput | undefined) {
        searchInput?.focus();
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(eventData: KeyboardEvent): void {
        if (!this.search.hasSearchCapabilities) {
            return;
        }

        if (!this.search.isSearching && eventData.key === 'f' && eventData.ctrlKey) {
            this.search.toggleSearch();
            eventData.preventDefault();
        } else if (this.search.isSearching && eventData.key === 'Escape') {
            // Note: for some reason, this event is rarely catched.
            this.search.exitSearch();
            eventData.preventDefault();
        } else if (this.search.isSearching && eventData.key === 'Enter') {
            this.search.toggleSearch();
            eventData.preventDefault();
        }
    }

    get providerLayerCollectionIdOrSearch(): ProviderLayerCollectionIdDict | LayerCollectionSearch | undefined {
        if (this.selectedCollection && this.selectedCollection.type === 'collection') {
            return this.selectedCollection.id;
        } else if (this.selectedCollection && this.selectedCollection.type === 'search') {
            return this.selectedCollection as LayerCollectionSearch;
        } else {
            return undefined;
        }
    }

    protected createBreadcrumbNavigation(): BreadcrumbNavigation {
        return new BreadcrumbNavigation(
            (id) => this.updateListView(id),
            () => this.scrollToRight(),
        );
    }

    protected createSearch(): Search {
        return new Search({
            layerCollectionService: this.layerCollectionService,
            selectedCollection: () => this.selectedCollection?.id ?? this.rootCollectionItem.id,
            searchResult: (searchResult): void => {
                this.breadcrumbs.selectCollection(searchResult);
            },
            debounceTimeMs: this.config.DELAYS.DEBOUNCE,
            maxAutocompleteResults: 10,
        });
    }

    protected scrollToRight(): void {
        setTimeout(() => {
            // wait until breadcrumbs are re-rendered before scrolling
            this.scrollElement.nativeElement.scrollLeft += this.scrollElement.nativeElement.scrollWidth;
        }, 0);
    }

    protected updateListView(id?: LayerCollectionItemOrSearch): void {
        this.selectedCollection = id ?? this.rootCollectionItem;

        this.search.updateSearchCapabilities(this.selectedCollection.id).then(() => {
            this.changeDetectorRef.markForCheck();
        });
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

class Search {
    searchCapabilities: SearchCapabilities = NO_SEARCH_CAPABILITIES;
    searchSettings: SearchSettings = {
        searchType: SearchType.Fulltext,
        filter: undefined,
    };
    isSearching = false;

    searchString = new BehaviorSubject<string>('');
    autocompleteResults: Observable<Array<string>>;

    protected searchCapabilitiesProviderId: UUID = '';
    protected autocompleteAbortController?: AbortController;

    protected layerCollectionService: LayerCollectionService;
    protected selectedCollection: () => ProviderLayerCollectionIdDict;
    protected searchResult: (_: LayerCollectionSearch) => void;
    protected maxAutocompleteResults: number;

    constructor({
        layerCollectionService,
        selectedCollection,
        searchResult,
        debounceTimeMs,
        maxAutocompleteResults,
    }: {
        readonly layerCollectionService: LayerCollectionService;
        readonly selectedCollection: () => ProviderLayerCollectionIdDict;
        readonly searchResult: (_: LayerCollectionSearch) => void;
        readonly debounceTimeMs: number;
        readonly maxAutocompleteResults: number;
    }) {
        this.layerCollectionService = layerCollectionService;
        this.selectedCollection = selectedCollection;
        this.searchResult = searchResult;
        this.maxAutocompleteResults = maxAutocompleteResults;

        this.autocompleteResults = this.searchString.pipe(
            debounceTime(debounceTimeMs),
            distinctUntilChanged(),
            switchMap((searchString) => this.computeAutocompleteResults(searchString)),
        );
    }

    onDestroy(): void {
        this.searchString.complete();
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
        if (this.isSearching && this.searchString.value) {
            this.search(this.searchString.value);
        }

        this.isSearching = !this.isSearching;
    }

    exitSearch(): void {
        this.searchString.next('');
        this.isSearching = false;
    }

    async computeAutocompleteResults(searchString: string): Promise<Array<string>> {
        if (searchString.length === 0 || this.searchCapabilities.autocomplete === false) {
            return [];
        }

        this.searchString.next(searchString);

        this.autocompleteAbortController?.abort();
        this.autocompleteAbortController = new AbortController();

        const collection = this.selectedCollection();

        return await this.layerCollectionService.autocompleteSearch(
            {
                provider: collection.providerId,
                collection: collection.collectionId,
                searchType: this.searchSettings.searchType,
                searchString,
                limit: this.maxAutocompleteResults,
                offset: 0,
            },
            {abortController: this.autocompleteAbortController},
        );
    }

    async search(searchString: string): Promise<void> {
        const collection = this.selectedCollection();

        this.searchResult({
            type: 'search',
            id: collection,
            searchType: this.searchSettings.searchType,
            searchString,
            offset: 0,
        } as LayerCollectionSearch);
    }

    async updateSearchCapabilities(layerCollection: ProviderLayerCollectionIdDict): Promise<void> {
        const providerId = layerCollection.providerId;
        if (this.searchCapabilitiesProviderId === providerId) {
            return; // same provider, no need to re-query
        }

        this.searchCapabilities = (await this.layerCollectionService.capabilities(providerId)).search;
        this.searchCapabilitiesProviderId = providerId;

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
    }
}

/**
 * Encapsulates the logic for navigating through the breadcrumb trail.
 */
class BreadcrumbNavigation {
    activeTrail: Array<LayerCollectionItemOrSearch> = [];

    protected collections: Array<LayerCollectionItemOrSearch> = [];
    protected allTrails: Array<Array<LayerCollectionItemOrSearch>> = [];

    protected selectedCollection = -1;

    constructor(
        protected readonly updateListView: (_: LayerCollectionItemOrSearch | undefined) => void,
        protected readonly scrollToRight: () => void,
    ) {}

    selectCollection(id: LayerCollectionItemOrSearch): void {
        if (this.activeTrail[this.activeTrail.length - 1]?.type === 'search' && id.type === 'search') {
            // SPECIAL CASE:
            // if the current item is a search and we get a search, swap instead of append

            this.collections[this.collections.length - 1] = id;
            this.activeTrail[this.activeTrail.length - 1] = id;
        } else {
            // DEFAULT CASE: append

            this.collections = this.collections.splice(0, this.activeTrail.length);
            this.collections.push(id);
            this.selectedCollection += 1;

            // Create a new trail, append it to the collection and display it
            const clone = this.collections.map((x) => Object.assign({}, x));
            this.allTrails = this.allTrails.slice(0, this.selectedCollection);
            this.allTrails.push(clone);
            this.activeTrail = this.allTrails[this.selectedCollection];
        }

        this.scrollToRight();

        this.updateListView(id);
    }

    get isBackDisabled(): boolean {
        return this.selectedCollection < 0;
    }

    get isForwardDisabled(): boolean {
        return this.selectedCollection >= this.allTrails.length - 1;
    }

    back(): void {
        if (this.selectedCollection > 0) {
            this.selectedCollection -= 1;
            this.updateTrailAndCollection();
        } else if (this.selectedCollection === 0) {
            this.activeTrail = [];
            this.updateListView(undefined);
            this.selectedCollection = -1;
        }
    }

    forward(): void {
        if (this.selectedCollection < this.allTrails.length - 1) {
            this.selectedCollection += 1;
            this.updateTrailAndCollection();
            this.scrollToRight();
        }
    }

    onBreadCrumbClick(index: number): void {
        // Creates and appends a new crumbtrail, then moves forward to it
        if (index === this.activeTrail.length - 1) {
            return;
        }
        const newTrail = this.activeTrail.map((x) => Object.assign({}, x)).slice(0, index + 1);
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    navigateToRoot(): void {
        if (this.selectedCollection === -1) {
            return;
        }
        const newTrail: Array<LayerCollectionListingDict> = [];
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    protected updateTrailAndCollection(): void {
        const currentTrail = this.allTrails[this.selectedCollection];
        this.activeTrail = currentTrail;
        const lastId = currentTrail[currentTrail.length - 1];
        this.updateListView(lastId);
    }
}
