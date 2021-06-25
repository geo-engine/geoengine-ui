import {UUID} from 'wave-core';

export interface Country {
    polygon: {
        type: 'internal';
        datasetId: UUID;
    };
    raster: {
        type: 'internal';
        datasetId: UUID;
    };
}

export const COUNTRY_LIST: {[name: string]: Country} = {
    Indonesia: {
        polygon: {
            type: 'internal',
            datasetId: 'e1a17ad7-8665-4c86-84fd-15ce1b3f13f9',
        },
        raster: {
            type: 'internal',
            datasetId: '59cfa7a8-c8f4-400a-b171-fa97d91e5649',
        },
    },
    Malaysia: {
        polygon: {
            type: 'internal',
            datasetId: '32431e72-06cf-44ee-9149-3d8bc0fd0ec6',
        },
        raster: {
            type: 'internal',
            datasetId: '9001fd1e-c560-4629-b72f-83fc084728bc',
        },
    },
    Chile: {
        polygon: {
            type: 'internal',
            datasetId: '63146c5f-588b-48ec-b70b-e987913dbd6d',
        },
        raster: {
            type: 'internal',
            datasetId: '3857536b-08b2-4e78-8e43-ad145498968e',
        },
    },
    Bolivia: {
        polygon: {
            type: 'internal',
            datasetId: '0dabfdd0-00d4-4015-ad65-f41d16985aad',
        },
        raster: {
            type: 'internal',
            datasetId: '1bbdc706-b867-412a-9e8d-9adae716f6a9',
        },
    },
    Peru: {
        polygon: {
            type: 'internal',
            datasetId: '85b795c2-983e-4e25-bfe0-20ddafd5b4b3',
        },
        raster: {
            type: 'internal',
            datasetId: '7ebcd29b-281d-436e-a047-cf13dde40861',
        },
    },
    Argentina: {
        polygon: {
            type: 'internal',
            datasetId: '447c19d5-09c4-4531-a7c2-bacbfb426650',
        },
        raster: {
            type: 'internal',
            datasetId: '989bdfb8-0268-4712-a76e-9ded1705ff7c',
        },
    },
    Cyprus: {
        polygon: {
            type: 'internal',
            datasetId: '6de8345d-8a50-47c6-920b-1107016a4084',
        },
        raster: {
            type: 'internal',
            datasetId: 'e9737f70-e4a8-47c9-b25a-372a306b5bf5',
        },
    },
    India: {
        polygon: {
            type: 'internal',
            datasetId: '6477c509-474a-4d1c-906b-a6970622a4ee',
        },
        raster: {
            type: 'internal',
            datasetId: '8afeb4ee-567d-4e36-8e87-add9d3e1bab9',
        },
    },
    China: {
        polygon: {
            type: 'internal',
            datasetId: '2bf5d430-3458-46d9-8ac6-4f9f4123c69e',
        },
        raster: {
            type: 'internal',
            datasetId: '2e08e15b-ee47-4f33-ad4d-6baeb0487081',
        },
    },
    Lebanon: {
        polygon: {
            type: 'internal',
            datasetId: '2cee6ebe-1226-4e3a-9d72-a18f2fed9562',
        },
        raster: {
            type: 'internal',
            datasetId: 'bde89bf4-8ecf-4562-8933-5bcbc11f3ecf',
        },
    },
    Ethiopia: {
        polygon: {
            type: 'internal',
            datasetId: 'ec6b0a86-6fe7-4a1e-b75f-1dcf38a1c9d0',
        },
        raster: {
            type: 'internal',
            datasetId: '3a2f140d-4198-478e-b915-95317b7b5964',
        },
    },
    Somalia: {
        polygon: {
            type: 'internal',
            datasetId: '59e3cc4a-b546-4a1b-a812-18d06b8ed06e',
        },
        raster: {
            type: 'internal',
            datasetId: 'd9abbf4a-2f58-40c8-9b9f-9c3188d37e0f',
        },
    },
    Kenya: {
        polygon: {
            type: 'internal',
            datasetId: 'f22fc916-0229-41b1-ae77-061fdf986b97',
        },
        raster: {
            type: 'internal',
            datasetId: 'fda9e471-a5fd-426b-9840-9fc917a3c536',
        },
    },
    Pakistan: {
        polygon: {
            type: 'internal',
            datasetId: '4102c9fd-c81d-4bd8-b034-b1fb4dc0dee7',
        },
        raster: {
            type: 'internal',
            datasetId: '5b2620f8-7026-4f37-863b-6f902a0645b5',
        },
    },
    Malawi: {
        polygon: {
            type: 'internal',
            datasetId: '7d583ae2-1510-4833-ace7-23088aa525c9',
        },
        raster: {
            type: 'internal',
            datasetId: '39b9f0f6-1fca-4e00-a912-4e6a957f3f1c',
        },
    },
    Tanzania: {
        polygon: {
            type: 'internal',
            datasetId: 'b42ad3c9-de08-4de3-b39e-f0a42538b079',
        },
        raster: {
            type: 'internal',
            datasetId: '7bee87e0-a840-472b-81a1-03d5e5511250',
        },
    },
    Syria: {
        polygon: {
            type: 'internal',
            datasetId: 'b92b0225-f45c-4ca7-a6de-890dca85a93a',
        },
        raster: {
            type: 'internal',
            datasetId: 'baaa34d8-48e6-45bf-8085-13d74917b616',
        },
    },
    France: {
        polygon: {
            type: 'internal',
            datasetId: '8623c231-e04f-4528-958e-103019a25793',
        },
        raster: {
            type: 'internal',
            datasetId: 'caafc7e8-4c43-4aed-a759-3e08ad9a49d3',
        },
    },
    Suriname: {
        polygon: {
            type: 'internal',
            datasetId: 'bf483d00-1eea-49fe-996f-f0d6717750db',
        },
        raster: {
            type: 'internal',
            datasetId: 'abe3c42f-c7fc-4f06-bd90-f91a35864ded',
        },
    },
    Guyana: {
        polygon: {
            type: 'internal',
            datasetId: '23e26115-14f9-42c4-99f7-f1eeacf7b99e',
        },
        raster: {
            type: 'internal',
            datasetId: '28ba244e-fc10-4e67-85f2-1f89731895f0',
        },
    },
    'South Korea': {
        polygon: {
            type: 'internal',
            datasetId: '0782b6dc-449f-4786-a4a0-14c4ef649ccc',
        },
        raster: {
            type: 'internal',
            datasetId: '56b453f8-a707-431c-9081-4d22cedfbf59',
        },
    },
    'North Korea': {
        polygon: {
            type: 'internal',
            datasetId: '65b2b9af-5b55-4f22-aa39-1af94709be8e',
        },
        raster: {
            type: 'internal',
            datasetId: 'c8f1abdd-d77c-4eb9-9738-564db6042adc',
        },
    },
    Morocco: {
        polygon: {
            type: 'internal',
            datasetId: '280cf770-14db-4b94-85f9-caad2b0d00b4',
        },
        raster: {
            type: 'internal',
            datasetId: '783bac19-9409-4378-9fb6-6066801c9259',
        },
    },
    'W. Sahara': {
        polygon: {
            type: 'internal',
            datasetId: '740c1e05-d4b9-4da4-bc4c-d89b8001f516',
        },
        raster: {
            type: 'internal',
            datasetId: 'd9cde33e-d547-418d-b554-1e27d00a6952',
        },
    },
    'Costa Rica': {
        polygon: {
            type: 'internal',
            datasetId: '03f990e0-6793-440a-a82a-060380538023',
        },
        raster: {
            type: 'internal',
            datasetId: '46029244-3039-4bf7-9713-5c0291a6c21d',
        },
    },
    Nicaragua: {
        polygon: {
            type: 'internal',
            datasetId: 'dc1ef7e9-d4c3-4707-9b2e-4482e1e0d513',
        },
        raster: {
            type: 'internal',
            datasetId: 'c1d096e1-9371-4a59-80e2-d3d594c8e36a',
        },
    },
    Congo: {
        polygon: {
            type: 'internal',
            datasetId: '612a3c30-e046-4169-ab18-b8261356de07',
        },
        raster: {
            type: 'internal',
            datasetId: 'f7bf26e1-be1a-434a-bb61-7583b35b60d4',
        },
    },
    'Dem. Rep. Congo': {
        polygon: {
            type: 'internal',
            datasetId: '9d8366f5-df53-461a-af7a-05732687e397',
        },
        raster: {
            type: 'internal',
            datasetId: '73d27f9c-cc5f-441f-8731-06923e97d031',
        },
    },
    Bhutan: {
        polygon: {
            type: 'internal',
            datasetId: '2bf9dd5b-160e-4e2c-bd94-be9ea33dd467',
        },
        raster: {
            type: 'internal',
            datasetId: '749eb6f5-b5b2-4d84-a694-a2e995fd9675',
        },
    },
    Ukraine: {
        polygon: {
            type: 'internal',
            datasetId: '3cfd3400-b5cd-4794-811a-c10b7c7a13f9',
        },
        raster: {
            type: 'internal',
            datasetId: 'b3ff34bb-8d87-4153-9123-32ef2e9d4634',
        },
    },
    Belarus: {
        polygon: {
            type: 'internal',
            datasetId: 'e221b2c5-f873-4e32-a11c-c38246dfceac',
        },
        raster: {
            type: 'internal',
            datasetId: 'b9835b9e-d097-4dbe-a9d4-f2ac88b2b19a',
        },
    },
    Namibia: {
        polygon: {
            type: 'internal',
            datasetId: 'bbaba7a1-2a6a-4cd7-8e67-e9a8d95ac824',
        },
        raster: {
            type: 'internal',
            datasetId: '4016ec72-2f14-4896-bd6c-58f38b27a584',
        },
    },
    'South Africa': {
        polygon: {
            type: 'internal',
            datasetId: '3b4e3717-2ae2-4450-9da3-e6b3c0962361',
        },
        raster: {
            type: 'internal',
            datasetId: '4dd7524d-5312-4dd4-bf33-f266aed2adfc',
        },
    },
    'St-Martin': {
        polygon: {
            type: 'internal',
            datasetId: '189ede92-d316-4b33-a092-a2c2199f205c',
        },
        raster: {
            type: 'internal',
            datasetId: '3c0abd53-5704-49b3-b7bd-28f75a32abe2',
        },
    },
    'Sint Maarten': {
        polygon: {
            type: 'internal',
            datasetId: '434bbf83-c371-424d-b939-789db25fe4ad',
        },
        raster: {
            type: 'internal',
            datasetId: 'bb34d179-3b49-44bd-b03b-9f81c3a3e93f',
        },
    },
    Oman: {
        polygon: {
            type: 'internal',
            datasetId: '6c35291e-b209-4aa5-a55e-853fd805fc39',
        },
        raster: {
            type: 'internal',
            datasetId: '4372bdf8-340e-4023-8eac-330ed466c261',
        },
    },
    Uzbekistan: {
        polygon: {
            type: 'internal',
            datasetId: 'cd2ad716-306e-45e7-ad5d-895d3023eb4f',
        },
        raster: {
            type: 'internal',
            datasetId: '66f9cc43-d9e7-4417-9607-0b471ebd9ef6',
        },
    },
    Kazakhstan: {
        polygon: {
            type: 'internal',
            datasetId: '68fbd180-4601-4318-8305-a48d70d1ceeb',
        },
        raster: {
            type: 'internal',
            datasetId: '0b13ddc8-1afa-4a96-abcb-389a0c352806',
        },
    },
    Tajikistan: {
        polygon: {
            type: 'internal',
            datasetId: '814c269a-dc2a-46fd-ab45-9939f1ebc607',
        },
        raster: {
            type: 'internal',
            datasetId: '9b0e5299-bd3e-43a6-a4d0-28ceca12f48a',
        },
    },
    Lithuania: {
        polygon: {
            type: 'internal',
            datasetId: 'bbffcc15-53b4-45fb-a1d5-db1a77ba7869',
        },
        raster: {
            type: 'internal',
            datasetId: '2b669154-c193-4b1b-9e82-30cb04914a72',
        },
    },
    Brazil: {
        polygon: {
            type: 'internal',
            datasetId: '2ac06c6c-0d21-43e5-8cf9-fbc853d4907b',
        },
        raster: {
            type: 'internal',
            datasetId: '060d1773-4dc3-49ed-9244-2b3d26cbacf1',
        },
    },
    Uruguay: {
        polygon: {
            type: 'internal',
            datasetId: '5f4e21a4-d8f4-407f-9de0-56ceeb4a3ab0',
        },
        raster: {
            type: 'internal',
            datasetId: 'd2cf2d6e-23e6-4790-a905-4fc635404110',
        },
    },
    Mongolia: {
        polygon: {
            type: 'internal',
            datasetId: '75911c66-869b-4eb5-91b1-4844100d633f',
        },
        raster: {
            type: 'internal',
            datasetId: '91df811c-41ee-43a9-84c1-b236cbeaf958',
        },
    },
    Russia: {
        polygon: {
            type: 'internal',
            datasetId: '8c49967e-106c-4a09-9095-493aaaa70781',
        },
        raster: {
            type: 'internal',
            datasetId: '3969c500-159b-4c58-bf7d-b21789630d3c',
        },
    },
    Czechia: {
        polygon: {
            type: 'internal',
            datasetId: 'bac1b4c4-d998-40ac-90cc-b0bc82c4b7cd',
        },
        raster: {
            type: 'internal',
            datasetId: '15f0ff8d-14be-4880-aa7a-31bed3b5dc95',
        },
    },
    Germany: {
        polygon: {
            type: 'internal',
            datasetId: '08633448-f20e-419a-9aff-7a953a91c368',
        },
        raster: {
            type: 'internal',
            datasetId: '8652ded5-da0c-45c6-ad9d-7e046bd0e00f',
        },
    },
    Estonia: {
        polygon: {
            type: 'internal',
            datasetId: 'e2c625a3-262c-4950-8dc3-c15b4e09b9f1',
        },
        raster: {
            type: 'internal',
            datasetId: '1584cc60-e029-4f31-9cea-f9e5d53d2fde',
        },
    },
    Latvia: {
        polygon: {
            type: 'internal',
            datasetId: '780ef6af-9d28-4e0f-a25f-7aca8a774e4e',
        },
        raster: {
            type: 'internal',
            datasetId: '433192d8-5e83-4363-b8a4-f2ccaace4a37',
        },
    },
    Sweden: {
        polygon: {
            type: 'internal',
            datasetId: '57f47ccd-15e9-45d0-bf5b-01572300adfa',
        },
        raster: {
            type: 'internal',
            datasetId: '347e1953-6f73-42d5-95eb-eb260394f0bd',
        },
    },
    Finland: {
        polygon: {
            type: 'internal',
            datasetId: 'c307ac1c-dbbf-418b-a4e8-68bb90362740',
        },
        raster: {
            type: 'internal',
            datasetId: 'a487bde5-fd4b-4cdd-9fda-ea65e1be0f5d',
        },
    },
    Vietnam: {
        polygon: {
            type: 'internal',
            datasetId: 'c61b9f7d-6ce0-413b-8b2d-ce25d9e96ba1',
        },
        raster: {
            type: 'internal',
            datasetId: '89f71de0-97e5-474f-8689-b699213f2b39',
        },
    },
    Cambodia: {
        polygon: {
            type: 'internal',
            datasetId: '9ce27a4e-3be1-4e01-9ad1-f7311f1f6f3f',
        },
        raster: {
            type: 'internal',
            datasetId: 'dc659f71-dbf2-4172-82c3-c181b84a8704',
        },
    },
    Luxembourg: {
        polygon: {
            type: 'internal',
            datasetId: '53a0c37a-0afa-45c5-be4d-04af9a88c2dc',
        },
        raster: {
            type: 'internal',
            datasetId: '046c7476-019a-4058-8f96-2dd9a9d3c8b7',
        },
    },
    'United Arab Emirates': {
        polygon: {
            type: 'internal',
            datasetId: '944d12b6-902d-41ec-ac54-af6b4180c540',
        },
        raster: {
            type: 'internal',
            datasetId: '4cebec86-77ef-4dee-a30e-eedb6efce740',
        },
    },
    Belgium: {
        polygon: {
            type: 'internal',
            datasetId: 'a5f3ae3b-4905-4c81-87f8-5310c2eb5171',
        },
        raster: {
            type: 'internal',
            datasetId: 'b042603f-22de-4542-9af6-0604e95074ce',
        },
    },
    Georgia: {
        polygon: {
            type: 'internal',
            datasetId: '7c3a1b23-2682-4706-9e34-af07033c0f0d',
        },
        raster: {
            type: 'internal',
            datasetId: '5b65e846-caf0-4016-a151-bcb2d85ae46c',
        },
    },
    Macedonia: {
        polygon: {
            type: 'internal',
            datasetId: '1cf4280a-9f44-4a3d-be2f-ee939020fc03',
        },
        raster: {
            type: 'internal',
            datasetId: '9748b32a-8995-4c5e-a853-cd5c77c84a2b',
        },
    },
    Albania: {
        polygon: {
            type: 'internal',
            datasetId: '19ad16dc-dd34-4880-8ae8-e6b3fb1a30e3',
        },
        raster: {
            type: 'internal',
            datasetId: 'f3ebf21a-61b5-4cec-a4c5-aec84d9b4f9d',
        },
    },
    Azerbaijan: {
        polygon: {
            type: 'internal',
            datasetId: 'f0b5edcf-3bf8-4c41-a530-ebd7cff7982d',
        },
        raster: {
            type: 'internal',
            datasetId: '06fc0553-9277-40aa-9fc1-b9a9a585ebf6',
        },
    },
    Kosovo: {
        polygon: {
            type: 'internal',
            datasetId: '16b8c63e-8676-4057-969e-6237c58c6aeb',
        },
        raster: {
            type: 'internal',
            datasetId: '47f30479-bf6c-4995-b619-4d5bf063512a',
        },
    },
    Turkey: {
        polygon: {
            type: 'internal',
            datasetId: '4f06ea1a-58fe-46ff-9095-6c411e054312',
        },
        raster: {
            type: 'internal',
            datasetId: '7bda0ed6-b620-4258-ad45-cf6277a384bc',
        },
    },
    Spain: {
        polygon: {
            type: 'internal',
            datasetId: '45b4badd-987b-4a48-8b06-df54b1275a02',
        },
        raster: {
            type: 'internal',
            datasetId: '25e3afd6-c2b7-410e-a2c1-e2a07478044e',
        },
    },
    Laos: {
        polygon: {
            type: 'internal',
            datasetId: '3eb8ad03-3ddb-4ed2-800a-84c6591ad9ef',
        },
        raster: {
            type: 'internal',
            datasetId: '056b22fc-7c55-44d3-96d5-a7fe3d31f649',
        },
    },
    Kyrgyzstan: {
        polygon: {
            type: 'internal',
            datasetId: '004fe12d-c31e-420f-b2fd-648646ff2d00',
        },
        raster: {
            type: 'internal',
            datasetId: '23235be5-0e5e-400f-9e38-984d8dda8f70',
        },
    },
    Armenia: {
        polygon: {
            type: 'internal',
            datasetId: '36b97780-f30d-4c12-886d-c1ed3d4ab3e8',
        },
        raster: {
            type: 'internal',
            datasetId: 'a7dde7e5-8ab4-4bf7-9254-6de13b31ba84',
        },
    },
    Denmark: {
        polygon: {
            type: 'internal',
            datasetId: 'dab29c31-c0b5-4eac-a918-0696f50f472a',
        },
        raster: {
            type: 'internal',
            datasetId: 'd548bb3a-46b2-4606-9f84-be1340d66dd5',
        },
    },
    Libya: {
        polygon: {
            type: 'internal',
            datasetId: 'b75d0102-0289-4781-a300-5dd64794321b',
        },
        raster: {
            type: 'internal',
            datasetId: '9972fe1d-414b-426f-b85a-e1cb6292ce3b',
        },
    },
    Tunisia: {
        polygon: {
            type: 'internal',
            datasetId: 'a89eaaa3-344e-4ef1-aba9-5a094c7ace90',
        },
        raster: {
            type: 'internal',
            datasetId: '93b51f89-8185-4c9a-ad2f-bbab24955821',
        },
    },
    Romania: {
        polygon: {
            type: 'internal',
            datasetId: '298e73d8-ba74-47ae-be26-b36811fe4f23',
        },
        raster: {
            type: 'internal',
            datasetId: '3c3f5681-7eea-4964-9e75-65547fff9146',
        },
    },
    Hungary: {
        polygon: {
            type: 'internal',
            datasetId: '5e63b58b-485a-4d5e-bb32-719ad7d160d4',
        },
        raster: {
            type: 'internal',
            datasetId: 'c3b34df6-fcf5-4f7c-9a64-8460fb7ab598',
        },
    },
    Slovakia: {
        polygon: {
            type: 'internal',
            datasetId: 'f957b8a9-038e-4171-8d69-45de022b7e1f',
        },
        raster: {
            type: 'internal',
            datasetId: 'b356d45e-6ca9-4df9-8189-8fe9747602a0',
        },
    },
    Poland: {
        polygon: {
            type: 'internal',
            datasetId: 'b52f91bf-dcaf-40e8-a458-5f44443bbf79',
        },
        raster: {
            type: 'internal',
            datasetId: 'f05abdd6-7583-4d69-b495-942e77dcaafb',
        },
    },
    Ireland: {
        polygon: {
            type: 'internal',
            datasetId: '85ae66c2-60a9-4d46-a99c-8da02e2c2c87',
        },
        raster: {
            type: 'internal',
            datasetId: '612ac903-9e5e-4c53-ba21-2dde766c58b7',
        },
    },
    'United Kingdom': {
        polygon: {
            type: 'internal',
            datasetId: '87b6167c-7de9-4789-8427-4b941cc12527',
        },
        raster: {
            type: 'internal',
            datasetId: '1244ce4c-6d90-4779-85a0-131beac114d7',
        },
    },
    Greece: {
        polygon: {
            type: 'internal',
            datasetId: 'e59b40f8-2b31-4e91-b69e-9495af45d36c',
        },
        raster: {
            type: 'internal',
            datasetId: 'c6f060ff-3ff4-417e-a394-7f94c47775b4',
        },
    },
    Zambia: {
        polygon: {
            type: 'internal',
            datasetId: '60f26451-44ea-4e9e-9d68-653c92c017a2',
        },
        raster: {
            type: 'internal',
            datasetId: '5db70d75-ac21-4b1b-86fb-00e25664e1f7',
        },
    },
    'Sierra Leone': {
        polygon: {
            type: 'internal',
            datasetId: '4c678eee-52c6-4297-842f-fb518ea54c32',
        },
        raster: {
            type: 'internal',
            datasetId: '066c900b-1dea-4142-8e62-f0309110151c',
        },
    },
    Guinea: {
        polygon: {
            type: 'internal',
            datasetId: 'ca0e3ce7-1ff2-4b06-b301-88933e7a00f0',
        },
        raster: {
            type: 'internal',
            datasetId: '35ccb0e1-78dc-4b7e-87ef-a13089dea2ce',
        },
    },
    Liberia: {
        polygon: {
            type: 'internal',
            datasetId: 'b2d92254-6186-4b6e-83f7-a5cf8809854e',
        },
        raster: {
            type: 'internal',
            datasetId: '64b8c0a4-ff6e-487f-ae3b-4c83589d3004',
        },
    },
    'Central African Rep.': {
        polygon: {
            type: 'internal',
            datasetId: '2b335224-25bd-4f03-a112-91657da63c84',
        },
        raster: {
            type: 'internal',
            datasetId: 'e13e6185-631b-477f-9a02-119a9858ba52',
        },
    },
    Sudan: {
        polygon: {
            type: 'internal',
            datasetId: 'd5ff9543-04cc-4dc4-8886-a49692a20e26',
        },
        raster: {
            type: 'internal',
            datasetId: '75588efd-a298-45bf-be27-46def5618e64',
        },
    },
    Djibouti: {
        polygon: {
            type: 'internal',
            datasetId: 'a8f47d39-a178-4c6c-8c5d-59443b3c3ddf',
        },
        raster: {
            type: 'internal',
            datasetId: '202865fc-1a0a-47c6-ad76-de669bc89b6b',
        },
    },
    Eritrea: {
        polygon: {
            type: 'internal',
            datasetId: 'b98b86ac-9916-49dc-a811-284fa9977e80',
        },
        raster: {
            type: 'internal',
            datasetId: '9e4770e5-73f2-4137-8fa7-61fe4ac8eb65',
        },
    },
    Austria: {
        polygon: {
            type: 'internal',
            datasetId: '32ef4f91-edb5-42bf-ace7-2a1b2500eceb',
        },
        raster: {
            type: 'internal',
            datasetId: '9b7670c6-228b-42fd-a58a-bfc6a74be36b',
        },
    },
    Iraq: {
        polygon: {
            type: 'internal',
            datasetId: 'db3f32de-3733-4510-8a59-0f99aca9e0f1',
        },
        raster: {
            type: 'internal',
            datasetId: 'fe9d069f-38dc-4f2e-8cbe-72ef34f103be',
        },
    },
    Italy: {
        polygon: {
            type: 'internal',
            datasetId: '90ab7634-f142-4628-bfb3-aacb3e7c71ab',
        },
        raster: {
            type: 'internal',
            datasetId: '7349df92-1ac8-4804-b42c-f77f54a69922',
        },
    },
    Switzerland: {
        polygon: {
            type: 'internal',
            datasetId: 'e8429509-3be5-46bf-be03-2914e0891900',
        },
        raster: {
            type: 'internal',
            datasetId: 'b0ee5e6e-f750-444f-ab8a-cbff64bc1c28',
        },
    },
    Iran: {
        polygon: {
            type: 'internal',
            datasetId: 'aaf26b7a-0f4c-4747-99c7-458c05849759',
        },
        raster: {
            type: 'internal',
            datasetId: '992e28a1-d58d-440a-9261-0f3bac1767c1',
        },
    },
    Netherlands: {
        polygon: {
            type: 'internal',
            datasetId: '9712b710-f86e-4871-abce-e6c28ef797e6',
        },
        raster: {
            type: 'internal',
            datasetId: 'abcd1cc6-77c4-4a6d-9550-adbd50b1b5b6',
        },
    },
    Liechtenstein: {
        polygon: {
            type: 'internal',
            datasetId: '5000b5e0-6f90-4cce-bf0f-dba177e82ff4',
        },
        raster: {
            type: 'internal',
            datasetId: 'd8196f7a-cbdb-48bf-81a9-99f9bdaffd6d',
        },
    },
    'C\u00f4te d"Ivoire': {
        polygon: {
            type: 'internal',
            datasetId: '93779b62-8a1b-4188-b9f6-cf10dfdef8e6',
        },
        raster: {
            type: 'internal',
            datasetId: 'c90395ff-38ef-40f6-a655-bd367e1bb40f',
        },
    },
    Serbia: {
        polygon: {
            type: 'internal',
            datasetId: '6147a5ed-0c00-4c73-8a54-306ee44fa45a',
        },
        raster: {
            type: 'internal',
            datasetId: '522ae468-43d3-465f-8753-352c510761de',
        },
    },
    Mali: {
        polygon: {
            type: 'internal',
            datasetId: '24b5610a-25ec-4945-8fe9-deafd1550611',
        },
        raster: {
            type: 'internal',
            datasetId: '64d8ee55-13aa-4b96-8085-66195b679314',
        },
    },
    Senegal: {
        polygon: {
            type: 'internal',
            datasetId: '306bf0a0-179b-487e-b325-de82b1a44106',
        },
        raster: {
            type: 'internal',
            datasetId: '7155d4b7-d337-4bbd-9d16-16e10ee01fe9',
        },
    },
    Nigeria: {
        polygon: {
            type: 'internal',
            datasetId: '867b2077-c46e-46fd-b2bc-4d0cb40f690e',
        },
        raster: {
            type: 'internal',
            datasetId: 'a858d2ff-f09a-4cb9-8657-bdf8a014da3a',
        },
    },
    Benin: {
        polygon: {
            type: 'internal',
            datasetId: 'c7a5fa62-2f23-47dd-ba43-bcf70603b828',
        },
        raster: {
            type: 'internal',
            datasetId: '24c2fd0c-e8bf-4dc9-9fa5-2716811e5da6',
        },
    },
    Angola: {
        polygon: {
            type: 'internal',
            datasetId: '580c2224-0f2b-4982-b2f6-edfcda8d98eb',
        },
        raster: {
            type: 'internal',
            datasetId: '6183d245-0aa3-4fd9-b6bb-4ea42a1dd5a8',
        },
    },
    Croatia: {
        polygon: {
            type: 'internal',
            datasetId: '3c974a96-b87b-4e49-b136-fd902f1c3e41',
        },
        raster: {
            type: 'internal',
            datasetId: '5c966147-52f0-4a08-b08a-80e4699861b7',
        },
    },
    Slovenia: {
        polygon: {
            type: 'internal',
            datasetId: '89d3d8f8-35d3-4871-97d3-9225fe8c3777',
        },
        raster: {
            type: 'internal',
            datasetId: '9b49fb3d-375f-4872-996f-c0cd5fbe5ca0',
        },
    },
    Qatar: {
        polygon: {
            type: 'internal',
            datasetId: '2ecf08f2-7fb3-4d14-a124-e5dfc02a0fde',
        },
        raster: {
            type: 'internal',
            datasetId: 'c2408a06-226b-4aea-8847-709e0329ca8a',
        },
    },
    'Saudi Arabia': {
        polygon: {
            type: 'internal',
            datasetId: '2c288952-6b99-48e6-8b66-196fa768f240',
        },
        raster: {
            type: 'internal',
            datasetId: 'cad0fafe-04e6-4772-b90d-056248529a8d',
        },
    },
    Botswana: {
        polygon: {
            type: 'internal',
            datasetId: '33cfa33d-cc88-46b1-99a9-078c3e4c162f',
        },
        raster: {
            type: 'internal',
            datasetId: '63e09bc8-bc14-494e-b798-71a4c00bea56',
        },
    },
    Zimbabwe: {
        polygon: {
            type: 'internal',
            datasetId: '55815a5e-c0f0-4946-a1a1-d6ff23f1514f',
        },
        raster: {
            type: 'internal',
            datasetId: 'b0eec7c3-74a2-45db-b712-5d78e53a8e52',
        },
    },
    Bulgaria: {
        polygon: {
            type: 'internal',
            datasetId: '114badec-00c0-4847-9fff-224358fa0ce1',
        },
        raster: {
            type: 'internal',
            datasetId: '0c6e33fd-da7c-493f-8add-8b0912f95d83',
        },
    },
    Thailand: {
        polygon: {
            type: 'internal',
            datasetId: 'd3309929-1cda-418d-89fd-140fe62070ba',
        },
        raster: {
            type: 'internal',
            datasetId: '4ecb7900-eeec-4fc9-abba-a204617aac13',
        },
    },
    'San Marino': {
        polygon: {
            type: 'internal',
            datasetId: '7847023a-e4b1-407b-9992-2ecba4469eae',
        },
        raster: {
            type: 'internal',
            datasetId: 'e45d777b-4131-44d9-91ec-a0150a38bd3e',
        },
    },
    Haiti: {
        polygon: {
            type: 'internal',
            datasetId: 'afd01678-4834-4e40-b474-07350d71a60c',
        },
        raster: {
            type: 'internal',
            datasetId: '3f3aa536-848a-4614-966b-8fddd1324595',
        },
    },
    'Dominican Rep.': {
        polygon: {
            type: 'internal',
            datasetId: 'd90c2c6e-0098-4465-8eda-80c7e64eb4a3',
        },
        raster: {
            type: 'internal',
            datasetId: '938d32aa-1432-4c59-9980-d086fefbf547',
        },
    },
    Chad: {
        polygon: {
            type: 'internal',
            datasetId: 'b1acf710-a18e-4879-8ce0-8827d434e269',
        },
        raster: {
            type: 'internal',
            datasetId: '78657ac5-68bd-446a-824b-18545428fedf',
        },
    },
    Kuwait: {
        polygon: {
            type: 'internal',
            datasetId: '855165e7-8ade-4f72-ba9f-393cde8db142',
        },
        raster: {
            type: 'internal',
            datasetId: 'ba094ecd-8e5f-42a1-941a-d7d56767fbdc',
        },
    },
    'El Salvador': {
        polygon: {
            type: 'internal',
            datasetId: 'f1c73370-bd06-4ae4-8e23-953754915bda',
        },
        raster: {
            type: 'internal',
            datasetId: '99b75e37-3626-4cd1-8dc3-1eb492203765',
        },
    },
    Guatemala: {
        polygon: {
            type: 'internal',
            datasetId: '3a0176d8-8354-4e6e-9751-3d8121beab61',
        },
        raster: {
            type: 'internal',
            datasetId: 'cc928c20-95c4-44ef-8ce9-fdef30341af7',
        },
    },
    'Timor-Leste': {
        polygon: {
            type: 'internal',
            datasetId: 'cb28bf09-e563-4a8f-9f3e-bc2c09180f2f',
        },
        raster: {
            type: 'internal',
            datasetId: '5e450c70-2ae1-4085-9be7-2d081b2391c6',
        },
    },
    Brunei: {
        polygon: {
            type: 'internal',
            datasetId: '1df6009d-bba6-4f21-a07d-b375037906ba',
        },
        raster: {
            type: 'internal',
            datasetId: 'f519ed0f-9ae8-4621-8c39-5519c0e45a73',
        },
    },
    Monaco: {
        polygon: {
            type: 'internal',
            datasetId: '38d6dedc-426e-422a-8def-1890eb3ffa9a',
        },
        raster: {
            type: 'internal',
            datasetId: '6f8b5e29-2ce3-4ddf-9aa2-e390415337e2',
        },
    },
    Algeria: {
        polygon: {
            type: 'internal',
            datasetId: '6924e320-89e6-40fa-8c6b-01fb09d137e9',
        },
        raster: {
            type: 'internal',
            datasetId: '18915088-5eb8-418e-971d-539741dcc31a',
        },
    },
    Mozambique: {
        polygon: {
            type: 'internal',
            datasetId: 'f636ebe1-4806-46ea-a94c-3f0b615da4b6',
        },
        raster: {
            type: 'internal',
            datasetId: '811dabe4-6122-46b4-8b96-96510d0b3dda',
        },
    },
    eSwatini: {
        polygon: {
            type: 'internal',
            datasetId: '181da035-fe56-4f5e-b0ed-328e4d8ca58f',
        },
        raster: {
            type: 'internal',
            datasetId: '2027a3cf-32d7-40ae-974d-391858af8b38',
        },
    },
    Burundi: {
        polygon: {
            type: 'internal',
            datasetId: 'a7bbd67c-b709-4add-971a-819c0ad76173',
        },
        raster: {
            type: 'internal',
            datasetId: '747a4b3e-0d93-4a26-a966-33e0da37992f',
        },
    },
    Rwanda: {
        polygon: {
            type: 'internal',
            datasetId: '247bc582-d6fc-49c9-ae56-c43b00eced8b',
        },
        raster: {
            type: 'internal',
            datasetId: '68f905f9-01d8-4cf8-9597-66b632cb395f',
        },
    },
    Myanmar: {
        polygon: {
            type: 'internal',
            datasetId: 'e1335d80-33e5-4a71-affd-cb812294ba0b',
        },
        raster: {
            type: 'internal',
            datasetId: 'cf0553f9-f14f-45b0-a632-4aa16d48f6ec',
        },
    },
    Bangladesh: {
        polygon: {
            type: 'internal',
            datasetId: 'c4e56e5f-2e5b-43fd-9732-ff93cdf79dc7',
        },
        raster: {
            type: 'internal',
            datasetId: 'a3c21af5-9087-42d0-b3df-8c88b8f39f1c',
        },
    },
    Andorra: {
        polygon: {
            type: 'internal',
            datasetId: '688a3d13-8048-4db0-b5ed-02cd53295234',
        },
        raster: {
            type: 'internal',
            datasetId: '54fb2c2b-0c55-4bd7-9648-927d03f123bf',
        },
    },
    Afghanistan: {
        polygon: {
            type: 'internal',
            datasetId: '0dbe25e5-3e1c-41f5-8269-ed6349acac30',
        },
        raster: {
            type: 'internal',
            datasetId: '25506faa-92f5-4db6-8747-7132cb5d7098',
        },
    },
    Montenegro: {
        polygon: {
            type: 'internal',
            datasetId: '1ef240a2-e90d-4563-9f32-4444d1551f05',
        },
        raster: {
            type: 'internal',
            datasetId: '8bb46993-af9b-47aa-8f9f-7153271d8ca1',
        },
    },
    'Bosnia and Herz.': {
        polygon: {
            type: 'internal',
            datasetId: '3ba8f346-4db9-4742-9479-8a7b800440b6',
        },
        raster: {
            type: 'internal',
            datasetId: 'eb618e84-1b0e-4e39-a62a-dd386f3a5084',
        },
    },
    Uganda: {
        polygon: {
            type: 'internal',
            datasetId: '1c7b150d-7a30-436b-af50-b0aa05057bbc',
        },
        raster: {
            type: 'internal',
            datasetId: '8f461fdc-183e-404e-bff9-d55fd51c21d9',
        },
    },
    Cuba: {
        polygon: {
            type: 'internal',
            datasetId: '6e01bb56-1ba5-410d-aa85-d848b40ff760',
        },
        raster: {
            type: 'internal',
            datasetId: 'de20638f-0569-4a78-850a-4119b217a0fa',
        },
    },
    Honduras: {
        polygon: {
            type: 'internal',
            datasetId: '92c31dea-6d6a-4d5b-b7b2-dab1417e3722',
        },
        raster: {
            type: 'internal',
            datasetId: 'fff2f721-6b6c-4768-9b2f-abadae413e3e',
        },
    },
    Ecuador: {
        polygon: {
            type: 'internal',
            datasetId: '05a724af-9580-4dca-8b86-f1436d60ca87',
        },
        raster: {
            type: 'internal',
            datasetId: '73edd2e5-5fa0-4ecf-87d4-81a121dcf42b',
        },
    },
    Colombia: {
        polygon: {
            type: 'internal',
            datasetId: 'f56aa12a-1f26-4049-95fc-744832ee8d60',
        },
        raster: {
            type: 'internal',
            datasetId: 'd4f339ff-5fde-4f04-b0ea-e718d469145a',
        },
    },
    Paraguay: {
        polygon: {
            type: 'internal',
            datasetId: '9e2a6262-45f2-4679-8c12-1fae38f00529',
        },
        raster: {
            type: 'internal',
            datasetId: '4dec2985-9853-429d-b99e-69b069fe5e52',
        },
    },
    Portugal: {
        polygon: {
            type: 'internal',
            datasetId: '45288c6d-cd1d-4f84-b95b-2a0a89dff565',
        },
        raster: {
            type: 'internal',
            datasetId: 'c5da6a46-4a54-4ea0-809d-329ac13457e2',
        },
    },
    Moldova: {
        polygon: {
            type: 'internal',
            datasetId: '5b317486-7d8e-4098-b09a-fa4a46969697',
        },
        raster: {
            type: 'internal',
            datasetId: '311508a7-ce47-4677-9062-4768c28cfac6',
        },
    },
    Turkmenistan: {
        polygon: {
            type: 'internal',
            datasetId: '601c854e-cd02-4488-bb0e-7b7ead7060c2',
        },
        raster: {
            type: 'internal',
            datasetId: '750d9273-d8f3-4393-b659-9c79931f9b7b',
        },
    },
    Jordan: {
        polygon: {
            type: 'internal',
            datasetId: 'e8f04e60-3d98-43db-a8c7-c32f6f9d65c5',
        },
        raster: {
            type: 'internal',
            datasetId: 'a53f9bf9-485e-480d-bb76-590e4dcb9b5f',
        },
    },
    Nepal: {
        polygon: {
            type: 'internal',
            datasetId: 'c45b36cc-86a3-4f74-9f0d-b44b9b5f85e5',
        },
        raster: {
            type: 'internal',
            datasetId: 'bda00bcf-db59-4ba7-9fb0-cffb0ec5c4b3',
        },
    },
    Lesotho: {
        polygon: {
            type: 'internal',
            datasetId: '473c7397-36a5-4457-b6c4-98a602d96988',
        },
        raster: {
            type: 'internal',
            datasetId: '61e8779f-47e8-4a0e-9fe9-03abdaf9220b',
        },
    },
    Cameroon: {
        polygon: {
            type: 'internal',
            datasetId: 'b4c1b6a1-5768-40e8-bbc2-c16c56d8e224',
        },
        raster: {
            type: 'internal',
            datasetId: '0b2abe53-4b04-42d4-941f-0ad55d26ca02',
        },
    },
    Gabon: {
        polygon: {
            type: 'internal',
            datasetId: '4af5b29b-2870-4dc9-96bd-1de254222914',
        },
        raster: {
            type: 'internal',
            datasetId: 'ccfbfc5e-a959-4e3d-a542-da6807e7746c',
        },
    },
    Niger: {
        polygon: {
            type: 'internal',
            datasetId: '0e2bd237-65d8-4def-a088-a6f15d56c343',
        },
        raster: {
            type: 'internal',
            datasetId: '229e4923-c123-4b7f-8442-e0267f80100a',
        },
    },
    'Burkina Faso': {
        polygon: {
            type: 'internal',
            datasetId: '683a97cc-73f7-439e-b7e4-7511152bd523',
        },
        raster: {
            type: 'internal',
            datasetId: 'b098172f-8b5a-4126-93df-98d23ea1f586',
        },
    },
    Togo: {
        polygon: {
            type: 'internal',
            datasetId: '69e011bc-85ca-45a2-8c5d-b9847ebf90a7',
        },
        raster: {
            type: 'internal',
            datasetId: 'a7ad94f1-3690-4afd-8735-8cb73fd39dcc',
        },
    },
    Ghana: {
        polygon: {
            type: 'internal',
            datasetId: 'b0051acb-2236-4c48-90e0-e2869dc5b3f7',
        },
        raster: {
            type: 'internal',
            datasetId: '120a578a-8847-4ddf-bf9e-27762a235fe9',
        },
    },
    'Guinea-Bissau': {
        polygon: {
            type: 'internal',
            datasetId: '3dddef7b-9264-4f0b-903b-8247e9cf398c',
        },
        raster: {
            type: 'internal',
            datasetId: '52c07d23-e117-47f9-93a1-d74d1a6f85d0',
        },
    },
    Gibraltar: {
        polygon: {
            type: 'internal',
            datasetId: 'eeddcfd5-d07f-41c1-8345-82bbd116052b',
        },
        raster: {
            type: 'internal',
            datasetId: 'c18a9f2d-212b-44a9-9a4d-07a2aeb00d2d',
        },
    },
    'United States of America': {
        polygon: {
            type: 'internal',
            datasetId: 'd4955ac8-9434-46cb-b0b5-309cff44d00f',
        },
        raster: {
            type: 'internal',
            datasetId: 'b8f059f4-3111-402b-ac77-b857dce326cf',
        },
    },
    Canada: {
        polygon: {
            type: 'internal',
            datasetId: 'a1df0042-391f-493a-ad57-54a90a634ed6',
        },
        raster: {
            type: 'internal',
            datasetId: 'b82d907f-41f9-46b2-be5e-c872106ce7e9',
        },
    },
    Mexico: {
        polygon: {
            type: 'internal',
            datasetId: '33292fab-9e5a-4b89-a166-3c07b62bcc44',
        },
        raster: {
            type: 'internal',
            datasetId: '11ffb75a-27fd-4d11-9d86-8ca4c4a24806',
        },
    },
    Belize: {
        polygon: {
            type: 'internal',
            datasetId: '42bbb515-e81d-46a2-8928-4858ad6f4ed4',
        },
        raster: {
            type: 'internal',
            datasetId: 'fd861331-b364-4a87-8d09-557de75e6b45',
        },
    },
    Panama: {
        polygon: {
            type: 'internal',
            datasetId: 'dd651eeb-13c4-4c47-87a7-ffdd00074f28',
        },
        raster: {
            type: 'internal',
            datasetId: '46b91d3d-3ceb-47ea-81e3-b706f799da80',
        },
    },
    Venezuela: {
        polygon: {
            type: 'internal',
            datasetId: 'ee180c9b-31bd-40fc-9978-6ce2e8522b98',
        },
        raster: {
            type: 'internal',
            datasetId: '571fac0e-2c01-4dfe-b386-d45ce25cad8e',
        },
    },
    'Papua New Guinea': {
        polygon: {
            type: 'internal',
            datasetId: '47c7483b-1ecb-417e-9859-846a72c10ca7',
        },
        raster: {
            type: 'internal',
            datasetId: '181e15df-860d-4896-858c-02116dec098f',
        },
    },
    Egypt: {
        polygon: {
            type: 'internal',
            datasetId: 'bb206197-a008-404f-931f-2cc0b62b0aaf',
        },
        raster: {
            type: 'internal',
            datasetId: '97db0c98-d6c0-46e6-9b00-68d895d1c0f7',
        },
    },
    Yemen: {
        polygon: {
            type: 'internal',
            datasetId: '9ea1a932-20fb-4a13-9600-9ef4ff2de970',
        },
        raster: {
            type: 'internal',
            datasetId: '4b075dfa-2ec8-4fd0-9eb6-64e3bf70c6df',
        },
    },
    Mauritania: {
        polygon: {
            type: 'internal',
            datasetId: '6f2886c3-11e2-4668-9f13-009508785116',
        },
        raster: {
            type: 'internal',
            datasetId: '934ea6f7-1f66-48ca-ad90-195b0e9c9ad7',
        },
    },
    'Eq. Guinea': {
        polygon: {
            type: 'internal',
            datasetId: '1e6a83f8-93a2-4188-aa49-ab705d03c55b',
        },
        raster: {
            type: 'internal',
            datasetId: 'd2adec35-67b5-49d9-b9c1-1b0651cb178f',
        },
    },
    Gambia: {
        polygon: {
            type: 'internal',
            datasetId: '450bac8e-2787-4e8a-b9a0-b387d041b17f',
        },
        raster: {
            type: 'internal',
            datasetId: '51741d41-f69c-4412-8da3-1215a29341c2',
        },
    },
    'Hong Kong': {
        polygon: {
            type: 'internal',
            datasetId: 'd7d940f4-7b73-4152-af87-205675eb9cd9',
        },
        raster: {
            type: 'internal',
            datasetId: '30e96f6b-3867-4842-bda1-b8ebe5ed6cf0',
        },
    },
    Vatican: {
        polygon: {
            type: 'internal',
            datasetId: '2166c951-9b00-4ced-ae92-f911a5731bf2',
        },
        raster: {
            type: 'internal',
            datasetId: 'b733d2cd-4ba6-40a6-afaa-b034dfae36e9',
        },
    },
    Antarctica: {
        polygon: {
            type: 'internal',
            datasetId: 'be313d09-a6d6-4216-93bc-715b4cd896a6',
        },
        raster: {
            type: 'internal',
            datasetId: '376e8ac6-e099-4b6b-9367-226c9b7ec916',
        },
    },
    Australia: {
        polygon: {
            type: 'internal',
            datasetId: 'e9e72de4-0559-40b0-bf62-f17c79524d0b',
        },
        raster: {
            type: 'internal',
            datasetId: 'cc3fa402-79ae-433d-9d11-e2093ec562ff',
        },
    },
    Greenland: {
        polygon: {
            type: 'internal',
            datasetId: 'b99a321f-833f-4b65-92cb-8946f57a88cf',
        },
        raster: {
            type: 'internal',
            datasetId: '9cfdc060-ff30-49e1-8dcb-619f70e736cc',
        },
    },
    Fiji: {
        polygon: {
            type: 'internal',
            datasetId: 'a917c0ee-5cb9-43ab-8679-c6a809d96e61',
        },
        raster: {
            type: 'internal',
            datasetId: '3f391b18-8835-4933-be41-fdb5d6ab55e7',
        },
    },
    'New Zealand': {
        polygon: {
            type: 'internal',
            datasetId: '0eb245f3-bbe6-4077-aea3-8b83228d03c3',
        },
        raster: {
            type: 'internal',
            datasetId: '8576f1da-8e33-4ab8-8903-8bf520b0937a',
        },
    },
    'New Caledonia': {
        polygon: {
            type: 'internal',
            datasetId: 'bffe73e6-4b96-4b67-a903-07fcb7d8d9a6',
        },
        raster: {
            type: 'internal',
            datasetId: '3ef388bc-2c5b-4f8b-b0b0-1b52a6d4f6d3',
        },
    },
    Madagascar: {
        polygon: {
            type: 'internal',
            datasetId: '2cf06b80-3f8e-4f49-afcf-e4e4a7021145',
        },
        raster: {
            type: 'internal',
            datasetId: 'acae8af6-2332-40a9-967d-b025376dead7',
        },
    },
    Philippines: {
        polygon: {
            type: 'internal',
            datasetId: 'a3596a02-c2aa-4614-a11d-5ff181844bd9',
        },
        raster: {
            type: 'internal',
            datasetId: 'f2fd9caf-bdea-450e-8c57-1bd26cff8fcb',
        },
    },
    'Sri Lanka': {
        polygon: {
            type: 'internal',
            datasetId: '1ad1f21d-3211-472d-b333-3e24253c08d5',
        },
        raster: {
            type: 'internal',
            datasetId: '4582f08f-a99c-4a70-9fb7-1028d7282cd5',
        },
    },
    Curaçao: {
        polygon: {
            type: 'internal',
            datasetId: '78f5ed66-e966-482f-9b65-8ce64c7a689f',
        },
        raster: {
            type: 'internal',
            datasetId: '212a659e-8bf6-4873-9fbe-e4b5064c7181',
        },
    },
    Aruba: {
        polygon: {
            type: 'internal',
            datasetId: '379228f3-d59f-4133-bdd3-1ffc0c699874',
        },
        raster: {
            type: 'internal',
            datasetId: '4ac5e142-11b0-4b7f-baae-5a53604f5ed0',
        },
    },
    Bahamas: {
        polygon: {
            type: 'internal',
            datasetId: 'ae757fdc-540e-4fac-a1f6-6c6a1d7bcd1d',
        },
        raster: {
            type: 'internal',
            datasetId: '04cc9e27-c793-4208-9dae-f4ad4d7ef7fe',
        },
    },
    'Turks and Caicos Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'a6b14a40-a845-4512-85e0-83e6dd94ecf9',
        },
        raster: {
            type: 'internal',
            datasetId: '07d2866e-553c-46f0-9304-ffe6566b65e7',
        },
    },
    Taiwan: {
        polygon: {
            type: 'internal',
            datasetId: '4b5f14ec-978a-4253-8ecc-08c4d292cff9',
        },
        raster: {
            type: 'internal',
            datasetId: 'e4a35608-a07b-4f4b-b08c-c9d4a4638c60',
        },
    },
    Japan: {
        polygon: {
            type: 'internal',
            datasetId: '7a612883-3d99-4b40-bffb-09bb6402daf6',
        },
        raster: {
            type: 'internal',
            datasetId: 'b24768a1-91fe-498a-9a55-d4d5e4b23a62',
        },
    },
    'St. Pierre and Miquelon': {
        polygon: {
            type: 'internal',
            datasetId: 'd8d38b9d-c4a9-4659-91ca-a157a03086e6',
        },
        raster: {
            type: 'internal',
            datasetId: '274b231e-7b83-4ce6-a7b5-8ce28366621f',
        },
    },
    Iceland: {
        polygon: {
            type: 'internal',
            datasetId: '9c87ebcb-efbe-4994-a42d-a5f2d00ac12e',
        },
        raster: {
            type: 'internal',
            datasetId: 'e2f161e5-afb3-48e8-8c75-608f841ef6e7',
        },
    },
    'Pitcairn Is.': {
        polygon: {
            type: 'internal',
            datasetId: '8fe2e25f-43a5-4765-af8d-1bc00763e543',
        },
        raster: {
            type: 'internal',
            datasetId: '2f2f12cc-1873-4736-b4e2-fb2814453727',
        },
    },
    'Fr. Polynesia': {
        polygon: {
            type: 'internal',
            datasetId: 'bc5212ff-187d-47e3-854c-3957e65583e6',
        },
        raster: {
            type: 'internal',
            datasetId: '029a9c49-cd55-4054-b6ec-b3d39fcd9481',
        },
    },
    'Fr. S. Antarctic Lands': {
        polygon: {
            type: 'internal',
            datasetId: '67f31aa2-97a7-4949-953e-005a3b8c8ede',
        },
        raster: {
            type: 'internal',
            datasetId: 'd06bfe99-941f-4764-81d8-40ff4f37612e',
        },
    },
    Seychelles: {
        polygon: {
            type: 'internal',
            datasetId: 'ded832e5-894a-472e-b304-4cce94528757',
        },
        raster: {
            type: 'internal',
            datasetId: '7f291c00-6da0-48b2-ab7a-08984eb03326',
        },
    },
    Kiribati: {
        polygon: {
            type: 'internal',
            datasetId: '0ad08627-9874-4cde-903e-3ef58ded36cf',
        },
        raster: {
            type: 'internal',
            datasetId: '62a20da5-816d-466d-a1e3-07a57e8d44f0',
        },
    },
    'Marshall Is.': {
        polygon: {
            type: 'internal',
            datasetId: '8765bf99-e40b-4643-aee2-8c9957420d34',
        },
        raster: {
            type: 'internal',
            datasetId: 'f2b59436-2557-43a5-bae1-144b5bf7dcc0',
        },
    },
    'Trinidad and Tobago': {
        polygon: {
            type: 'internal',
            datasetId: 'b284ceb3-fd1c-4730-b7c9-3b4990aee539',
        },
        raster: {
            type: 'internal',
            datasetId: '16ddc703-57ea-4dbc-b1e3-d03b90002980',
        },
    },
    Grenada: {
        polygon: {
            type: 'internal',
            datasetId: 'f5d70f49-5861-4c4c-8c37-e45259395ba5',
        },
        raster: {
            type: 'internal',
            datasetId: '0d5ebb2c-a8cc-4481-909d-e929eda987e6',
        },
    },
    'St. Vin. and Gren.': {
        polygon: {
            type: 'internal',
            datasetId: 'c356d274-2a6f-45c9-9b36-7a95fa6d226e',
        },
        raster: {
            type: 'internal',
            datasetId: '061071c7-696a-474f-bcd7-83739ff68c77',
        },
    },
    Barbados: {
        polygon: {
            type: 'internal',
            datasetId: 'bc8d9ff1-8343-4294-9c96-267a1a739f38',
        },
        raster: {
            type: 'internal',
            datasetId: '47cd861c-0c66-4c84-a92c-21ad1c6943c8',
        },
    },
    'Saint Lucia': {
        polygon: {
            type: 'internal',
            datasetId: '5a8c5e49-5e71-4871-a574-f3e3a94fc549',
        },
        raster: {
            type: 'internal',
            datasetId: '7a512237-1df4-4b89-a32b-9faf8b3279a7',
        },
    },
    Dominica: {
        polygon: {
            type: 'internal',
            datasetId: '3c76e9a9-5adf-4f0f-ad07-f80788e30e4c',
        },
        raster: {
            type: 'internal',
            datasetId: '2ea8f56d-e9a3-4997-8392-0b4c39298816',
        },
    },
    Montserrat: {
        polygon: {
            type: 'internal',
            datasetId: 'b422d6a0-dbaf-4b8f-a455-5f58ca5d6c53',
        },
        raster: {
            type: 'internal',
            datasetId: '2a29800a-84d0-40c7-855f-dde97b277ce3',
        },
    },
    'Antigua and Barb.': {
        polygon: {
            type: 'internal',
            datasetId: '22ca33df-0855-444b-81dd-c57676ed0979',
        },
        raster: {
            type: 'internal',
            datasetId: 'cf08909d-1e56-4df2-b2b4-3175d4839402',
        },
    },
    'St. Kitts and Nevis': {
        polygon: {
            type: 'internal',
            datasetId: '20edfea3-2479-45a7-ac34-d6d20fc8ef27',
        },
        raster: {
            type: 'internal',
            datasetId: 'a900bd6e-fc8e-47f0-8ed0-0fb698562ed8',
        },
    },
    'U.S. Virgin Is.': {
        polygon: {
            type: 'internal',
            datasetId: '192a9455-238e-4b61-bced-061da16749bc',
        },
        raster: {
            type: 'internal',
            datasetId: '60a72609-4af2-4b3f-9573-87c41062e2f5',
        },
    },
    'St-Barth\u00e9lemy': {
        polygon: {
            type: 'internal',
            datasetId: '6e09c68c-7719-4069-be8b-5801f8f446e3',
        },
        raster: {
            type: 'internal',
            datasetId: 'bd2e80f4-bdf8-4e2c-af65-679197b40de1',
        },
    },
    'Puerto Rico': {
        polygon: {
            type: 'internal',
            datasetId: '2b486286-fdcd-4f3e-aefd-4f3016551006',
        },
        raster: {
            type: 'internal',
            datasetId: '2b25ab57-b3c7-46be-b947-520adff30423',
        },
    },
    Anguilla: {
        polygon: {
            type: 'internal',
            datasetId: 'ceea83a8-cc83-4d79-a66a-92cb8bcaa31b',
        },
        raster: {
            type: 'internal',
            datasetId: '57b431b7-6bcf-414a-a5b3-1271a685a3da',
        },
    },
    'British Virgin Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'e488152a-a179-4783-86e4-3571415577d1',
        },
        raster: {
            type: 'internal',
            datasetId: '47645863-a1dc-40f7-8df7-d5071ce49b0d',
        },
    },
    Jamaica: {
        polygon: {
            type: 'internal',
            datasetId: 'd2cf351f-d222-43d3-82f7-1e4051738d39',
        },
        raster: {
            type: 'internal',
            datasetId: '2e47beed-5e25-4573-82ea-39e8e988f108',
        },
    },
    'Cayman Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'ee412aa7-7d60-43a1-a323-6a9664d895fb',
        },
        raster: {
            type: 'internal',
            datasetId: '71dce41e-8e82-4905-b9be-31eb305bf8ec',
        },
    },
    Bermuda: {
        polygon: {
            type: 'internal',
            datasetId: '68a5763f-c9dc-4800-8f08-e481373f8d1b',
        },
        raster: {
            type: 'internal',
            datasetId: 'b1513ec0-8c7e-4fb1-aede-fc8442ab6644',
        },
    },
    'Heard I. and McDonald Is.': {
        polygon: {
            type: 'internal',
            datasetId: '2951db3e-9ce7-4cab-9e6f-ccdab7c60126',
        },
        raster: {
            type: 'internal',
            datasetId: '238f62a3-caca-4d08-bac1-1e8dfef4d1b4',
        },
    },
    'Saint Helena': {
        polygon: {
            type: 'internal',
            datasetId: 'a4622a2c-d7fe-4405-a64a-d2cb1c0b914e',
        },
        raster: {
            type: 'internal',
            datasetId: 'b4545fc4-a1e3-45e5-a007-2b8319a8b4cd',
        },
    },
    Mauritius: {
        polygon: {
            type: 'internal',
            datasetId: '80dc9c14-4c35-44e3-9f27-a445eb515118',
        },
        raster: {
            type: 'internal',
            datasetId: '2fd826b3-a443-4dd6-9029-95eae5dda080',
        },
    },
    Comoros: {
        polygon: {
            type: 'internal',
            datasetId: 'e83fbbd2-7c74-42a9-aebb-4674084c8177',
        },
        raster: {
            type: 'internal',
            datasetId: 'ed2bcb48-b3e0-4b41-b0c5-af9010861122',
        },
    },
    'S\u00e3o Tom\u00e9 and Principe': {
        polygon: {
            type: 'internal',
            datasetId: 'e7b3f481-4cd3-46bd-ba7b-77f77d4b542e',
        },
        raster: {
            type: 'internal',
            datasetId: 'b646b029-a5a6-4a74-a6a7-58672c8638a4',
        },
    },
    'Cabo Verde': {
        polygon: {
            type: 'internal',
            datasetId: '07991816-6c60-4742-9f3b-697876c5b9b2',
        },
        raster: {
            type: 'internal',
            datasetId: 'ac875275-cc8c-4cd3-b043-be87ddf5aa09',
        },
    },
    Malta: {
        polygon: {
            type: 'internal',
            datasetId: '98134b0c-cc64-4e05-ac5f-4d07be697d0d',
        },
        raster: {
            type: 'internal',
            datasetId: '6473dda4-4393-4b5e-9475-8e405eb2f030',
        },
    },
    Jersey: {
        polygon: {
            type: 'internal',
            datasetId: '9c1cb144-9d5f-4912-a701-7e471eddf51b',
        },
        raster: {
            type: 'internal',
            datasetId: '2d625119-b187-4b5a-9798-af83085a3d62',
        },
    },
    Guernsey: {
        polygon: {
            type: 'internal',
            datasetId: '0d8b35f2-fc12-4810-9b6a-0e315d542373',
        },
        raster: {
            type: 'internal',
            datasetId: '05072c45-0f96-4786-a2c0-d80802147cb8',
        },
    },
    'Isle of Man': {
        polygon: {
            type: 'internal',
            datasetId: 'e73b716e-7549-4e9d-a03a-7cf75cef548c',
        },
        raster: {
            type: 'internal',
            datasetId: '5c5afb3c-6b4e-4634-bfec-1cb5ee238131',
        },
    },
    'Faeroe Is.': {
        polygon: {
            type: 'internal',
            datasetId: '23d5a0f7-4eca-44fd-998b-cd269f043d88',
        },
        raster: {
            type: 'internal',
            datasetId: 'ba077529-918d-4695-a5c3-6c2a060bc588',
        },
    },
    'Br. Indian Ocean Ter.': {
        polygon: {
            type: 'internal',
            datasetId: 'e3290cd7-1dc1-4e32-bb38-9f3ea891d94e',
        },
        raster: {
            type: 'internal',
            datasetId: 'd1dcb77e-f0a1-407f-aecf-7b460393cd4c',
        },
    },
    Singapore: {
        polygon: {
            type: 'internal',
            datasetId: 'd424cf1d-baa4-4277-87a6-f1ffac526e64',
        },
        raster: {
            type: 'internal',
            datasetId: '809d63ee-b546-452e-8088-c731219e3114',
        },
    },
    'Norfolk Island': {
        polygon: {
            type: 'internal',
            datasetId: '0b743095-a3ee-4c3b-8f5f-d306e2af48ff',
        },
        raster: {
            type: 'internal',
            datasetId: '5e9cb157-e11a-447c-af20-231780a6883d',
        },
    },
    'Cook Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'd7f8e660-76bd-45c1-8d66-0f04db6e7a4c',
        },
        raster: {
            type: 'internal',
            datasetId: 'd1227261-e7f6-4469-9bac-930180ba1e27',
        },
    },
    Tonga: {
        polygon: {
            type: 'internal',
            datasetId: 'cac64c8f-6fa7-4909-b09c-f924ecbd10c7',
        },
        raster: {
            type: 'internal',
            datasetId: '0401ab25-106e-44ec-98b4-9ca1b6f4d0cb',
        },
    },
    'Wallis and Futuna Is.': {
        polygon: {
            type: 'internal',
            datasetId: '7f2c3dc2-40ae-40bf-93de-23338b3c6c48',
        },
        raster: {
            type: 'internal',
            datasetId: '9552fdd0-5012-4e72-b726-5d1d3b524b72',
        },
    },
    Samoa: {
        polygon: {
            type: 'internal',
            datasetId: '666ea9b6-6d80-4927-8f7d-d17b6b28c64a',
        },
        raster: {
            type: 'internal',
            datasetId: '833d4180-9dc5-496d-9414-24e874021cb4',
        },
    },
    'Solomon Is.': {
        polygon: {
            type: 'internal',
            datasetId: '1d3b3234-c768-48cf-aea8-6884d738b6a4',
        },
        raster: {
            type: 'internal',
            datasetId: '2f84656d-3a73-4ed9-b109-a63d32a9129a',
        },
    },
    Tuvalu: {
        polygon: {
            type: 'internal',
            datasetId: 'a6d26b1b-61da-49d5-b2c4-c14a36f85f31',
        },
        raster: {
            type: 'internal',
            datasetId: '481ae41b-94fb-4eed-8d0d-51bf722c5075',
        },
    },
    Maldives: {
        polygon: {
            type: 'internal',
            datasetId: '9588aee8-945e-4f41-bcce-36085ca7115f',
        },
        raster: {
            type: 'internal',
            datasetId: 'af59c999-6a37-4f08-b995-9ad72defc50a',
        },
    },
    Nauru: {
        polygon: {
            type: 'internal',
            datasetId: '99b1ed71-b15f-4e40-b808-4d4a0b9b17c2',
        },
        raster: {
            type: 'internal',
            datasetId: '239c86c7-7290-42c7-b6b0-bb3afe59eb01',
        },
    },
    Micronesia: {
        polygon: {
            type: 'internal',
            datasetId: '19120243-fdb9-4efe-adf4-478907b5b689',
        },
        raster: {
            type: 'internal',
            datasetId: 'fcb79e71-835b-46ca-bf88-7c14aa581540',
        },
    },
    'S. Geo. and the Is.': {
        polygon: {
            type: 'internal',
            datasetId: '93a74688-f2b4-4caf-bc30-dbd778a4aa47',
        },
        raster: {
            type: 'internal',
            datasetId: '9ba66af1-8cbf-477c-882e-86bf5f17f493',
        },
    },
    'Falkland Is.': {
        polygon: {
            type: 'internal',
            datasetId: '5ee84361-d9fd-45b8-b744-7e853f126687',
        },
        raster: {
            type: 'internal',
            datasetId: 'b9147883-ac96-4318-b841-1b75c82d815b',
        },
    },
    Vanuatu: {
        polygon: {
            type: 'internal',
            datasetId: '03f748b9-2d34-45ee-8bf8-8692322c9cf8',
        },
        raster: {
            type: 'internal',
            datasetId: 'ce40bcb3-9e6e-46c2-8dda-ef59f0bc6991',
        },
    },
    Niue: {
        polygon: {
            type: 'internal',
            datasetId: 'e9a23c06-632a-4e75-8f0d-d7789a96351f',
        },
        raster: {
            type: 'internal',
            datasetId: '353916dc-4ca4-4e41-ba0b-b565599af582',
        },
    },
    'American Samoa': {
        polygon: {
            type: 'internal',
            datasetId: '50c4b689-153f-47d2-8ada-603747a01604',
        },
        raster: {
            type: 'internal',
            datasetId: 'ac258909-8cc8-4a13-a20a-6cf7297eeb9a',
        },
    },
    Palau: {
        polygon: {
            type: 'internal',
            datasetId: 'ba85d80b-726b-4a01-94f2-2c8c52dc3432',
        },
        raster: {
            type: 'internal',
            datasetId: '72249ba8-47ca-41ba-bc7d-1abf11277468',
        },
    },
    Guam: {
        polygon: {
            type: 'internal',
            datasetId: '0388e1ba-415b-4a30-beb5-e6e78e4465fc',
        },
        raster: {
            type: 'internal',
            datasetId: 'e5fd4c61-2876-4c13-889b-4fa9fe6407dd',
        },
    },
    'N. Mariana Is.': {
        polygon: {
            type: 'internal',
            datasetId: '8e8745b5-2b02-4cc2-862e-c2af672fe1bd',
        },
        raster: {
            type: 'internal',
            datasetId: '25053625-678d-4e67-b4b6-b29200e0bc23',
        },
    },
    Bahrain: {
        polygon: {
            type: 'internal',
            datasetId: 'cb552a76-6e0d-4231-ac16-3f9f655b2a5f',
        },
        raster: {
            type: 'internal',
            datasetId: '715f4769-acbb-40c2-b8e0-203cdc13f316',
        },
    },
    'Coral Sea Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'bbaa567e-5ef8-4d4b-9b7d-54a1faf9c67c',
        },
        raster: {
            type: 'internal',
            datasetId: '847fbffd-4504-403d-b368-775f237a516c',
        },
    },
    'Spratly Is.': {
        polygon: {
            type: 'internal',
            datasetId: 'e7078d6c-25aa-4f13-b159-bdd5b9d363c3',
        },
        raster: {
            type: 'internal',
            datasetId: '027a3f4d-df6c-4cb6-9433-4fdabd6f78ac',
        },
    },
    'Clipperton I.': {
        polygon: {
            type: 'internal',
            datasetId: '80f2824c-2439-4b34-9121-5ecd7ea6107c',
        },
        raster: {
            type: 'internal',
            datasetId: '0283b05d-ca8b-4fe0-96c3-ce5cb5ca2ae0',
        },
    },
    Macao: {
        polygon: {
            type: 'internal',
            datasetId: '5060242b-f4a7-4b8d-8d1e-0dd05d9e34b0',
        },
        raster: {
            type: 'internal',
            datasetId: '44585287-269c-476f-8a2f-c35b5f6cdb3a',
        },
    },
    'Ashmore and Cartier Is.': {
        polygon: {
            type: 'internal',
            datasetId: '2fe583ac-427d-4c0b-b81e-1eebf4ea2f58',
        },
        raster: {
            type: 'internal',
            datasetId: '177cad8c-e1ff-42d7-b256-59b0f1283244',
        },
    },
};

