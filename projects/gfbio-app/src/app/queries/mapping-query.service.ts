import {Inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import moment from 'moment/src/moment';

import {MappingRequestParameters, MappingQueryService, UserService, Config} from 'wave-core';

import {
    Basket,
    BasketResult,
    BasketsOverview,
    IBasketAbcdResult,
    IBasketGroupedAbcdResult
} from '../operators/dialogs/baskets/gfbio-basket.model';
import {GFBioUserService} from '../users/user.service';
import {AppConfig} from '../app-config.service';

@Injectable()
export class GFBioMappingQueryService extends MappingQueryService {

    constructor(@Inject(Config) protected readonly config: AppConfig,
                protected readonly http: HttpClient,
                @Inject(UserService) protected readonly userService: GFBioUserService) {
        super(config, http, userService);
    }

    getGFBioBaskets(config: {
        offset: number,
        limit: number,
    }): Observable<BasketsOverview> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'baskets',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                offset: config.offset,
                limit: config.limit,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        interface BasketsOverviewRaw {
            baskets: Array<{
                basketId: number,
                query: string,
                timestamp: string,
            }>;
            totalNumberOfBaskets: number;
        }

        return this.http.get<BasketsOverviewRaw>(queryUrl).pipe(
            map((basketsOverview: BasketsOverviewRaw) => {
                return {
                    baskets: basketsOverview.baskets.map(basket => {
                        return {
                            basketId: basket.basketId,
                            query: basket.query,
                            timestamp: moment(basket.timestamp, 'YYYY-MM-DD HH:mm:ss.S'),
                        };
                    }),
                    totalNumberOfBaskets: basketsOverview.totalNumberOfBaskets,
                };
            }),
        );
    }

    getGFBioBasket(id: number): Observable<Basket> {
        const parameters = new MappingRequestParameters({
            service: 'gfbio',
            request: 'basket',
            sessionToken: this.userService.getSession().sessionToken,
            parameters: {
                id,
            },
        });

        const queryUrl = this.config.MAPPING_URL + '?' + parameters.toMessageBody();

        return this.http
            .get<Basket>(queryUrl).pipe(
                map((basket: Basket) => {
                    const regex = /(.*),\s*a\s*(.*)?record\s*of\s*the\s*"(.*)"\s*dataset\s*\[ID:\s*(.*)]\s*/;

                    const basketResults: Array<BasketResult> = [];
                    basket.results.forEach(result => {
                        const entry = basketResults.find((b) => b.dataLink === result.dataLink);

                        if (result.type === 'abcd') {
                            const abcd = result as IBasketAbcdResult;

                            const unit_type_title_id = regex.exec(abcd.title);
                            const title = (unit_type_title_id && unit_type_title_id[3]) ? unit_type_title_id[3] : abcd.title;
                            const unit = (unit_type_title_id && unit_type_title_id[4]) ? {
                                unitId: unit_type_title_id[4],
                                prefix: unit_type_title_id[1],
                                type: unit_type_title_id[2],
                                metadataLink: abcd.metadataLink
                            } : undefined;

                            if (!entry) {
                                const metadataLink = abcd.metadataLink;
                                const grouped: IBasketGroupedAbcdResult = {
                                    title,
                                    dataLink: abcd.dataLink,
                                    authors: abcd.authors,
                                    available: abcd.available,
                                    dataCenter: abcd.dataCenter,
                                    metadataLink,
                                    units: (unit) ? [unit] : [],
                                    type: 'abcd_grouped',
                                    resultType: 'points',
                                };
                                basketResults.push(grouped);
                            } else {
                                if (unit) {
                                    const grouped = entry as IBasketGroupedAbcdResult;
                                    grouped.units.push(unit);
                                }
                            }
                        } else if (!entry) {
                            basketResults.push(result);
                        }
                    });

                    return {
                        query: basket.query,
                        results: basketResults,
                        timestamp: moment(basket.timestamp, 'MM-DD-YYYY HH:mm:ss.SSS'),
                    };
                }));
    }
}
