import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';

@Component({
    selector: 'wave-help-dialog',
    template: `
    <md-card>
        <md-card-title>About</md-card-title>
        <md-card-subtitle>Contact Information</md-card-subtitle>
        <md-card-content>
            <ul>
                <li>Database Research Group of the University of Marburg</li>
                <li>Responsible: Prof. Dr. Bernhard Seeger</li>
                <li>
                    <a href="http://dbs.mathematik.uni-marburg.de">dbs.mathematik.uni-marburg.de</a>
                </li>
            </ul>
        </md-card-content>
    </md-card>
    <md-card>
        <md-card-title>User Account</md-card-title>
        <md-card-subtitle>Registration</md-card-subtitle>
        <md-card-content>
            <p>
                There is currently no online registration for VAT.
                If you would like to have an account, please send an E-Mail to
                <a href="mailto:mattig AT mathematik.uni-marburg.de">
                    mattig AT mathematik.uni-marburg.de
                </a>
            </p>
        </md-card-content>
    </md-card>
    <md-card>
        <md-card-title>Overview</md-card-title>
        <md-card-subtitle>Introduction to the user interface</md-card-subtitle>
        <md-card-content>
            <p>New users start with a new (empty) project.</p>
            <p>
                <img src="./manual/img/empty_start.png"
                alt="The start screen of a blank WAVE instance (not logged in)">
            </p>
            <p>
                The UI is build around the <em>central map</em> component, where spatio-temporal
                 data is displayed. The <em>top</em> component is the ribbon-like header. It
                 provides access to data, operators and other features grouped by functionality.
                 The layer list on the left side overlays the map and contains all visible data
                 layers (with legends). Layer specific information is provided by the
                 <em>bottom</em> component which currently features a data table and citations.
            </p>
            </md-card-content>
        </md-card>
        <md-card>
            <md-card-title>Ribbons</md-card-title>
            <md-card-subtitle>Start-ribbon</md-card-subtitle>
            <md-card-content>
            <p>The <strong>Start-ribbon</strong> contains the most frequently used operations:</p>
            <ul>
                <li>Layer specific functionality</li>
                <li>Zoom functionality for the map</li>
                <li>Data access</li>
                <li>Time selection / modification</li>
            </ul>
            <p>
                <img src="./manual/img/empty_start_top.png" alt="The Start-ribbon">
            </p>
            <hr>
            </md-card-content>
            <md-card-subtitle>Operators-ribbon</md-card-subtitle>
            <md-card-content>
            <p>
                The <strong>Operators-ribbon</strong> provides access to operators which allow to
                 process data/layers. Operators are grouped by domain e.g. &#39;Vector&#39; or
                 &#39;Raster&#39;.
            </p>
            <p>
                <img src="./manual/img/empty_operators_top.png" alt="The Operators-ribbon">
            </p>
            <hr>
            </md-card-content>
            <md-card-subtitle>Project-ribbon</md-card-subtitle>
            <md-card-content>
            <p>
            The <strong>&#39;Project&#39;-ribbon</strong> provides access to project storage and
             Settings. A <em>project</em> represents a working environment, consisting of all
             layers and plots.
            </p>
            <ul>
                <li>
                    The storage group allows to load (and save) projects. <em>All projects are
                     auto saved.</em>
                </li>
                <li>
                    The project configuration and the global lineage graph are available from
                     the project group.
                </li>
            </ul>
            <p>
                <img src="./manual/img/empty_project_top.png" alt="The Project-ribbon">
            </p>
        </md-card-content>
    </md-card>
    <md-card>
        <md-card-title>Data access</md-card-title>
        <md-card-content>
        <p>
            Data / layers are added using one of the options provided by the
            <em>Add Data</em> section of the <em>Start</em>-ribbon.
        </p>
        <p>
            <img src="./manual/img/empty_start_top_data.png"
            alt="The highlighted Data area of the Start-ribbon">
        </p>
        <ul>
            <li>
                The <strong>Repository</strong> provides access to environmental data (raster).
                 This includes the <em>SRTM</em> elevation data and the <em>worldclim</em> dataset.
            </li>
            <li>
                The <strong>Upload</strong> functionality will allow users to add their own
                <em>private</em> data to the VAT System.
            </li>
            <li>
                The <strong>GFBio search</strong> will provide access to (the results / baskets of)
                the GFBio search.
            </li>
        </ul>
        </md-card-content>
        <md-card-subtitle>The (environmental data) Repository</md-card-subtitle>
        <md-card-content>
        <p>
            Combining occurrences or other vector data with large environmental (raster) datasets
             is one of the features of the VAT System. The <em>repository</em> contains all
             environmental datasets available on the current VAT instance.
        </p>
        <p>
            <img src="./manual/img/repository.png" alt="The Repository">
        </p>
        <p>
            Each dataset can contain multiple channels (e.g. <em>WorldClim</em>). Selecting a
             channel will add it to the map. Some layers have a toggle button to switch between
             units (e.g. <em>Meteosat 2nd Generation</em>). Such layers are available as the raw
              / original values and a more user friendly representation as actual physical value.
        </p>
        <p>The search field at the top allows to search within the repository.</p>
        <hr>
        </md-card-content>
        <md-card-subtitle>Occurences</md-card-subtitle>
        <md-card-content>
        <p>
            The occurences button provides access to data from GBIF and IUCN.
            First a scientific name must be specified:
        </p>
        <p>
            <img src="./manual/img/gbif_empty.png" alt="empty GBIF + IUCN Loader">
        </p>
        <p>
            The loader will auto-complete scientific names. When a name is selected a lookup
            can be executed to find matching datasets.
        </p>
        <p>
            <img src="./manual/img/gbif_name.png" alt="empty GBIF + IUCN Loader">
        </p>
        <p>
            The last step is to select the datasets which should be added to the map.
        </p>
        <p>
            <img src="./manual/img/gbif_select.png" alt="empty GBIF + IUCN Loader">
        </p>
    </md-card-content>
</md-card>
<md-card>
    <md-card-title>Operators</md-card-title>
    <md-card-content>
    <p>
        Each operator availabe in the operators-tab will show a dialog to select
         inputs and set / change parameters. Executing an operator will create a new layer
         containing the results.
    </p>
    <p>
        <img src="./manual/img/empty_operators_top.png"
        alt="The operators-ribbon">
    </p>
    </md-card-content>
    <md-card-subtitle>Vector > Raster Value Extraction</md-card-subtitle>
    <md-card-content>
    <p>
        This operator combines points and raster data. It requires a (vector) point and
        at least one raster layer as input. For each point coordinate the value of the input
        raster layers is extracted and added as attribute.
    </p>
    <hr>
    </md-card-content>
    <md-card-subtitle>Vector > Numeric Attribute Filter</md-card-subtitle>
        <md-card-content>
        <p>
            This operator allows to filter vectors by numeric attributes (e.g. created by the
            Raster Value Extraction Operator). After selecting a numeric attributes of a layer
            it displayes a histogram whith sliders to select the filter range.
            The resulting layer will contain all attributes of the input layer.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>Vector > Point In Polygon Filter </md-card-subtitle>
        <md-card-content>
        <p>
            This operator allows to filter points (vector) by polygons. The operator
            executes a "contains" operation and returns all points included in the
            selected polygon layer.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>Raster > Expression </md-card-subtitle>
        <md-card-content>
        <p>
            This operator executes an expression using multiple input raster layers.
            The syntax of the expression follows  the "C" programming language. Inputs
            are enumerated as characters "A, B, C, ....".
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>Plots > Histogram </md-card-subtitle>
        <md-card-content>
        <p>
            This operator creates a histogram for a numerical atribute of a vector layer.
            The output is added to the plot list.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>Misc > R Script </md-card-subtitle>
        <md-card-content>
        <p>
            This operator allows to execute R-Scripts within the VAT system. The input layers
            are accessable via the TODO function. A user must select the correct result type.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > Radiance Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator transforms a raw SEVIRI layer into radiances.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > Reflectance Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator transforms radiances into reflectances. Users can select if a solar
            angle correction should be included.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > Solarangle Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator calculates the solar angle for each pixel of a MSG raster.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > Temperature Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator transforms raw SEVIRI data into blackbody temperatures.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > Pansharp Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator uses the SEVIRI HRV channel to interpolate channels 1-11
            to the resultution of the HRV channel.
            This operator only works for daytime.
        </p>
        <hr>
    </md-card-content>
    <md-card-subtitle>MSG > CO2 Correction Operator </md-card-subtitle>
        <md-card-content>
        <p>
            This operator preforms a CO2 correction for SEVIRI channel 4.
        </p>
        <hr>
    </md-card-content>
</md-card>
<md-card>
    <md-card-title>Data Table / Citation</md-card-title>
    <md-card-subtitle>Data Table</md-card-subtitle>
    <md-card-content>
    <p>
        The <strong>Data Table</strong> displays the attributes of vector layers and
        informations about raster layers. It supports bi-directional selection connected
        with the map.
    </p>
    <p>
        <img src="./manual/img/bottom_table.png" alt="The Data Table">
    </p>
    <hr>
    </md-card-content>
    <md-card-subtitle>Citation</md-card-subtitle>
    <md-card-content>
    <p>
        The <strong>Citation</strong> area contains the citation for (almost) all
        datasets used to create a layer. Additionaly the license and a link to the
        URI of the original dataset is included.
    </p>
    <p>
        <img src="./manual/img/bottom_citations.png" alt="Citation list">
    </p>
    <hr>
    </md-card-content>
</md-card>
    `,
    styles: [`

    `],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialogComponent implements OnInit {
    ngOnInit() {
        // this.dialog.setTitle('Help');
    }
}
