import {Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {ProjectService} from '../project.service';
import {SpatialReferenceService} from '../../spatial-references/spatial-reference.service';
import {Subscription} from 'rxjs/internal/Subscription';
import {NamedSpatialReference, SpatialReference} from '@geoengine/common';

@Component({
    selector: 'geoengine-change-projection',
    templateUrl: './change-spatial-reference.component.html',
    styleUrls: ['./change-spatial-reference.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ChangeSpatialReferenceComponent implements OnDestroy {
    readonly SpatialReferences: Array<NamedSpatialReference>;

    spatialReference?: NamedSpatialReference;

    private subscription: Subscription;

    constructor(
        public projectService: ProjectService,
        protected spatialReferenceService: SpatialReferenceService,
        protected changeDetectorRef: ChangeDetectorRef,
    ) {
        this.SpatialReferences = this.spatialReferenceService.getSpatialReferences();
        this.subscription = this.projectService.getSpatialReferenceStream().subscribe((sref: SpatialReference) => {
            const index = this.SpatialReferences.findIndex((v) => v.spatialReference.srsString === sref.srsString);

            if (index >= 0) {
                this.spatialReference = this.SpatialReferences[index];
            } else {
                this.spatialReference = undefined;
            }

            this.changeDetectorRef.markForCheck();
        });
    }

    setSpatialReference(sref: NamedSpatialReference): void {
        this.projectService.setSpatialReference(new SpatialReference(sref.spatialReference.srsString));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
