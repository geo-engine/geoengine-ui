import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AppConfig} from '../app-config.service';
import {BackendService, Config, Dataset, DatasetDict, DatasetService, ProjectService, UserService, UUID} from 'wave-core';
import {from, Observable, of} from 'rxjs';
import {filter, mergeMap, toArray} from 'rxjs/operators';
import {Basket, BasketEntry} from './basket-model';

@Injectable()
export class BasketService {
    readonly baseUrl = `${this.config.API_URL}/gfbio/basket`;

    constructor(
        @Inject(Config) readonly config: AppConfig,
        private readonly userService: UserService,
        private readonly datasetService: DatasetService,
        private readonly projectService: ProjectService,
        private readonly http: HttpClient,
    ) {}

    handleBasket(id: UUID): Observable<Basket> {
        return this.userService.getSessionTokenForRequest().pipe(
            mergeMap((sessionId) => this.loadBasket(id, sessionId)),
            mergeMap((basket) => this.processBasketEntries(basket)),
        );
    }

    private loadBasket(basketId: UUID, sessionId: UUID): Observable<Basket> {
        return this.http.get<Basket>(this.baseUrl + '/' + basketId, {
            headers: BackendService.authorizationHeader(sessionId),
        });
    }

    private processBasketEntries(basket: Basket): Observable<Basket> {
        const src: Observable<BasketEntry> = from(basket.content);
        return src.pipe(
            filter((entry) => entry.status === 'ok'),
            mergeMap((entry) => this.addLayer(entry)),
            toArray(),
            mergeMap(() => of(basket)),
        );
    }

    private addLayer(entry: BasketEntry): Observable<void> {
        const dict: DatasetDict = {
            id: entry.datasetId,
            name: entry.title,
            description: 'Description',
            sourceOperator: entry.sourceOperator,
            resultDescriptor: entry.resultDescriptor,
            attributeFilters: entry.attributeFilters,
        };
        return this.datasetService.addDatasetToMap(Dataset.fromDict(dict));
    }
}
