import {Pipe, PipeTransform} from '@angular/core';
import {IBasketResult, IBasketAbcdResult, IBasketGroupedAbcdResult} from './gfbio-basket.model';

@Pipe({name: 'waveBasketResultGroupByDatasetPipe'})
export class BasketResultGroupByDatasetPipe implements PipeTransform {
    static regex = /(.*),\s*a\s*(.*)?record\s*of\s*the\s*"(.*)"\s*dataset\s*\[ID:\s*(.*)\]\s*/;


    transform(results: Array<IBasketResult>): Array<IBasketResult> {
        const array: Array<IBasketResult> = [];
        results.forEach((result) => {
            const entry = array.find((b) => b.dataLink === result.dataLink);

            if (result.type === 'abcd') {
                const abcd = result as IBasketAbcdResult;

                const unit_type_title_id = BasketResultGroupByDatasetPipe.regex.exec(abcd.title);
                const title = (unit_type_title_id && unit_type_title_id[3]) ? unit_type_title_id[3] : abcd.title;
                // console.log('abcd', abcd, unit_type_title_id);
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
                    array.push(grouped);
                } else {
                    if (unit) {
                        const grouped = entry as IBasketGroupedAbcdResult;
                        grouped.units.push(unit);
                    }
                }
            } else if (!entry) {
                array.push(result);
            }
        });
        return array;
    }
}
