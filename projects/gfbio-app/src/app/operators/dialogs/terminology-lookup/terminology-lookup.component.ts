import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {AfterViewInit, ChangeDetectionStrategy, Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {
    VectorLayer,
    AbstractVectorSymbology,
    Operator,
    ProjectService,
    WaveValidators,
    RandomColorService,
    DataTypes,
    ResultTypes,
} from 'wave-core';
import {TerminologyLookupType, TerminologyLookupOnNotResolvable, TerminologyLookupMatchType} from '../../types/terminology-lookup-type';

// TODO: replace with actual lookup
const TERMINOLOGIES: Array<{name: string; acronym: string; description: string; uri: string}> = [
    {
        name: 'Biological Collections Ontology',
        acronym: 'BCO',
        description:
            "The biological collection ontology includes consideration of the distinctions between individuals, organisms, voucher specimens, lots, and samples the relations between these entities, and processes governing the creation and use of 'samples'. Within scope as well are properties including collector, location, time, storage environment, containers, institution, and collection identifiers. ",
        uri: 'http://purl.obolibrary.org/obo/bco.owl',
    },
    {
        name: 'Flora Phenotype Ontology',
        acronym: 'FLOPO',
        description:
            'The Flora Phenotype Ontology is an ontology of phenotypes reported in Floras. The original version was developed at the pro-iBiosphere Hackathon in Leiden. This is the pre-classified version of the ontology; the original OWL file is at https://github.com/flora-phenotype-ontology/flopoontology/blob/master/ontology/flopo.owl The Flora Phenotype Ontology is generated from the Flora Malesiana, Flora Gabon, Flora of Central Africa, and a collection of Kews African Floras. Every class in the ontology has at least one taxon annotation. The (draft) taxon annotation are available at http://jagannath.pdn.cam.ac.uk/plant/flora/clean-rerun/',
        uri: 'http://purl.obolibrary.org/obo/flopo.owl',
    },
    {
        name: 'Phenotypic Quality Ontology',
        acronym: 'PATO',
        description:
            'Phenotypic qualities (properties). This ontology can be used in conjunction with other ontologies such as GO or anatomical ontologies to refer to phenotypes. Examples of qualities are red, ectopic, high temperature, fused, small, edematous and arrested.',
        uri: 'http://purl.obolibrary.org/obo/pato.owl',
    },
    {
        name: 'Chemical Entities of Biological Interest Ontology',
        acronym: 'CHEBI',
        description: 'A structured classification of chemical compounds of biological relevance.',
        uri: 'http://purl.obolibrary.org/obo/chebi/160/chebi.owl',
    },
    {
        name: 'RecordBasis',
        acronym: 'RECORDBASIS',
        description:
            "A controlled vocabulary (Terminology) 'BasisOfRecords' or 'RecordBasis' (DwC: “The specific nature of the data record.”). Based on GBIF/ DwC and BiNHum/ABCD.",
        uri: 'http://terminologies.gfbio.org/terms/RECORDBASIS',
    },
    {
        name: 'Bohlmann Ontology',
        acronym: 'BOHLMANN',
        description: 'An ontology listing the natural substances that occurr in the plant family of Compositae (Asteraceae).',
        uri: 'http://terminologies.gfbio.org/terms/BOHLMANN',
    },
    {
        name: 'Trichoptera Ontology',
        acronym: 'TRICHOPTERA',
        description: 'Working list: taxon names of the order Trichoptera (caddisflies; Insecta).',
        uri: 'http://terminologies.gfbio.org/terms/TRICHOPTERA/',
    },
    {
        name: 'Environment Ontology',
        acronym: 'ENVO',
        description:
            'Official PURL: http://purl.obolibrary.org/obo/envo.owl The most up-to-date information about ENVO is available here: http://www.obofoundry.org/ontology/envo.html EnvO is an OBO Foundry and Library ontology for the concise, controlled description of environmental entities such as ecosystems, environmental processes, and environmental qualities. It closely interoperates with a broad collection of other OBO ontologies and is used in a diverse range of projects.',
        uri: 'http://purl.obolibrary.org/obo/envo.owl',
    },
    {
        name: 'Thysanoptera Ontology',
        acronym: 'THYSANOPTERA',
        description: 'Working list: taxon names of the order Thysanoptera (Insecta).',
        uri: 'http://terminologies.gfbio.org/terms/THYSANOPTERA/',
    },
    {
        name: 'The Extensible Observation Ontology',
        acronym: 'OBOE',
        description:
            'The Extensible Observation Ontology (OBOE) is a formal ontology for capturing the semantics of scientific observation and measurement. The ontology supports researchers to add detailed semantic annotations to scientific data, thereby clarifying the inherent meaning of scientific observations.',
        uri: 'http://ecoinformatics.org/oboe/oboe.1.2/oboe.owl',
    },
    {
        name: 'Kingdom',
        acronym: 'KINGDOM',
        description:
            "A controlled vocabulary (Terminology) for biological taxa 'Higher Classification - Kingdom (=Regnum)'. Based on GBIF and CoL.",
        uri: 'http://terminologies.gfbio.org/terms/KINGDOM',
    },
    {
        name: 'Plant Trait Ontology',
        acronym: 'PTO',
        description:
            'A controlled vocabulary to describe phenotypic traits in plants. Each trait is a distinguishable feature, characteristic, quality or phenotypic feature of a developing or mature plant, or a plant part.',
        uri: 'http://purl.obolibrary.org/obo/to.owl',
    },
    {
        name: 'Oribatida Ontology',
        acronym: 'ORIBATIDA',
        description: 'Working list: taxon names of the order Oribatida (moss- or beetle-mites).',
        uri: 'http://terminologies.gfbio.org/terms/ORIBATIDA/',
    },
    {
        name: 'Quantity, Unit, Dimension and Type',
        acronym: 'QUDT',
        description:
            'The QUDT collection of ontologies define the base classes properties, and restrictions used for modeling physical quantities, units of measure, and their dimensions in various measurement systems. The goal of the QUDT ontology is to provide a unified model of, measurable quantities, units for measuring different kinds of quantities, the numerical values of quantities in different units of measure and the data structures and data types used to store and manipulate these objects in software. This OWL schema is a foundation for a basic treatment of units.',
        uri: 'http://data.qudt.org/qudt/owl/1.0.0/qudt-all.owl',
    },
    {
        name: 'Semantic Web for Earth and Environment Technology Ontology',
        acronym: 'SWEET',
        description:
            'The Semantic Web for Earth and Environmental Terminology is a mature foundational ontology that contains over 6000 concepts organized in 200 ontologies represented in OWL. Top level concepts include Representation (math, space, science, time, data), Realm (Ocean, Land Surface, Terrestrial Hydroshere, Atmosphere, etc.), Phenomena (macro-scale ecological and physical), Processes (micro-scale physical, biological, chemical, and mathematical), Human Activities (Decision, Commerce, Jurisdiction, Environmental, Research). Originally developed by NASA Jet Propulsion Labs under Rob Raskin, SWEET is now officially under the governance of the ESIP foundation.',
        uri: 'http://sweetontology.net/sweetAll',
    },
    {
        name: 'ISO 3166 Countries and Subdivisions',
        acronym: 'ISOCOUNTRIES',
        description: 'ISO 3166 Countries and Subdivisions',
        uri: 'http://terminologies.gfbio.org/terms/ISOCOUNTRIES',
    },
    {
        name: 'The lithologs rock names ontology for igneous rocks',
        acronym: 'LIT_I',
        description:
            'The lithologs ontology for igneous rocks provides SKOSified information on the classification of igneous rocks extracted from the IUGS recommendations published by Le Maitre (ed.)(2002): Igneous rocks: a classification and glossary of terms',
        uri: 'http://terminologies.gfbio.org/terms/LIT_I',
    },
    {
        name: 'National Center for Biotechnology Information (NCBI) Organismal Classification',
        acronym: 'NCBITAXON',
        description:
            'The NCBI Taxonomy Database is a curated classification and nomenclature for all of the organisms in the public sequence databases.',
        uri: 'http://purl.obolibrary.org/obo/ncbitaxon.owl',
    },
    {
        name: 'Regionalised and Domain-specific Taxon Lists',
        acronym: 'DTNtaxonlists_SNSB',
        description:
            'The DWB REST Webservice for Taxon Lists is part of a Diversity Workbench (DWB) services network. It is delivering basic information on taxon names in use, synonyms, classification and German vernacular names of a number of groups of animals, fungi and plants. The current focus is on domain-specific lists (checklists, taxon reference lists, red lists) from Germany under active curation by experts on taxonomy or floristics and faunistics. Each regionalised and domain-specific taxon list has its own history and objectives, is managed completely separately and has its own hierarchical classification. The DiversityTaxonNames (DTN) data resources accessed by the REST API may include additional taxon-related data useful, e. g., for regional nature conservation agencies and environmental projects. This information might be mobilised in a next step. For more information please check the Overview on Published Lists ( http://services.snsb.info/DTNtaxonlists/rest/v0.1/) and the REST-API documentation ( http://services.snsb.info/DTNtaxonlists/rest/v0.1/static/api-doc.html).',
        uri: 'http://www.eu-nomen.eu/portal/taxon.php?GUID=',
    },
    {
        name: 'Catalogue Of Life',
        acronym: 'COL',
        description:
            'The Catalogue of Life is the most comprehensive and authoritative global index of species currently available. It consists of a single integrated species checklist and taxonomic hierarchy. The Catalogue holds essential information on the names, relationships and distributions of over 1.7 million species. This figure continues to rise as information is compiled from diverse sources around the world. . Accessed via: https://cybertaxonomy.eu/cdmlib/rest-api-name-catalogue.html.',
        uri: 'http://api.cybertaxonomy.org/col/name_catalogue/',
    },
    {
        name: 'Prokaryotic Nomenclature up-to-date',
        acronym: 'PNU',
        description:
            "PNU is a compilation of all names of Bacteria and Archaea which have been validly published according to the Bacteriological Code since 1. Jan. 1980, and nomenclatural changes which have been validly published since. It will be updated with the publication of each new issue of the Int. J. Syst. Evol. Microbiol. (IJSEM). 'Prokaryotic Nomenclature up-to-date' is published by the Leibniz-Institut DSMZ - Deutsche Sammlung von Mikroorganismen und Zellkulturen GmbH.",
        uri: 'http://bacdive.dsmz.de/api/pnu/',
    },
    {
        name: 'Integrated Taxonomic Information System',
        acronym: 'ITIS',
        description:
            'The White House Subcommittee on Biodiversity and Ecosystem Dynamics has identified systematics as a research priority that is fundamental to ecosystem management and biodiversity conservation. This primary need identified by the Subcommittee requires improvements in the organization of, and access to, standardized nomenclature. ITIS (originally referred to as the Interagency Taxonomic Information System) was designed to fulfill these requirements. In the future, the ITIS will provide taxonomic data and a directory of taxonomic expertise that will support the system. The ITIS is the result of a partnership of federal agencies formed to satisfy their mutual needs for scientifically credible taxonomic information. Since its inception, ITIS has gained valuable new partners and undergone a name change; ITIS now stands for the Integrated Taxonomic Information System. ',
        uri: 'http://www.itis.gov/',
    },
    {
        name: 'The GeoNames geographical database',
        acronym: 'GEONAMES',
        description:
            'The GeoNames geographical database is available for download free of charge under a creative commons attribution license. It contains over 10 million geographical names and consists of over 9 million unique features whereof 2.8 million populated places and 5.5 million alternate names. All features are categorized into one out of nine feature classes and further subcategorized into one out of 645 feature codes.',
        uri: 'http://sws.geonames.org/',
    },
    {
        name: 'Pan-European Species directories Infrastructure',
        acronym: 'PESI',
        description:
            'PESI provides standardised and authoritative taxonomic information by integrating and securing Europes taxonomically authoritative species name registers and nomenclators (name databases) and associated exper(tise) networks that underpin the management of biodiversity in Europe.',
        uri: 'http://www.eu-nomen.eu/portal/taxon.php?GUID=',
    },
    {
        name: 'World Register of Marine Species',
        acronym: 'WORMS',
        description:
            'The aim of a World Register of Marine Species (WoRMS) is to provide an authoritative and comprehensive list of names of marine organisms, including information on synonymy. While highest priority goes to valid names, other names in use are included so that this register can serve as a guide to interpret taxonomic literature.',
        uri: 'http://www.marinespecies.org/aphia.php?p=soap',
    },
];

/**
 * This component allows creating the terminology lookup operator.
 */
@Component({
    selector: 'wave-gfbio-terminology-lookup',
    templateUrl: './terminology-lookup.component.html',
    styleUrls: ['./terminology-lookup.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminologyLookupOperatorComponent implements AfterViewInit {
    // for the template
    readonly ResultTypes = ResultTypes;
    TerminologyLookupOnNotResolvable = TerminologyLookupOnNotResolvable;
    TerminologyLookupMatchType = TerminologyLookupMatchType;
    TERMINOLOGIES = TERMINOLOGIES;

    form: FormGroup;
    attributes$: Observable<Array<string>>;

    constructor(private projectService: ProjectService, private formBuilder: FormBuilder, private randomColorService: RandomColorService) {
        this.form = formBuilder.group({
            name: [undefined, [Validators.required, WaveValidators.notOnlyWhitespace]],
            vectorLayer: [undefined, Validators.required],
            attribute: [undefined, Validators.required],
            terminology: ['ISOCOUNTRIES', Validators.required],
            terminology_key: ['label', [Validators.required, WaveValidators.notOnlyWhitespace]],
            resolved_attribute_name: [undefined, [Validators.required, WaveValidators.notOnlyWhitespace]],
            matchType: [TerminologyLookupMatchType.INCLUDED, []],
            on_not_resolvable: [TerminologyLookupOnNotResolvable.EMPTY, Validators.required],
            first_hit: [true, []],
        });

        this.attributes$ = this.form.controls['vectorLayer'].valueChanges.pipe(
            tap((layer) => {
                // side effects!!!
                this.form.controls['attribute'].setValue(undefined);
                if (layer) {
                    this.form.controls['attribute'].enable({onlySelf: true});
                } else {
                    this.form.controls['attribute'].disable({onlySelf: true});
                }
            }),
            map((layer) => {
                if (layer) {
                    return layer.operator.attributes.toArray().sort();
                } else {
                    return [];
                }
            }),
        );
    }

    ngAfterViewInit() {
        // initially get attributes
        setTimeout(() => this.form.controls['vectorLayer'].enable({emitEvent: true}));
    }

    add() {
        const vectorLayer: VectorLayer<AbstractVectorSymbology> = this.form.controls['vectorLayer'].value;
        const sourceOperator: Operator = vectorLayer.operator;

        const attributeName: string = this.form.controls['attribute'].value;
        const terminologyName: string = this.form.controls['terminology'].value;
        const terminologyKeyName: string = this.form.controls['terminology_key'].value;

        const on_not_resolvable: TerminologyLookupOnNotResolvable = this.form.controls['on_not_resolvable'].value;
        const match_type: TerminologyLookupMatchType = this.form.controls['matchType'].value;
        const first_hit: boolean = this.form.controls['first_hit'].value;
        const resolved_attribute_name = this.form.controls['resolved_attribute_name'].value;

        const name: string = this.form.controls['name'].value;

        // TODO: handle new terminology name and add it to the attribute list!
        const operatorAttributes = sourceOperator.attributes.toArray();
        operatorAttributes.push(resolved_attribute_name);
        const operatorDataTypes = sourceOperator.dataTypes.set('resolved_attribute_name', DataTypes.Alphanumeric);

        const dict = {
            operatorType: new TerminologyLookupType({
                attribute_name: attributeName,
                terminology: terminologyName,
                key: terminologyKeyName,
                on_not_resolvable,
                resolved_attribute: resolved_attribute_name,
                match_type,
                first_hit,
            }),
            resultType: sourceOperator.resultType,
            projection: sourceOperator.projection,
            attributes: operatorAttributes,
            dataTypes: operatorDataTypes,
            units: sourceOperator.units,
            pointSources: [],
            lineSources: [],
            polygonSources: [],
        };

        switch (sourceOperator.resultType) {
            case ResultTypes.POINTS:
                dict.pointSources.push(sourceOperator);
                break;
            case ResultTypes.LINES:
                dict.lineSources.push(sourceOperator);
                break;
            case ResultTypes.POLYGONS:
                dict.polygonSources.push(sourceOperator);
                break;
            default:
                throw Error('Incompatible Input Type');
        }

        const operator = new Operator(dict);

        const symbology = (vectorLayer.symbology.clone() as any) as AbstractVectorSymbology;
        symbology.fillRGBA = this.randomColorService.getRandomColorRgba();
        const layer = new VectorLayer({
            name,
            operator,
            symbology,
            clustered: vectorLayer.clustered,
        });

        this.projectService.addLayer(layer);
    }
}
