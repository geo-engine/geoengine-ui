import {Component, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {UUID} from '../../backend/backend.model';

@Component({
    selector: 'wave-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent {
    collections$ = new BehaviorSubject<Array<UUID | undefined>>([undefined]);
    activeCollection$ = new BehaviorSubject(0);

    constructor() {}

    selectCollection(index: number, collectionId: UUID): void {
        let collections = this.collections$.getValue();
        collections = collections.splice(0, index + 1);
        collections.push(collectionId);

        this.activeCollection$.next(index + 1);
        this.collections$.next(collections);
    }

    back(): void {
        const current = this.activeCollection$.getValue();
        if (current > 0) {
            this.activeCollection$.next(current - 1);
        }
    }

    forward(): void {
        const current = this.activeCollection$.getValue();
        const collections = this.collections$.getValue();
        if (current < collections.length - 1) {
            this.activeCollection$.next(current + 1);
        }
    }

    getCollectionCount(): number {
        return this.collections$.getValue().length;
    }
}