export const COUNTRY_METADATA: Array<[string, number, number, number, number, number]> = [
    ['Indonesia', 140.977626994, 5.91010163000004, 95.012705925, -10.9226213519999, 1],
    ['Malaysia', 119.278086785, 7.35578034100007, 99.6452280600001, 0.851370341000106, 2],
    ['Chile', -66.4208064439999, -17.5065881979999, -109.453724739, -55.9185042229999, 3],
    ['Bolivia', -57.4656607669999, -9.67982147199999, -69.6664922699999, -22.897257588, 4],
    ['Peru', -68.6842524829999, -0.029092711999922, -81.3375575289999, -18.3377462063681, 5],
    ['Argentina', -53.6615518799999, -21.786937764, -73.5880358489999, -55.0520158829999, 6],
    ['Cyprus', 34.0991317070001, 35.1870821300001, 32.2717391290001, 34.62501943, 8],
    ['India', 97.362253052, 35.4954055790001, 68.1434025400001, 6.74555084800005, 9],
    ['China', 134.772579387, 53.5694444790001, 73.6022563070001, 15.7753766950001, 10],
    ['Lebanon', 36.604101196, 34.687547913, 35.0996199880001, 33.055580342, 13],
    ['Ethiopia', 47.9791691490001, 14.879532166, 32.9897998450001, 3.40333343500009, 14],
    ['Somalia', 51.4170378110001, 11.9891186460001, 40.9653853760001, -1.69630299299996, 16],
    ['Kenya', 41.8850191650001, 5.0303758226077, 33.8904683840001, -4.67750416499996, 17],
    ['Pakistan', 77.0489709880001, 37.054483541, 60.8443787030001, 23.694525458, 18],
    ['Malawi', 35.9042989500001, -9.38123504699988, 32.6633081470001, -17.1353353879999, 19],
    ['Tanzania', 40.4493921230001, -0.98583017999988, 29.3210315350001, -11.731272482, 20],
    ['Syria', 42.377185506, 37.3249063110001, 35.7233992850001, 32.3130416870001, 21],
    ['France', 55.8545028, 51.0875408837188, -61.7978409499999, -21.3707821589999, 23],
    ['Suriname', -53.9863574539999, 6.01157376600008, -58.0676912029999, 1.83350677500006, 24],
    ['Guyana', -56.4818190109999, 8.55801015800006, -61.3967128089999, 1.18582021100008, 25],
    ['South Korea', 131.862521886, 38.6243350280001, 124.613617384, 33.1975772160001, 26],
    ['North Korea', 130.699961785, 43.0102698780001, 124.211315989, 37.6756045590001, 27],
    ['Morocco', -1.03199947099995, 35.9265191490001, -17.0137433253932, 21.4199710975834, 28],
    ['W. Sahara', -8.68080908199988, 27.661465149, -17.1046443349999, 20.7669131530001, 29],
    ['Costa Rica', -82.5628368739999, 11.2099370320001, -87.1176651679999, 5.51508209800005, 30],
    ['Nicaragua', -82.7256973949999, 15.0309699500001, -87.6858210929999, 10.7134815470001, 31],
    ['Congo', 18.64240686, 3.70827606200005, 11.1140163041098, -5.01963083599992, 32],
    ['Dem. Rep. Congo', 31.2804468180001, 5.37528025300008, 12.2105412120001, -13.4583505239999, 33],
    ['Bhutan', 92.0887764890001, 28.3583989307862, 88.730066772, 26.6961493940001, 34],
    ['Ukraine', 40.1595430910001, 52.3689492800001, 22.1328398030001, 45.213568427, 35],
    ['Belarus', 32.7195321040001, 56.1568059290001, 23.165644979, 51.2351683560001, 36],
    ['Namibia', 25.2597807210001, -16.9510572309999, 11.7176212900001, -28.9593681839999, 37],
    ['South Africa', 37.9777938160001, -22.1264519249999, 16.4699813160001, -46.9657528629999, 38],
    ['St-Martin', -63.0107315749999, 18.1221377620001, -63.1468399729999, 18.0333914723513, 39],
    ['Sint Maarten', -63.0175685852884, 18.0621198590001, -63.1188858709999, 18.0191104190001, 40],
    ['Oman', 59.8445744150001, 26.385972398, 51.9786149500001, 16.6424014340001, 41],
    ['Uzbekistan', 73.1486405840001, 45.558718974, 55.975838663, 37.1851474, 42],
    ['Kazakhstan', 87.3237960210001, 55.434550273, 46.478278849, 40.5846556600001, 43],
    ['Tajikistan', 75.1641247970001, 41.0399767050001, 67.3426900630001, 36.6786408490001, 44],
    ['Lithuania', 26.8007202560001, 56.442602437, 20.924568700365, 53.886841126, 45],
    ['Brazil', -28.8770645819999, 5.26722483300003, -74.0184746909999, -33.7422803749999, 46],
    ['Uruguay', -53.1108361419999, -30.0968698119999, -58.4393611319999, -34.9734026019999, 47],
    ['Mongolia', 119.907026815, 52.129584046, 87.7357088630001, 41.586144918, 48],
    ['Russia', 180, 81.8587100280001, -180, 41.1926805620001, 49],
    ['Czechia', 18.8374337160001, 51.0400123090001, 12.076140991, 48.557915752, 50],
    ['Germany', 15.0220593670001, 55.0653343770001, 5.85248986800011, 47.2711209110001, 51],
    ['Estonia', 28.1864754640001, 59.670884507, 21.8323673840001, 57.515818583, 52],
    ['Latvia', 28.2172746170001, 58.0751384490001, 20.9685978520001, 55.6669908660001, 53],
    ['Sweden', 24.1634135340001, 69.0363556930001, 11.1081649100001, 55.3426781270001, 55],
    ['Finland', 31.5695247800001, 70.0753103640001, 20.62316451, 59.811224677, 56],
    ['Vietnam', 109.472422722, 23.3662751270001, 102.118655233, 8.56557851800005, 57],
    ['Cambodia', 107.610516399, 14.704581605, 102.313423706, 10.41577362, 58],
    ['Luxembourg', 6.50257938700014, 50.1749746710001, 5.71492720500004, 49.441324362, 59],
    ['United Arab Emirates', 56.3836369150001, 26.0747919720001, 51.56934655, 22.6209459430001, 60],
    ['Belgium', 6.37452518700007, 51.496237691, 2.52179992754569, 49.4952228810001, 61],
    ['Georgia', 46.694803101, 43.57584259, 39.9859763554366, 41.0441108200001, 62],
    ['Macedonia', 23.0095821530001, 42.3703347790001, 20.4441573490001, 40.849394023, 63],
    ['Albania', 21.0366793210001, 42.6548135380001, 19.2720325110001, 39.637013245, 64],
    ['Azerbaijan', 50.6257430350001, 41.8904415900001, 44.7745585530001, 38.392644755, 65],
    ['Kosovo', 21.7727584220001, 43.263070984, 20.024751424, 41.8440103160001, 66],
    ['Turkey', 44.8069928290001, 42.0987816430001, 25.663259311, 35.8197785450001, 67],
    ['Spain', 4.33708743600005, 43.793443101, -18.1672257149999, 27.6422386740001, 68],
    ['Laos', 107.66436324, 22.4960440070001, 100.097073202, 13.9154566450001, 69],
    ['Kyrgyzstan', 80.2575606690001, 43.2617015580001, 69.2262960200001, 39.1892369590001, 70],
    ['Armenia', 46.6026123460001, 41.2904523730001, 43.4362939860001, 38.863701274, 71],
    ['Denmark', 15.1513778000001, 57.751166083, 8.09400475400008, 54.568589585, 72],
    ['Libya', 25.1562606130001, 33.181225315, 9.28654382300007, 19.496123759, 73],
    ['Tunisia', 11.5641309000001, 37.3452009140001, 7.47983239800007, 30.2289053350001, 74],
    ['Romania', 29.6995548840001, 48.2748322560001, 20.2428259690001, 43.6500499480001, 75],
    ['Hungary', 22.8776005460001, 48.5692328900001, 16.0940352780001, 45.741343486, 76],
    ['Slovakia', 22.5396366780001, 49.601779684, 16.8444804280001, 47.7500064090001, 77],
    ['Poland', 24.1431563720001, 54.838324286, 14.123922973, 48.9940131640001, 78],
    ['Ireland', -5.99351966099994, 55.3863792990001, -10.4781794909999, 51.4457054710001, 79],
    ['United Kingdom', 1.77116946700005, 60.84788646, -13.6913142569999, 49.9096133480001, 80],
    ['Greece', 28.2397567070001, 41.7504759730001, 19.6264754570001, 34.8150088560001, 81],
    ['Zambia', 33.674202515, -8.19412404299992, 21.9798775630001, -18.0692318719999, 82],
    ['Sierra Leone', -10.2822358799999, 9.99600596100007, -13.301096158, 6.91941966400009, 83],
    ['Guinea', -7.66244746999996, 12.673387757, -15.0811254549999, 7.1902082320001, 84],
    ['Liberia', -7.38411820499994, 8.56539560900006, -11.4761856759999, 4.34723541900007, 85],
    ['Central African Rep.', 27.4413013100001, 11.0008283490001, 14.3872660720001, 2.23645375600005, 86],
    ['Sudan', 38.6038517590001, 22.2269648230001, 21.8094486900001, 8.68164174400005, 87],
    ['Djibouti', 43.4187117850001, 12.7079125020001, 41.7491101480001, 10.9298249310001, 88],
    ['Eritrea', 43.1238712900001, 18.004828192, 36.423647095, 12.3600218710001, 89],
    ['Austria', 17.1483378500001, 49.0097744750001, 9.52115482500011, 46.3786430870001, 90],
    ['Iraq', 48.559255405, 37.3754975380001, 38.774511352, 29.063136699, 91],
    ['Italy', 18.5174259770001, 47.0852149450001, 6.60272831200007, 35.489243882, 92],
    ['Switzerland', 10.466626831, 47.8011660770001, 5.95480920400013, 45.820718486, 93],
    ['Iran', 63.319628133, 39.7715269980001, 44.0148633220001, 25.059408165, 94],
    ['Netherlands', 7.19850590000004, 53.558091539, -68.4173884759999, 12.0220401060001, 95],
    ['Liechtenstein', 9.61572269700011, 47.2628010050001, 9.47588627100012, 47.052400412, 96],
    ['Côte d"Ivoire', -2.50632808399993, 10.72647817, -8.61871984899992, 4.34406159100007, 97],
    ['Serbia', 22.9845707600001, 46.1738752240001, 18.8449784750001, 42.2349448200001, 98],
    ['Mali', 4.23563765500012, 24.9950645960001, -12.2641304119999, 10.1400540170001, 99],
    ['Senegal', -11.3777762449999, 16.691385397, -17.5360408189999, 12.3056065880001, 100],
    ['Nigeria', 14.6699361570001, 13.8802908320001, 2.67108199000012, 4.27216217700004, 101],
    ['Benin', 3.83741906700001, 12.3992442830001, 0.759880818000113, 6.21389394700009, 102],
    ['Angola', 24.0617143150001, -4.39120371499993, 11.6693941430001, -18.0314047239999, 103],
    ['Croatia', 19.4078381750001, 46.5469790650001, 13.5014754570001, 42.4163272160001, 104],
    ['Slovenia', 16.5153015540001, 46.863962301, 13.3652612710001, 45.42363678, 105],
    ['Qatar', 51.6165470710001, 26.16010163, 50.750987175, 24.5598715210001, 106],
    ['Saudi Arabia', 55.637564738, 32.1213479620001, 34.5727645190001, 16.3709577490001, 107],
    ['Botswana', 29.3500736890001, -17.7818075559999, 19.9783459880001, -26.891794128, 108],
    ['Zimbabwe', 33.0427681890001, -15.6148080449999, 25.219369751, -22.3973397829999, 109],
    ['Bulgaria', 28.6035262380001, 44.228434539, 22.3450232340001, 41.238104147, 110],
    ['Thailand', 105.650997762, 20.4450064090001, 97.3514010010001, 5.62989003500006, 111],
    ['San Marino', 12.4923922540001, 43.9825667860001, 12.3856287450001, 43.892055515, 112],
    ['Haiti', -71.6391108809999, 20.08978913, -74.4891658189999, 18.0259463560001, 113],
    ['Dominican Rep.', -68.3286026679999, 19.93768952, -72.0098376059999, 17.5455589860001, 114],
    ['Chad', 23.9844063720001, 23.4447199510001, 13.4491837970001, 7.4555667110001, 115],
    ['Kuwait', 48.4327812270001, 30.0982156370001, 46.53243575, 28.533504944, 116],
    ['El Salvador', -87.6931935119999, 14.4453726200001, -90.1147790119999, 13.158636786, 117],
    ['Guatemala', -88.2209366529999, 17.8160195930001, -92.2462565039999, 13.7314040089806, 118],
    ['Timor-Leste', 127.313243035, -8.13502369599991, 124.03003991, -9.50122772199997, 119],
    ['Brunei', 115.360741008, 5.05719635600008, 113.99878991, 4.01668101000004, 120],
    ['Monaco', 7.43745403212602, 43.763505554, 7.36575020700008, 43.7179690770001, 121],
    ['Algeria', 11.9688607170001, 37.09393952, -8.68238521299989, 18.9755612180001, 122],
    ['Mozambique', 40.8479923840001, -10.4690080709999, 30.2138452550001, -26.8602715039999, 123],
    ['eSwatini', 32.117398316, -25.735999044, 30.7829061280001, -27.3162643429999, 124],
    ['Burundi', 30.8339624430001, -2.30306243899989, 28.9868917230001, -4.46334401499993, 125],
    ['Rwanda', 30.8878092850001, -1.05869394899987, 28.8572355550001, -2.82685475699989, 126],
    ['Myanmar', 101.173855021, 28.5384658810001, 92.174972779, 9.79071686400005, 127],
    ['Bangladesh', 92.642851197, 26.6235440070001, 88.0217895920001, 20.738714911, 128],
    ['Andorra', 1.76509078000015, 42.649361674, 1.4064563390001, 42.42867747, 129],
    ['Afghanistan', 74.8923067630001, 38.4736734020001, 60.4867777910001, 29.386605326, 130],
    ['Montenegro', 20.3551705320001, 43.547885641, 18.4335307210001, 41.8523623720001, 131],
    ['Bosnia and Herz.', 19.618884725, 45.2845238250001, 15.7160738520001, 42.5592121380001, 132],
    ['Uganda', 35.0064726150001, 4.21969187500009, 29.5484595130001, -1.47520599399985, 133],
    ['Cuba', -74.1328832669999, 23.26557038, -84.9496150379999, 19.827826239, 135],
    ['Honduras', -83.1304444724479, 17.418646552, -89.3637912599999, 12.9797773240001, 136],
    ['Ecuador', -75.2272639579999, 1.66437409100007, -92.0115860669999, -5.01137257899994, 137],
    ['Colombia', -66.8750605879999, 13.57835521, -81.7237035799999, -4.23648447699991, 138],
    ['Paraguay', -54.2452888589999, -19.286728617, -62.6503572189999, -27.5868421429999, 139],
    ['Portugal', -6.20594722499993, 42.15362966, -31.2849014959999, 30.029242255, 140],
    ['Moldova', 30.1315763750001, 48.4860338340001, 26.617889038, 45.4617739870001, 141],
    ['Turkmenistan', 66.6457816980001, 42.791187643, 52.4376706173556, 35.140646871, 142],
    ['Jordan', 39.2919991450001, 33.3716850790001, 34.9493851167955, 29.189950664, 143],
    ['Nepal', 88.1690674240001, 30.4169041950001, 80.03028772, 26.3437678020001, 144],
    ['Lesotho', 29.4359082440001, -28.570761414, 27.0021549890001, -30.6587993359999, 145],
    ['Cameroon', 16.2077234290001, 13.081140646, 8.50505618600005, 1.65455129000013, 146],
    ['Gabon', 14.4989905190001, 2.32249501600012, 8.69556725400008, -3.93685618979604, 147],
    ['Niger', 15.9703218990001, 23.5173511760001, 0.152941121000111, 11.69577301, 148],
    ['Burkina Faso', 2.39016890400009, 15.0799075320001, -5.52257808499988, 9.39188262900011, 149],
    ['Togo', 1.78235070800014, 11.1349803670001, -0.16610917099996, 6.10049062700006, 150],
    ['Ghana', 1.18796838400004, 11.162937317, -3.26250931799999, 4.73712799700007, 151],
    ['Guinea-Bissau', -13.6607118329999, 12.6794339000001, -16.7284367769145, 10.9276390650001, 152],
    ['Gibraltar', -5.33877348324262, 36.1411196719999, -5.35838675846141, 36.1105003930001, 153],
    ['United States of America', 179.780935092, 71.4125023460001, -179.143503384, 18.9061171430001, 154],
    ['Canada', -52.6166072259999, 83.1165225280001, -141.005563931, 41.6690855920001, 155],
    ['Mexico', -86.7005916009999, 32.7128364050001, -118.368804229, 14.5462794760001, 156],
    ['Belize', -87.7830704419999, 18.490758769, -89.2365122079999, 15.8796519990001, 157],
    ['Panama', -77.1632698159999, 9.62929248000006, -83.053246217, 7.20571523600006, 158],
    ['Venezuela', -59.8155948489999, 15.7029483090001, -73.3911486409999, 0.64931549100001, 159],
    ['Papua New Guinea', 155.96753991, -1.34636809699992, 140.84921106, -11.6363257789999, 160],
    ['Egypt', 36.8991805350001, 31.65648021, 24.6883427320001, 21.9943692020001, 161],
    ['Yemen', 54.5402938160001, 18.9956375130001, 42.5457462900001, 12.1114436720001, 162],
    ['Mauritania', -4.8216131179999, 27.2854157510001, -17.0811748859999, 14.7343989060001, 163],
    ['Eq. Guinea', 11.3363411870001, 3.77240631700005, 5.61198978000004, -1.47568124799994, 164],
    ['Gambia', -13.8187125249999, 13.8199844360001, -16.8297013009999, 13.0650088560001, 165],
    ['Hong Kong', 114.40129642, 22.5639460320001, 113.837331576, 22.1770694030001, 166],
    ['Vatican', 12.4540354420001, 41.9039147380001, 12.4527140820001, 41.9027519410001, 167],
    ['Antarctica', 180, -60.5162085919999, -180, -89.9999999999999, 173],
    ['Australia', 159.106455925, -9.24016692499993, 112.919444207, -54.7504208309999, 174],
    ['Greenland', -11.3768204419999, 83.6341006530001, -73.0572403639999, 59.7926292990001, 175],
    ['Fiji', 180, -12.4752743469999, -180, -21.7111141909999, 176],
    ['New Zealand', 178.843923373, -8.54322682099991, -177.9579972, -52.6003132709999, 177],
    ['New Caledonia', 171.343765287, -19.6237118469999, 163.615733269, -22.6706682269999, 178],
    ['Madagascar', 50.5039168630001, -11.9436174459999, 43.2229110040001, -25.5985653629999, 179],
    ['Philippines', 126.617686394, 21.1223819030001, 116.954925977, 4.65570709800005, 180],
    ['Sri Lanka', 81.890310092, 9.82957591400009, 79.6557723320001, 5.92373281500005, 181],
    ['Curaçao', -68.7397354809999, 12.3915062520001, -69.1717423169999, 12.0413272160001, 182],
    ['Aruba', -69.8768204419999, 12.6321475280001, -70.0624080069999, 12.417669989, 183],
    ['Bahamas', -72.7461645169999, 26.928412177, -79.5943497389999, 20.912398909, 184],
    ['Turks and Caicos Is.', -71.1288956369999, 21.959214585, -72.4813126289999, 21.2901065120001, 185],
    ['Taiwan', 122.005381707, 25.2874209660001, 118.279551629, 21.9046084660001, 186],
    ['Japan', 153.985606316, 45.5204125020001, 122.938161655, 24.212103583, 187],
    ['St. Pierre and Miquelon', -56.1447647779999, 47.1412621110001, -56.3965958319999, 46.7527529970001, 188],
    ['Iceland', -13.5029190749999, 66.564154364, -24.5399063789999, 63.396714585, 189],
    ['Pitcairn Is.', -124.778065559, -23.9244117169999, -130.753081835, -25.0770809879999, 190],
    ['Fr. Polynesia', -134.942982551, -7.95012786299992, -154.536976692, -27.6412085919999, 191],
    ['Fr. S. Antarctic Lands', 77.585215691, -11.5506324199999, 39.7282820970001, -49.7216122379999, 192],
    ['Seychelles', 56.2874455090001, -3.79111093499995, 46.2073673840001, -9.75554778399993, 193],
    ['Kiribati', 176.850922071, 4.72308991100005, -174.543405728, -11.4611141909999, 194],
    ['Marshall Is.', 172.029795769, 14.6105003930001, 165.282237175, 4.57379791900007, 195],
    ['Trinidad and Tobago', -60.5220841139999, 11.3510602890001, -61.9287003249999, 10.0420596370001, 196],
    ['Grenada', -61.4216202459999, 12.529730536, -61.7905167309999, 12.0028343770001, 197],
    ['St. Vin. and Gren.', -61.1239314439999, 13.3807640650001, -61.4598282539999, 12.585150458, 198],
    ['Barbados', -59.4269099599999, 13.3445498720001, -59.6542048819999, 13.0511742210001, 199],
    ['Saint Lucia', -60.8829646479999, 14.1118838560001, -61.0785212879999, 13.7146670590001, 200],
    ['Dominica', -61.2492569649999, 15.6338565120001, -61.4889216789999, 15.2018089860001, 201],
    ['Montserrat', -62.1405330069999, 16.819322007, -62.2301326159999, 16.6753604190001, 203],
    ['Antigua and Barb.', -61.6675919259999, 17.7276878930001, -61.8941544259999, 16.989243882, 204],
    ['St. Kitts and Nevis', -62.5367732409999, 17.4158389340001, -62.8610733709999, 17.100531317, 205],
    ['U.S. Virgin Is.', -64.559396939, 18.386598614, -65.0414934419999, 17.6827660180001, 206],
    ['St-Barthélemy', -62.7916560539999, 17.9291445980001, -62.8673396479999, 17.8819847680001, 207],
    ['Puerto Rico', -65.2446182929999, 18.5227725280001, -67.937814908, 17.9229190120001, 208],
    ['Anguilla', -62.9726456369999, 18.601263739, -63.4288223949999, 18.1690941430001, 209],
    ['British Virgin Is.', -64.2707413399999, 18.7462425800001, -64.7739965489999, 18.334662177, 210],
    ['Jamaica', -76.1879776679999, 18.525091864, -78.3746638659999, 17.7031924500001, 211],
    ['Cayman Is.', -79.7266426919999, 19.7576308370001, -81.4165420209999, 19.263863615, 212],
    ['Bermuda', -64.6476307056405, 32.388657945, -64.8859939889704, 32.2480773815958, 213],
    ['Heard I. and McDonald Is.', 73.812185092, -52.9616024719999, 73.236013217, -53.1925595029999, 214],
    ['Saint Helena', -5.65038001199991, -7.87786223799992, -14.4177139959999, -40.3978817689999, 215],
    ['Mauritius', 63.493907097, -10.3239071589999, 56.5241805350001, -20.517347915, 216],
    ['Comoros', 44.529063347, -11.3612606749999, 43.2132267590001, -12.3803036439999, 217],
    ['São Tomé and Principe', 7.46273847700007, 1.69977448100008, 6.46168053500009, 0.024115302000041, 218],
    ['Cabo Verde', -22.6665746739999, 17.1966006530001, -25.3604223299999, 14.8039411480001, 219],
    ['Malta', 14.5671492850001, 36.0755882830001, 14.1836043630001, 35.801214911, 220],
    ['Jersey', -2.00829016799992, 49.2670352230001, -2.24201412699995, 49.1713320980001, 221],
    ['Guernsey', -2.17031816299993, 49.731390692, -2.67345130099994, 49.4115664730001, 222],
    ['Isle of Man', -4.31191972599993, 54.4190127620001, -4.79015051999994, 54.0569522160001, 223],
    ['Faeroe Is.', -6.27578691299993, 62.398911851, -7.64415442599994, 61.3941104190001, 225],
    ['Br. Indian Ocean Ter.', 72.494639519, -5.22698333099993, 71.260996941, -7.43222421699994, 227],
    ['Singapore', 104.003428582, 1.44863515800006, 103.640391472, 1.26430898600006, 228],
    ['Norfolk Island', 167.996348504, -28.9974911439999, 167.912119988, -29.0800106749999, 229],
    ['Cook Is.', -157.312814908, -8.94670989399992, -165.824533658, -21.9388973939999, 230],
    ['Tonga', -173.914255338, -15.5595028629999, -176.219309049, -22.3387997379999, 231],
    ['Wallis and Futuna Is.', -176.125599739, -13.2089169249999, -178.185739713, -14.3194312479999, 232],
    ['Samoa', -171.437692838, -13.4628231749999, -172.782582161, -14.0528296849999, 233],
    ['Solomon Is.', 168.825856967, -6.59986744599991, 155.507985873, -12.2906226539999, 234],
    ['Tuvalu', 179.906748894, -5.67750416499996, 176.125254754, -9.42066822699991, 235],
    ['Maldives', 73.753184441, 7.10724518400008, 72.684825066, -0.688571872999944, 236],
    ['Nauru', 166.958262566, -0.490411065999922, 166.906993035, -0.551853122999944, 237],
    ['Micronesia', 163.046560092, 9.77558014500005, 138.063812696, 0.918158270000049, 238],
    ['S. Geo. and the Is.', -26.2393285799999, -53.9724260399999, -38.0870255199999, -59.4727515599999, 239],
    ['Falkland Is.', -57.7342830069999, -51.0277645809999, -61.3181860019999, -52.4065227259999, 240],
    ['Vanuatu', 169.898936394, -13.0648739559999, 166.520518425, -20.2531063779999, 241],
    ['Niue', -169.782907681, -18.9640438779999, -169.95042884, -19.1427548159999, 242],
    ['American Samoa', -168.160471158, -11.0513648419999, -171.086537239, -14.5328915339999, 243],
    ['Palau', 134.727342990799, 8.09661782863137, 131.131114129, 2.94904205900008, 244],
    ['Guam', 144.95215905, 13.6541201840001, 144.624196811, 13.2410342470001, 245],
    ['N. Mariana Is.', 145.868907097, 20.5554059920001, 144.902110222, 14.1106631530001, 246],
    ['Bahrain', 50.6456598131816, 26.2425804710001, 50.448903842, 25.789536851, 247],
    ['Coral Sea Is.', 154.391286655, -21.0287411439999, 154.388519727, -21.0300432269999, 248],
    ['Spratly Is.', 115.848806186, 11.1179873720001, 114.027679884, 9.67951080900008, 249],
    ['Clipperton I.', -109.210357226, 10.311021226, -109.234242317, 10.2815615910001, 250],
    ['Macao', 113.587494337, 22.2207705750001, 113.519867384, 22.1053734400001, 251],
    ['Ashmore and Cartier Is.', 123.597748243, -12.4266089819999, 123.575043165, -12.4385718729999, 252],
];
