## [4.2.2](https://github.com/dhis2/maps-gl/compare/v4.2.1...v4.2.2) (2025-12-17)


### Bug Fixes

* maplibre-gl update [DHIS2-19379] ([#613](https://github.com/dhis2/maps-gl/issues/613)) ([590bf93](https://github.com/dhis2/maps-gl/commit/590bf93077bdb04d2af630da5f66e35a294a1e75))

## [4.2.1](https://github.com/dhis2/maps-gl/compare/v4.2.0...v4.2.1) (2025-12-15)


### Bug Fixes

* computeMinMaxAndAlign to use system:time_end if available ([#612](https://github.com/dhis2/maps-gl/issues/612)) ([75491ca](https://github.com/dhis2/maps-gl/commit/75491cad8f0f18b072c5460ed98d363b22101931))

# [4.2.0](https://github.com/dhis2/maps-gl/compare/v4.1.2...v4.2.0) (2025-12-15)


### Bug Fixes

* unmask eeImageBands [DHIS2-20276] ([#606](https://github.com/dhis2/maps-gl/issues/606)) ([a6f7ce4](https://github.com/dhis2/maps-gl/commit/a6f7ce4a2929194541b5bceaf0519d5434839997))
* use node 20 ([#611](https://github.com/dhis2/maps-gl/issues/611)) ([c1927a9](https://github.com/dhis2/maps-gl/commit/c1927a99836121c5285ec6cb4bbdbe590b8b2176))


### Features

* cache data retrieved by ee_worker ([#609](https://github.com/dhis2/maps-gl/issues/609)) ([c56d4ab](https://github.com/dhis2/maps-gl/commit/c56d4abb64943da934a2408c10c0fa2468f75a05))
* support method operations across bands and handle scale for small areas  [DHIS2-20355] ([#608](https://github.com/dhis2/maps-gl/issues/608)) ([1457ae4](https://github.com/dhis2/maps-gl/commit/1457ae4c6a3b42a551d4d94557e6c8e72eb984ea))
* support temporal aggregation in Earth Engine worker [DHIS2-17856] [DHIS2-20149] ([#607](https://github.com/dhis2/maps-gl/issues/607)) ([36d0051](https://github.com/dhis2/maps-gl/commit/36d00519285d88632e76520d652dfb35e868508c))

## [4.1.2](https://github.com/dhis2/maps-gl/compare/v4.1.1...v4.1.2) (2025-07-31)


### Bug Fixes

* update ee worker files and attributions style ([#602](https://github.com/dhis2/maps-gl/issues/602)) ([4a469c0](https://github.com/dhis2/maps-gl/commit/4a469c064069a0176b18ac8bd250d98bbc84fc81))

## [4.1.1](https://github.com/dhis2/maps-gl/compare/v4.1.0...v4.1.1) (2025-07-07)


### Bug Fixes

* setting opacity of azure layers ([#603](https://github.com/dhis2/maps-gl/issues/603)) ([9aeb678](https://github.com/dhis2/maps-gl/commit/9aeb67835ad587cb2e8813f0e8430d2ba79b74d4))

# [4.1.0](https://github.com/dhis2/maps-gl/compare/v4.0.2...v4.1.0) (2025-06-17)


### Features

* azureLayer support [DHIS2-19152] ([#600](https://github.com/dhis2/maps-gl/issues/600)) ([6595ee3](https://github.com/dhis2/maps-gl/commit/6595ee3838177777e49c612b4017e9b987402f06))

## [4.0.2](https://github.com/dhis2/maps-gl/compare/v4.0.1...v4.0.2) (2025-06-13)


### Bug Fixes

* add method to disable mouse move functionality [DHIS2-6683] ([#599](https://github.com/dhis2/maps-gl/issues/599)) ([c2673a5](https://github.com/dhis2/maps-gl/commit/c2673a531efd2029fba15864a04b7d33f2413aba))

## [4.0.1](https://github.com/dhis2/maps-gl/compare/v4.0.0...v4.0.1) (2024-11-29)


### Bug Fixes

* update 'No data' handling ([#596](https://github.com/dhis2/maps-gl/issues/596)) ([1fbdb20](https://github.com/dhis2/maps-gl/commit/1fbdb20895f5c82ac1762d9a90eb0b1ae8129b05))

# [4.0.0](https://github.com/dhis2/maps-gl/compare/v3.9.2...v4.0.0) (2024-07-31)


### Features

* new Earth Engine format and functions ([c97b9c6](https://github.com/dhis2/maps-gl/commit/c97b9c6817ba00090600b51850b6cdc0be53c5d5))


### BREAKING CHANGES

* Update to the EarthEngineWorker

## [3.9.2](https://github.com/dhis2/maps-gl/compare/v3.9.1...v3.9.2) (2024-06-06)


### Bug Fixes

* unclear 'show no data' ([#573](https://github.com/dhis2/maps-gl/issues/573)) ([1c31fcc](https://github.com/dhis2/maps-gl/commit/1c31fcc20b700e5dadeec1d6c6e4f82484f262f5))

## [3.9.1](https://github.com/dhis2/maps-gl/compare/v3.9.0...v3.9.1) (2024-03-13)


### Bug Fixes

* use round style for line-join and line-cap ([#566](https://github.com/dhis2/maps-gl/issues/566)) ([476f5af](https://github.com/dhis2/maps-gl/commit/476f5af95f47ad68f50bafd0b52185515714f29b))

# [3.9.0](https://github.com/dhis2/maps-gl/compare/v3.8.6...v3.9.0) (2024-03-05)


### Features

* add class when map is rendered and push-analytics helper files and classes ([#552](https://github.com/dhis2/maps-gl/issues/552)) ([c3830ac](https://github.com/dhis2/maps-gl/commit/c3830acbbfdb699dfa3eb6bc83bda97c2c3379fc))
* add map rendered class and push-analytics config and classes ([#565](https://github.com/dhis2/maps-gl/issues/565)) ([354ba97](https://github.com/dhis2/maps-gl/commit/354ba970512e6513d3467fa0cc8fa9e3f15c0d7a)), closes [#552](https://github.com/dhis2/maps-gl/issues/552)

## [3.8.6](https://github.com/dhis2/maps-gl/compare/v3.8.5...v3.8.6) (2023-10-23)


### Bug Fixes

* color needs to be set to strokeColor for lines to show ([#550](https://github.com/dhis2/maps-gl/issues/550)) ([e4ec3d5](https://github.com/dhis2/maps-gl/commit/e4ec3d57e200c458929ae1bb69bcd05632204008))

## [3.8.5](https://github.com/dhis2/maps-gl/compare/v3.8.4...v3.8.5) (2023-09-05)


### Bug Fixes

* draw layers with opacity (DHIS2-15793) ([#549](https://github.com/dhis2/maps-gl/issues/549)) ([eef6a8e](https://github.com/dhis2/maps-gl/commit/eef6a8ec54894d4bb4f06a7173ba5b0bfde14ef6))

## [3.8.4](https://github.com/dhis2/maps-gl/compare/v3.8.3...v3.8.4) (2023-03-17)


### Bug Fixes

* set Bing layer opacity after it's added to the map  ([#536](https://github.com/dhis2/maps-gl/issues/536)) ([61cc854](https://github.com/dhis2/maps-gl/commit/61cc854f8b3efa879ec79ac818d7c58eea822eec))

## [3.8.3](https://github.com/dhis2/maps-gl/compare/v3.8.2...v3.8.3) (2023-03-15)


### Bug Fixes

* toggle visibility for donut cluster (DHIS2-14928) ([#535](https://github.com/dhis2/maps-gl/issues/535)) ([25822ce](https://github.com/dhis2/maps-gl/commit/25822ce635b79b5a7ed85b2211306229f29b194d))

## [3.8.2](https://github.com/dhis2/maps-gl/compare/v3.8.1...v3.8.2) (2023-03-01)


### Bug Fixes

* upgrade dependencies including earthengie-api ([#529](https://github.com/dhis2/maps-gl/issues/529)) ([0757797](https://github.com/dhis2/maps-gl/commit/07577977e7e56c5d62a0aa253d367bc4af39ac37))

## [3.8.1](https://github.com/dhis2/maps-gl/compare/v3.8.0...v3.8.1) (2023-02-13)


### Bug Fixes

* use cell centroids in calculations (DHIS2-14261) ([#525](https://github.com/dhis2/maps-gl/issues/525)) ([7dbbec5](https://github.com/dhis2/maps-gl/commit/7dbbec52502e4e9c9071f6743429a6ea76a0439a))

# [3.8.0](https://github.com/dhis2/maps-gl/compare/v3.7.0...v3.8.0) (2023-02-13)


### Features

* fit bounds options support ([#524](https://github.com/dhis2/maps-gl/issues/524)) ([604ec16](https://github.com/dhis2/maps-gl/commit/604ec1674a4ac30e6a1866b02777dc045a8db70e))

# [3.7.0](https://github.com/dhis2/maps-gl/compare/v3.6.0...v3.7.0) (2023-01-12)


### Bug Fixes

* use the updated tokens in the publish step ([#521](https://github.com/dhis2/maps-gl/issues/521)) ([ce19be7](https://github.com/dhis2/maps-gl/commit/ce19be7d70dcbe713cae4d556464ef818ba3b3fb))


### Features

* support SVG symbols (DHIS2-14440) ([#517](https://github.com/dhis2/maps-gl/issues/517)) ([87c25b9](https://github.com/dhis2/maps-gl/commit/87c25b9987d0892309db1833c6c232830ae281c3))
* support SVG symbols (DHIS2-14440) v2 ([#520](https://github.com/dhis2/maps-gl/issues/520)) ([62f5eea](https://github.com/dhis2/maps-gl/commit/62f5eea18797b05ef7086c631fc2967ff0200daa))


### Reverts

* Revert "feat: support SVG symbols (DHIS2-14440) (#517)" (#519) ([17b32ca](https://github.com/dhis2/maps-gl/commit/17b32cac1e9d271ef32cba789761463e519b7422)), closes [#517](https://github.com/dhis2/maps-gl/issues/517) [#519](https://github.com/dhis2/maps-gl/issues/519)

# [3.6.0](https://github.com/dhis2/maps-gl/compare/v3.5.3...v3.6.0) (2022-12-07)


### Features

* enable ability to show values in the labels ([#512](https://github.com/dhis2/maps-gl/issues/512)) ([6f47032](https://github.com/dhis2/maps-gl/commit/6f47032f4e4bb63056dca483d15a58cee9852b56))

## [3.5.2](https://github.com/dhis2/maps-gl/compare/v3.5.1...v3.5.2) (2022-09-06)


### Bug Fixes

* bump node version ([cc0cfb3](https://github.com/dhis2/maps-gl/commit/cc0cfb3e5bc076088ea93e3c8abfb4b6ed65f3e2))

## [3.5.1](https://github.com/dhis2/maps-gl/compare/v3.5.0...v3.5.1) (2022-08-31)


### Bug Fixes

* use tileScale to avoid ee timeout ([#490](https://github.com/dhis2/maps-gl/issues/490)) ([d03992b](https://github.com/dhis2/maps-gl/commit/d03992b519a52d176e2076e138d05b3fd6e2a7f4))

# [3.5.0](https://github.com/dhis2/maps-gl/compare/v3.4.6...v3.5.0) (2022-08-19)


### Bug Fixes

* split view map controls focus style ([#485](https://github.com/dhis2/maps-gl/issues/485)) ([069a8ec](https://github.com/dhis2/maps-gl/commit/069a8ec4794811757d0f5a5d8bcb11a7360266e8))


### Features

* import ee data ([#463](https://github.com/dhis2/maps-gl/issues/463)) ([dbfebf4](https://github.com/dhis2/maps-gl/commit/dbfebf4dfc7d4489e5cf980347b982f41505f407))

## [3.4.6](https://github.com/dhis2/maps-gl/compare/v3.4.5...v3.4.6) (2022-08-04)


### Bug Fixes

* zoom to content control hover style ([#484](https://github.com/dhis2/maps-gl/issues/484)) ([11612cc](https://github.com/dhis2/maps-gl/commit/11612cc3485b1081a7875cb56f9b520340790215))

## [3.4.5](https://github.com/dhis2/maps-gl/compare/v3.4.4...v3.4.5) (2022-06-21)


### Bug Fixes

* dev dependency upgrades ([#467](https://github.com/dhis2/maps-gl/issues/467)) ([e51ccd8](https://github.com/dhis2/maps-gl/commit/e51ccd8c7ca67fad64ad376486871e4771bc45ef))
* downgrade husky be comatible with node 12 ([#469](https://github.com/dhis2/maps-gl/issues/469)) ([6760be1](https://github.com/dhis2/maps-gl/commit/6760be1a951deb92f7f4d74a1f6f3d80c86094eb))

## [3.4.4](https://github.com/dhis2/maps-gl/compare/v3.4.3...v3.4.4) (2022-04-26)


### Bug Fixes

* remove examples folder (not maintained) ([#462](https://github.com/dhis2/maps-gl/issues/462)) ([05d11ee](https://github.com/dhis2/maps-gl/commit/05d11eec6fecab190f2183c95dced509f6f429bb))

## [3.4.3](https://github.com/dhis2/maps-gl/compare/v3.4.2...v3.4.3) (2022-04-19)


### Bug Fixes

* inline bing maps logo ([#456](https://github.com/dhis2/maps-gl/issues/456)) ([8674418](https://github.com/dhis2/maps-gl/commit/86744188fedbd29634efc797ef61b8869622bdd1))

## [3.4.2](https://github.com/dhis2/maps-gl/compare/v3.4.1...v3.4.2) (2022-03-12)


### Bug Fixes

* reduce ee dot size ([#455](https://github.com/dhis2/maps-gl/issues/455)) ([38c81f0](https://github.com/dhis2/maps-gl/commit/38c81f0ccfb030c23550b3bdb840b7ba2ff0f0a6))

## [3.4.1](https://github.com/dhis2/maps-gl/compare/v3.4.0...v3.4.1) (2022-03-09)


### Bug Fixes

* show event clusters on innermost zoom level (DHIS2-12196) ([#453](https://github.com/dhis2/maps-gl/issues/453)) ([bfd9511](https://github.com/dhis2/maps-gl/commit/bfd9511c76d9032b43f5244f0ccaed15cc12f6fa))

# [3.4.0](https://github.com/dhis2/maps-gl/compare/v3.3.0...v3.4.0) (2022-02-28)


### Features

* aggregate earth engine feature collection (DHIS2-11963) ([#428](https://github.com/dhis2/maps-gl/issues/428)) ([187e2c9](https://github.com/dhis2/maps-gl/commit/187e2c943bd38c437d95f6d7c356d4bed11aded0))

# [3.3.0](https://github.com/dhis2/maps-gl/compare/v3.2.0...v3.3.0) (2022-02-24)


### Features

* opacity factor (DHIS2-11969) ([#435](https://github.com/dhis2/maps-gl/issues/435)) ([c50206d](https://github.com/dhis2/maps-gl/commit/c50206de7bd86acbc901c8e30df90fbfc50d5075))

# [3.2.0](https://github.com/dhis2/maps-gl/compare/v3.1.0...v3.2.0) (2022-02-23)


### Features

* ee aggregations for catchment areas ([#452](https://github.com/dhis2/maps-gl/issues/452)) ([327b42b](https://github.com/dhis2/maps-gl/commit/327b42b9af361b743632ba89b7b0fb1b4e464a3b))

# [3.1.0](https://github.com/dhis2/maps-gl/compare/v3.0.9...v3.1.0) (2022-02-23)


### Features

* highlight multiple features with same string id ([#447](https://github.com/dhis2/maps-gl/issues/447)) ([3a3f65e](https://github.com/dhis2/maps-gl/commit/3a3f65ea3c9ff283e39cae9bf824c8866e98ff2c))

## [3.0.9](https://github.com/dhis2/maps-gl/compare/v3.0.8...v3.0.9) (2022-02-15)


### Bug Fixes

* check if map still exists before removing layer events ([#445](https://github.com/dhis2/maps-gl/issues/445)) ([c97384f](https://github.com/dhis2/maps-gl/commit/c97384f9ddc8d8481a7b02777d0f2f904d54b86a))

## [3.0.8](https://github.com/dhis2/maps-gl/compare/v3.0.7...v3.0.8) (2022-02-13)


### Bug Fixes

* check if map still exists before collapsing a cluster (DHIS2-12583) ([#443](https://github.com/dhis2/maps-gl/issues/443)) ([46d2f15](https://github.com/dhis2/maps-gl/commit/46d2f154df1ccbfdf66bbce493796ec9be72de4a))

## [3.0.7](https://github.com/dhis2/maps-gl/compare/v3.0.6...v3.0.7) (2022-02-09)


### Bug Fixes

* hide label on mouse move ([#442](https://github.com/dhis2/maps-gl/issues/442)) ([d1f14c9](https://github.com/dhis2/maps-gl/commit/d1f14c9a67852d8f701b8f6d11a10058f860c707))

## [3.0.6](https://github.com/dhis2/maps-gl/compare/v3.0.5...v3.0.6) (2022-02-08)


### Bug Fixes

* redraw layer group on basemap change ([#438](https://github.com/dhis2/maps-gl/issues/438)) ([03aff61](https://github.com/dhis2/maps-gl/commit/03aff61e327d56d000e1547540ae0f95b598dc87))

## [3.0.5](https://github.com/dhis2/maps-gl/compare/v3.0.4...v3.0.5) (2022-02-07)


### Bug Fixes

* make sure map is present before removing layers and source ([#436](https://github.com/dhis2/maps-gl/issues/436)) ([58c6cd1](https://github.com/dhis2/maps-gl/commit/58c6cd1c01267294163cabcb8206e528a8a18ef3))

## [3.0.4](https://github.com/dhis2/maps-gl/compare/v3.0.3...v3.0.4) (2022-01-25)


### Bug Fixes

* handle ee null values ([#433](https://github.com/dhis2/maps-gl/issues/433)) ([3cd806b](https://github.com/dhis2/maps-gl/commit/3cd806b2f0010025f65086ce477c9841c25d1bd9))

## [3.0.3](https://github.com/dhis2/maps-gl/compare/v3.0.2...v3.0.3) (2022-01-24)


### Bug Fixes

* keep data filter when earth engine layer is redrawn ([#431](https://github.com/dhis2/maps-gl/issues/431)) ([b74c12f](https://github.com/dhis2/maps-gl/commit/b74c12fe9556a746ad3e1e0a7095704bab83499e))
* removed ee layer unit test ([0574148](https://github.com/dhis2/maps-gl/commit/057414857279b13f1487428bd12378265a5de6de))

## [3.0.2](https://github.com/dhis2/maps-gl/compare/v3.0.1...v3.0.2) (2022-01-04)


### Bug Fixes

* use shared worker for Earth Engine layers ([#427](https://github.com/dhis2/maps-gl/issues/427)) ([40f68c8](https://github.com/dhis2/maps-gl/commit/40f68c8cdc6f56771353b734885230b513119c7a))

## [3.0.1](https://github.com/dhis2/maps-gl/compare/v3.0.0...v3.0.1) (2021-12-30)


### Bug Fixes

* only preload earth engine aggregations if org units are passed (DHIS2-12276) ([#425](https://github.com/dhis2/maps-gl/issues/425)) ([feec2e4](https://github.com/dhis2/maps-gl/commit/feec2e43d38e2ce0fb32d05726e372f566a52c41))

# [3.0.0](https://github.com/dhis2/maps-gl/compare/v2.2.5...v3.0.0) (2021-12-20)


### Bug Fixes

* ee worker test fix ([#424](https://github.com/dhis2/maps-gl/issues/424)) ([85c5e34](https://github.com/dhis2/maps-gl/commit/85c5e344a3fc141e48fa5c49f51d79abe9f51a40))


### Features

* run Earth Engine API in a web worker (DHIS2-12013) ([#415](https://github.com/dhis2/maps-gl/issues/415)) ([e3b9a46](https://github.com/dhis2/maps-gl/commit/e3b9a46e5559171fc0fedf5278bfd3444364f515))


### BREAKING CHANGES

* Run EE API requests in a separate web worker
* Run all EE API code in a separate web worker

## [2.2.5](https://github.com/dhis2/maps-gl/compare/v2.2.4...v2.2.5) (2021-12-06)


### Bug Fixes

* don't use optional chaining in maps-gl ([#421](https://github.com/dhis2/maps-gl/issues/421)) ([0756a48](https://github.com/dhis2/maps-gl/commit/0756a480cf73cb196e38636f843e9d606f2ad242))

## [2.2.4](https://github.com/dhis2/maps-gl/compare/v2.2.3...v2.2.4) (2021-12-01)


### Bug Fixes

* basic offline support (DHIS2-12212) ([#418](https://github.com/dhis2/maps-gl/issues/418)) ([e8bed4d](https://github.com/dhis2/maps-gl/commit/e8bed4df3fe405c0dff2c8a6d13dbc80fe1e8db9))
* unit test ([2d5f55e](https://github.com/dhis2/maps-gl/commit/2d5f55ee389c7f57a71d109bd2d00fa430d01d06))

## [2.2.3](https://github.com/dhis2/maps-gl/compare/v2.2.2...v2.2.3) (2021-10-29)


### Bug Fixes

* only reference ee scale on the server ([#416](https://github.com/dhis2/maps-gl/issues/416)) ([570b0f6](https://github.com/dhis2/maps-gl/commit/570b0f6e5e63b3e7110a880b460daa40b9c0e565))

## [2.2.2](https://github.com/dhis2/maps-gl/compare/v2.2.1...v2.2.2) (2021-10-26)


### Bug Fixes

* don't update auth library for earth engine api ([#414](https://github.com/dhis2/maps-gl/issues/414)) ([9b090d9](https://github.com/dhis2/maps-gl/commit/9b090d911a586fadde6762097dc04dd879903dbb))

## [2.2.1](https://github.com/dhis2/maps-gl/compare/v2.2.0...v2.2.1) (2021-10-26)


### Bug Fixes

* don't add layer if map style is loading ([#412](https://github.com/dhis2/maps-gl/issues/412)) ([089ca54](https://github.com/dhis2/maps-gl/commit/089ca5408597bcc625a5e2ef64ea2a3432a1e67f))

# [2.2.0](https://github.com/dhis2/maps-gl/compare/v2.1.5...v2.2.0) (2021-10-22)


### Features

* add vector tiles support ([#405](https://github.com/dhis2/maps-gl/issues/405)) ([c9039a4](https://github.com/dhis2/maps-gl/commit/c9039a46b259cfea7403cf68c374808400a45798))

## [2.1.5](https://github.com/dhis2/maps-gl/compare/v2.1.4...v2.1.5) (2021-10-20)


### Bug Fixes

* failing test after switching to evaluate ([#408](https://github.com/dhis2/maps-gl/issues/408)) ([3d18fa1](https://github.com/dhis2/maps-gl/commit/3d18fa1d165801c2c60e3b30c9aced1e3065eac4))
* use evaluate instead of getInfo for earth engine layers ([#406](https://github.com/dhis2/maps-gl/issues/406)) ([79f36c9](https://github.com/dhis2/maps-gl/commit/79f36c934c77fa6d2bda28f19085f27c4b420e87))

## [2.1.4](https://github.com/dhis2/maps-gl/compare/v2.1.3...v2.1.4) (2021-10-04)


### Bug Fixes

* update donut clusters on source data ([#403](https://github.com/dhis2/maps-gl/issues/403)) ([17ea982](https://github.com/dhis2/maps-gl/commit/17ea98290319d98bedc712cef01c5998776dd615))

## [2.1.3](https://github.com/dhis2/maps-gl/compare/v2.1.2...v2.1.3) (2021-09-13)


### Bug Fixes

* event stroke and count color ([#399](https://github.com/dhis2/maps-gl/issues/399)) ([3bd1e1d](https://github.com/dhis2/maps-gl/commit/3bd1e1dd7a765eaeb296974801799b36d8819215))

## [2.1.2](https://github.com/dhis2/maps-gl/compare/v2.1.1...v2.1.2) (2021-09-13)


### Bug Fixes

* always open popup with single click ([#398](https://github.com/dhis2/maps-gl/issues/398)) ([bd2b9ac](https://github.com/dhis2/maps-gl/commit/bd2b9ac5cef33f2004236005090c1d160cf7372b))

## [2.1.1](https://github.com/dhis2/maps-gl/compare/v2.1.0...v2.1.1) (2021-09-10)


### Bug Fixes

* symbol opacity ([#395](https://github.com/dhis2/maps-gl/issues/395)) ([d09d249](https://github.com/dhis2/maps-gl/commit/d09d249a1cd45a9d664a8f0d8a1a257fce10a81e))

# [2.1.0](https://github.com/dhis2/maps-gl/compare/v2.0.1...v2.1.0) (2021-08-30)


### Features

* enhanced GeoJSON layer (DHIS2-11071) ([#388](https://github.com/dhis2/maps-gl/issues/388)) ([0eec01a](https://github.com/dhis2/maps-gl/commit/0eec01abc3606291389f3a54a13c9dbd610b03be))

## [2.0.1](https://github.com/dhis2/maps-gl/compare/v2.0.0...v2.0.1) (2021-08-27)


### Bug Fixes

* upgraded expressions and marker layer refactor ([#389](https://github.com/dhis2/maps-gl/issues/389)) ([2a0b660](https://github.com/dhis2/maps-gl/commit/2a0b66012934ff23cbe2630a984312cce901e8e7))

# [2.0.0](https://github.com/dhis2/maps-gl/compare/v1.8.7...v2.0.0) (2021-07-06)


### Features

* switch from Mapbox GL JS to MapLibre GL JS (DHIS2-11406) ([#374](https://github.com/dhis2/maps-gl/issues/374)) ([3cf2081](https://github.com/dhis2/maps-gl/commit/3cf20818d498c200083ea1d6e7aec4d59ed4999f))


### BREAKING CHANGES

* New "maplibregl-" class names.

## [1.8.7](https://github.com/dhis2/maps-gl/compare/v1.8.6...v1.8.7) (2021-07-06)


### Reverts

* Revert "BREAKING CHANGE: switch from Mapbox GL JS to MapLibre GL JS (DHIS2-11406) (#367)" (#373) ([5576591](https://github.com/dhis2/maps-gl/commit/55765915413841bd841a92e17cff28e613566ed6)), closes [#367](https://github.com/dhis2/maps-gl/issues/367) [#373](https://github.com/dhis2/maps-gl/issues/373)

## [1.8.6](https://github.com/dhis2/maps-gl/compare/v1.8.5...v1.8.6) (2021-04-14)


### Bug Fixes

* wait until source is loaded for all tiles ([#314](https://github.com/dhis2/maps-gl/issues/314)) ([1c410a7](https://github.com/dhis2/maps-gl/commit/1c410a7ffbd5e7080511dd7bbab8ec4c5205590f))

## [1.8.5](https://github.com/dhis2/maps-gl/compare/v1.8.4...v1.8.5) (2021-03-21)


### Bug Fixes

* icon label opacity ([#299](https://github.com/dhis2/maps-gl/issues/299)) ([4e81ebc](https://github.com/dhis2/maps-gl/commit/4e81ebc1d0a5a97a99dc0e436ef4b689de10f1e4))

## [1.8.4](https://github.com/dhis2/maps-gl/compare/v1.8.3...v1.8.4) (2021-03-11)


### Bug Fixes

* don't set opacity before layer is added to map ([#298](https://github.com/dhis2/maps-gl/issues/298)) ([a05e04a](https://github.com/dhis2/maps-gl/commit/a05e04ad0420df3e8346b6f17c5026f40c621a9a))

## [1.8.3](https://github.com/dhis2/maps-gl/compare/v1.8.2...v1.8.3) (2021-03-10)


### Bug Fixes

* compact attribution style ([#296](https://github.com/dhis2/maps-gl/issues/296)) ([0ffd952](https://github.com/dhis2/maps-gl/commit/0ffd9529aeb558ba8e8f6cb3ff5923e927f5ed52))

## [1.8.2](https://github.com/dhis2/maps-gl/compare/v1.8.1...v1.8.2) (2021-03-10)


### Bug Fixes

* ee source feature layer ([#297](https://github.com/dhis2/maps-gl/issues/297)) ([d473d13](https://github.com/dhis2/maps-gl/commit/d473d13b9a8e60b6036fc2bc7cb351cd2df51520))

## [1.8.1](https://github.com/dhis2/maps-gl/compare/v1.8.0...v1.8.1) (2021-03-10)


### Bug Fixes

* typo ([38666ea](https://github.com/dhis2/maps-gl/commit/38666ea1900eeadbceb8ed19d2e2b8c9d1257357))

# [1.8.0](https://github.com/dhis2/maps-gl/compare/v1.7.2...v1.8.0) (2021-03-09)


### Bug Fixes

* only set feature hover state if layer is still on map ([bb91920](https://github.com/dhis2/maps-gl/commit/bb9192072ea44c825b8fef8a45ec7e4be50d0acc))


### Features

* filter the org units shown for ee layers ([fa391a4](https://github.com/dhis2/maps-gl/commit/fa391a4ae44c0fb6150a6143bec59016efa86d45))

## [1.7.2](https://github.com/dhis2/maps-gl/compare/v1.7.1...v1.7.2) (2021-03-02)


### Bug Fixes

* only add vector layers if needed (DHIS2-10604) ([#283](https://github.com/dhis2/maps-gl/issues/283)) ([737548c](https://github.com/dhis2/maps-gl/commit/737548ce8be72d82e01aab92adb040d26e1f6c37))

## [1.7.1](https://github.com/dhis2/maps-gl/compare/v1.7.0...v1.7.1) (2021-02-25)


### Bug Fixes

* remove focus border for popup x ([4920c2f](https://github.com/dhis2/maps-gl/commit/4920c2f2ef7f73c1051dc4ab89f4f6f7f7fa420b))

# [1.7.0](https://github.com/dhis2/maps-gl/compare/v1.6.0...v1.7.0) (2021-02-25)


### Features

* improve multitouch handling (DHIS2-10413) ([#276](https://github.com/dhis2/maps-gl/issues/276)) ([e2b82cc](https://github.com/dhis2/maps-gl/commit/e2b82cc5249d4bcd040173bbad7f8151a6515fd8))

# [1.6.0](https://github.com/dhis2/maps-gl/compare/v1.5.0...v1.6.0) (2021-02-24)


### Features

* circle buffer aggregations for EE layers (DHIS2-10549) ([#262](https://github.com/dhis2/maps-gl/issues/262)) ([1fe68f0](https://github.com/dhis2/maps-gl/commit/1fe68f0ec146cf7cddaa14feab60c1bdb0a55140))

# [1.5.0](https://github.com/dhis2/maps-gl/compare/v1.4.0...v1.5.0) (2021-02-22)


### Features

* new layer highlight method to set feature state (DHIS2-10546) ([#259](https://github.com/dhis2/maps-gl/issues/259)) ([407733d](https://github.com/dhis2/maps-gl/commit/407733d538578b2aa71d90646a9f059a799d1bb5))

# [1.4.0](https://github.com/dhis2/maps-gl/compare/v1.3.6...v1.4.0) (2021-02-19)


### Features

* aggregate values to features (DHIS2-9530) ([#234](https://github.com/dhis2/maps-gl/issues/234)) ([0b236c3](https://github.com/dhis2/maps-gl/commit/0b236c336f2969a90e779d0b87c1ddcb110276d6))

## [1.3.6](https://github.com/dhis2/maps-gl/compare/v1.3.5...v1.3.6) (2021-01-19)


### Bug Fixes

* failing test in previous merge ([#239](https://github.com/dhis2/maps-gl/issues/239)) ([1e55526](https://github.com/dhis2/maps-gl/commit/1e555266c71faac2a89d2ff1b6f7cb4bbbb9b73f))
* multitouch for map panning (DHIS2-10252) ([7cfbeaf](https://github.com/dhis2/maps-gl/commit/7cfbeaff17b9c283ebb7c681e6d70db6eee88fa3))

## [1.3.5](https://github.com/dhis2/maps-gl/compare/v1.3.4...v1.3.5) (2020-12-02)


### Bug Fixes

* pass map click event back to app ([#215](https://github.com/dhis2/maps-gl/issues/215)) ([2cda62f](https://github.com/dhis2/maps-gl/commit/2cda62ffd32ba403620aa46f45ea4acb52e08ad0))

## [1.3.4](https://github.com/dhis2/maps-gl/compare/v1.3.3...v1.3.4) (2020-11-11)


### Bug Fixes

* cut release to finish jira migration ([a33892c](https://github.com/dhis2/maps-gl/commit/a33892cf746ec94c4e676dbeb6df8bcab56acdd2))

## [1.3.3](https://github.com/dhis2/maps-gl/compare/v1.3.2...v1.3.3) (2020-09-21)


### Bug Fixes

* remove map outline style ([8b51b9c](https://github.com/dhis2/maps-gl/commit/8b51b9c0cf8c51b25bd28d5c4f9b87dd88b340d1))

## [1.3.2](https://github.com/dhis2/maps-gl/compare/v1.3.1...v1.3.2) (2020-09-21)


### Bug Fixes

* style fix ([6465766](https://github.com/dhis2/maps-gl/commit/64657661d4ad0b4a0a1fa066ca7b5153282ec2fa))

## [1.3.1](https://github.com/dhis2/maps-gl/compare/v1.3.0...v1.3.1) (2020-09-17)


### Bug Fixes

* ee api upgrade ([#170](https://github.com/dhis2/maps-gl/issues/170)) ([31129bf](https://github.com/dhis2/maps-gl/commit/31129bf0c356b2789e34d8ff5af3f89d7f6a38db))

# [1.3.0](https://github.com/dhis2/maps-gl/compare/v1.2.1...v1.3.0) (2020-09-08)


### Features

* scroll zoom toggle ([#168](https://github.com/dhis2/maps-gl/issues/168)) ([1e91ffd](https://github.com/dhis2/maps-gl/commit/1e91ffd185e8e6fc8b665d80123e67840de9034f))

## [1.2.1](https://github.com/dhis2/maps-gl/compare/v1.2.0...v1.2.1) (2020-08-28)


### Bug Fixes

* visibility toggle for layer groups ([bbafa62](https://github.com/dhis2/maps-gl/commit/bbafa6257b84eb52da028fdb1b050187fb2114d5))

# [1.2.0](https://github.com/dhis2/maps-gl/compare/v1.1.0...v1.2.0) (2020-07-06)


### Features

* color option for choropleth layers (DHIS2-8642) ([#129](https://github.com/dhis2/maps-gl/issues/129)) ([bfdaa44](https://github.com/dhis2/maps-gl/commit/bfdaa446df4c983411ec043cda3b30bad8f38e87))

# [1.1.0](https://github.com/dhis2/maps-gl/compare/v1.0.20...v1.1.0) (2020-06-29)


### Features

* pole of inaccessibility (DHIS2-8572) ([#93](https://github.com/dhis2/maps-gl/issues/93)) ([deca78e](https://github.com/dhis2/maps-gl/commit/deca78ec8627df3d67ac5ec4f2d4da9b0928cf75))

## [1.0.20](https://github.com/dhis2/maps-gl/compare/v1.0.19...v1.0.20) (2020-06-29)


### Bug Fixes

* dependency upgrades ([#120](https://github.com/dhis2/maps-gl/issues/120)) ([5a9e2ec](https://github.com/dhis2/maps-gl/commit/5a9e2ecfa47e4bff9ba7d24fa443ba10ab3774cb))

## [1.0.19](https://github.com/dhis2/maps-gl/compare/v1.0.18...v1.0.19) (2020-05-28)


### Bug Fixes

* add missing locale strings in measure controls ([#101](https://github.com/dhis2/maps-gl/issues/101)) ([6ef0b7e](https://github.com/dhis2/maps-gl/commit/6ef0b7e1399c5ad6fe2be593eefc847f2f57d5dd))

## [1.0.18](https://github.com/dhis2/maps-gl/compare/v1.0.17...v1.0.18) (2020-04-24)


### Bug Fixes

* resize map when toggling fullscreen view (DHIS2-8702) ([#85](https://github.com/dhis2/maps-gl/issues/85)) ([da61a02](https://github.com/dhis2/maps-gl/commit/da61a025bdc84b287040aead0d6dcb2207a28f18))

## [1.0.17](https://github.com/dhis2/maps-gl/compare/v1.0.16...v1.0.17) (2020-03-25)


### Bug Fixes

* use parent container for fullscreen map (DHIS2-8524) ([#77](https://github.com/dhis2/maps-gl/issues/77)) ([e1290d6](https://github.com/dhis2/maps-gl/commit/e1290d637c3a34289d3182c66fc132d194818f9c))

## [1.0.16](https://github.com/dhis2/maps-gl/compare/v1.0.15...v1.0.16) (2020-03-24)


### Bug Fixes

* fix failing test ([4a6cd5b](https://github.com/dhis2/maps-gl/commit/4a6cd5bc3b23b2e40f6d0bacf34754bf7628bbbc))
* hide label when mouse cursor leaves the map ([#76](https://github.com/dhis2/maps-gl/issues/76)) ([8d06361](https://github.com/dhis2/maps-gl/commit/8d063615c5914f674ef6b9f74299307fa52819ed))

## [1.0.15](https://github.com/dhis2/maps-gl/compare/v1.0.14...v1.0.15) (2020-03-24)


### Bug Fixes

* trigger cluster update when new cluster tiles are loaded (DHIS2-8498) ([#70](https://github.com/dhis2/maps-gl/issues/70)) ([4e7ec77](https://github.com/dhis2/maps-gl/commit/4e7ec776748e8e7bbc6a20cf90a59f419dbea40b))

## [1.0.14](https://github.com/dhis2/maps-gl/compare/v1.0.13...v1.0.14) (2020-03-19)


### Bug Fixes

* index and ordering for layer groups ([#69](https://github.com/dhis2/maps-gl/issues/69)) ([00bc7d0](https://github.com/dhis2/maps-gl/commit/00bc7d002c6a6c2cca80471e90fc1500caec9f81))

## [1.0.13](https://github.com/dhis2/maps-gl/compare/v1.0.12...v1.0.13) (2020-03-10)


### Bug Fixes

* code cleaning ([#65](https://github.com/dhis2/maps-gl/issues/65)) ([c3bfb82](https://github.com/dhis2/maps-gl/commit/c3bfb8290eb513242829caa4ffca0797cc922f25))

## [1.0.12](https://github.com/dhis2/maps-gl/compare/v1.0.11...v1.0.12) (2020-03-02)


### Bug Fixes

*  hide bing maps logo if download and reset map tilt in navigation control ([#60](https://github.com/dhis2/maps-gl/issues/60)) ([ee83d0d](https://github.com/dhis2/maps-gl/commit/ee83d0d6628e6dbb3b647d8bdb15852f72531501))
* test ([b245ccb](https://github.com/dhis2/maps-gl/commit/b245ccb5abf4be3072df567435e9e1b3308628dd))

## [1.0.11](https://github.com/dhis2/maps-gl/compare/v1.0.10...v1.0.11) (2020-02-26)


### Bug Fixes

* control styles  ([#56](https://github.com/dhis2/maps-gl/issues/56)) ([c6b8b95](https://github.com/dhis2/maps-gl/commit/c6b8b95c267280059209fb4ee88602255892be0f))

## [1.0.10](https://github.com/dhis2/maps-gl/compare/v1.0.9...v1.0.10) (2020-02-26)


### Bug Fixes

* bing tiles over ssh and map control styles  ([#55](https://github.com/dhis2/maps-gl/issues/55)) ([dce77e2](https://github.com/dhis2/maps-gl/commit/dce77e2c0ccacec8795c050c210092c3fa61dba5))

## [1.0.9](https://github.com/dhis2/maps-gl/compare/v1.0.8...v1.0.9) (2020-02-25)


### Bug Fixes

* map remove handler ([#53](https://github.com/dhis2/maps-gl/issues/53)) ([f12f8b9](https://github.com/dhis2/maps-gl/commit/f12f8b9b60765058e8094350137abed7b10fbe19))

## [1.0.8](https://github.com/dhis2/maps-gl/compare/v1.0.7...v1.0.8) (2020-02-24)


### Bug Fixes

* popup handling ([#51](https://github.com/dhis2/maps-gl/issues/51)) ([a9e1fa8](https://github.com/dhis2/maps-gl/commit/a9e1fa80d02b1b39f1a790a8d3bf28cec8bdb832))

## [1.0.7](https://github.com/dhis2/maps-gl/compare/v1.0.6...v1.0.7) (2020-02-24)


### Bug Fixes

* style fixes ([#50](https://github.com/dhis2/maps-gl/issues/50)) ([3c1edb5](https://github.com/dhis2/maps-gl/commit/3c1edb5ed8a2c71aaf5aff0bc2392102ffc7fb14))

## [1.0.6](https://github.com/dhis2/maps-gl/compare/v1.0.5...v1.0.6) (2020-02-20)


### Bug Fixes

* event polygons, event and TEI buffers, refactoring ([#48](https://github.com/dhis2/maps-gl/issues/48)) ([e6ab248](https://github.com/dhis2/maps-gl/commit/e6ab2480c75609c9be039397d331f43cf32b1cd0))

## [1.0.5](https://github.com/dhis2/maps-gl/compare/v1.0.4...v1.0.5) (2020-02-19)


### Bug Fixes

* use https ([#46](https://github.com/dhis2/maps-gl/issues/46)) ([7addb1f](https://github.com/dhis2/maps-gl/commit/7addb1fdf5e3dc23539576b6c47f49a28ca345ee))

## [1.0.4](https://github.com/dhis2/maps-gl/compare/v1.0.3...v1.0.4) (2020-02-18)


### Bug Fixes

* upgrade to latest EE API and fix tile loading ([#45](https://github.com/dhis2/maps-gl/issues/45)) ([022ec22](https://github.com/dhis2/maps-gl/commit/022ec22c041c3dc028033a3dcf473e6df30bc5da))

## [1.0.3](https://github.com/dhis2/maps-gl/compare/v1.0.2...v1.0.3) (2020-02-12)


### Bug Fixes

* bug fixes and styling ([#39](https://github.com/dhis2/maps-gl/issues/39)) ([efd96ad](https://github.com/dhis2/maps-gl/commit/efd96ad58b86d92b7fd555c2049db1fa08362fbd))
* mock mapbox popup component ([a544632](https://github.com/dhis2/maps-gl/commit/a5446325d04a92d36faede2e283517bfb0331db1))

## [1.0.2](https://github.com/dhis2/maps-gl/compare/v1.0.1...v1.0.2) (2020-02-07)


### Bug Fixes

* repo description ([690888f](https://github.com/dhis2/maps-gl/commit/690888f3fef9d12a1eea725bbb4126f4ec1a79f0))

## [1.0.1](https://github.com/dhis2/maps-gl/compare/v1.0.0...v1.0.1) (2020-02-07)


### Bug Fixes

* code clean ([15f0882](https://github.com/dhis2/maps-gl/commit/15f0882c7dcd471ae1e55935330f62b1e0030e96))

# 1.0.0 (2020-02-05)


### Bug Fixes

* boundary labels ([1b3ecaa](https://github.com/dhis2/maps-gl/commit/1b3ecaab90677f590a5e76959b0fef2f10c60f97))
* clickable markers ([c873c4f](https://github.com/dhis2/maps-gl/commit/c873c4ffc07cae3d0d3b1503fb32e2830236ef44))
* client cluster opacity ([e05eb01](https://github.com/dhis2/maps-gl/commit/e05eb011d2df0b6696e17ae5c45fa347d40c0f92))
* cluster opacity ([6da643c](https://github.com/dhis2/maps-gl/commit/6da643cc3bd122bcfd8d46e2b710764b8216086b))
* cluster opacity ([3151511](https://github.com/dhis2/maps-gl/commit/31515118c472684eed22356aef0470d99b782e05))
* cluster refactoring ([41badf9](https://github.com/dhis2/maps-gl/commit/41badf9a2979e680953a8f09305f93bda1ed6476))
* clustering ([0f6353e](https://github.com/dhis2/maps-gl/commit/0f6353e6c337fe2edadb1b346344ba55f581ed9f))
* code clean ([3bebe3b](https://github.com/dhis2/maps-gl/commit/3bebe3bb4a283c879698c39b49e81ebf76eee833))
* code cleaning ([49fb8c6](https://github.com/dhis2/maps-gl/commit/49fb8c6d26b1312d0b2af817bc76ec09678f1509))
* code cleaning ([9b7cdf3](https://github.com/dhis2/maps-gl/commit/9b7cdf3b723cc34470377c1f47fbe5c6491d9f05))
* code cleaning ([48f3a05](https://github.com/dhis2/maps-gl/commit/48f3a059f9a2681621c625a7cd00bd96cfd5f993))
* code cleaning ([0947f89](https://github.com/dhis2/maps-gl/commit/0947f893066fdf2045fb51e592a41234ca69ff40))
* console remove ([d033eaa](https://github.com/dhis2/maps-gl/commit/d033eaa3404da1bf36e1a2c641cd6c0214168f29))
* dependencu upgrade ([299f1cf](https://github.com/dhis2/maps-gl/commit/299f1cfa3cd1764c8385ccdeabd5b15cbcaaf35c))
* donut styling ([46506e6](https://github.com/dhis2/maps-gl/commit/46506e61885e09c161ef009b0e3340100389f225))
* event branches merge ([7d29575](https://github.com/dhis2/maps-gl/commit/7d29575272e30b5f91378b5072962ae9de71cb07))
* hover style ([ee46a9d](https://github.com/dhis2/maps-gl/commit/ee46a9d8bad8aeae3b625b4ed4511fe3fbc10ab1))
* immutable layer config ([80ec0bf](https://github.com/dhis2/maps-gl/commit/80ec0bf64094e8ad444eaee23ababbd1ca8a532c))
* immutable layer config ([225c4a9](https://github.com/dhis2/maps-gl/commit/225c4a9eac1a7f9883a6c4f1d0093b9d4ad506e5))
* import path ([d6efbc4](https://github.com/dhis2/maps-gl/commit/d6efbc4ed59358a71daec94df7aabef17a5d4a7f))
* improved event handling ([be6f775](https://github.com/dhis2/maps-gl/commit/be6f7757ce97d93457174271726ccb61fd0807b9))
* initial update of donut clusters ([ef0696f](https://github.com/dhis2/maps-gl/commit/ef0696f9a88778f5328d8b2969166e2f1b32cfcd))
* initial update of donut clusters ([cc9eb90](https://github.com/dhis2/maps-gl/commit/cc9eb906fa46574c32db71c53b34fbf0645ce668))
* initial version ([1f0c4f5](https://github.com/dhis2/maps-gl/commit/1f0c4f5511b67c8c646187c991fd6a7e8e530c70))
* layer handling ([073905f](https://github.com/dhis2/maps-gl/commit/073905f5dcd6d6a15d40b2771f507d77ffbfcb1a))
* layer order and choropleth opacity ([5070ec0](https://github.com/dhis2/maps-gl/commit/5070ec00b4e267e305982e782cc91d40877329e9))
* layer types in separate file ([8454ce3](https://github.com/dhis2/maps-gl/commit/8454ce35ed30ed1e26e8239ced4c9556e1df6ef3))
* load earth engine api on demand ([ac463e6](https://github.com/dhis2/maps-gl/commit/ac463e67e752b00ca256b9e2e32e1add067bc613))
* mapbox GL JS upgrade ([cbcf711](https://github.com/dhis2/maps-gl/commit/cbcf711a8df6dbdf92b2aff41f308652d6d5d41d))
* marker label style ([dc5c807](https://github.com/dhis2/maps-gl/commit/dc5c8074bebe8923b0527fb5dad07ec0eb15511f))
* plugin legend styles ([c7450ab](https://github.com/dhis2/maps-gl/commit/c7450ab5e4c6ff07b9417c6ea67abf32925b28fc))
* point label offset ([08e040e](https://github.com/dhis2/maps-gl/commit/08e040e05ba849301529d0170800b1e4d99b6d54))
* popup handling ([dcfa4ad](https://github.com/dhis2/maps-gl/commit/dcfa4ad4d366d2d880ede6073446ddd0388658a4))
* popup style ([1479165](https://github.com/dhis2/maps-gl/commit/147916516da950e022235765b6de2fcc9fd371e6))
* popup style ([83f3ca7](https://github.com/dhis2/maps-gl/commit/83f3ca78259c00834220810b2d5d0978aa443e8a))
* proportional circles and hover state ([c841a8e](https://github.com/dhis2/maps-gl/commit/c841a8e67ecc3498b4308d7bbf5bbafc2a7c4d4e))
* remove ee api dep ([505c60f](https://github.com/dhis2/maps-gl/commit/505c60f7a64e385734efc62151347bdb417a00b5))
* remove unused method ([a3fa659](https://github.com/dhis2/maps-gl/commit/a3fa6599ec3a91d1f562e4dc4d6d9244fc70ecee))
* remove unused method ([6a38c7a](https://github.com/dhis2/maps-gl/commit/6a38c7ab26cc2a4f9c8dbb69ace0bbc3ed3b132d))
* repo description ([809f44d](https://github.com/dhis2/maps-gl/commit/809f44d0ddb37c10cbdc1f4c9ec9a065058f658b))
* search handling ([e4a9cdf](https://github.com/dhis2/maps-gl/commit/e4a9cdf0951f6a8ebe7db4cdcb994c34cd1653ab))
* search handling ([a64e981](https://github.com/dhis2/maps-gl/commit/a64e981c9f82e1fcc5c27b0f8da66b32c7c91111))
* server cluster ([0c30fc4](https://github.com/dhis2/maps-gl/commit/0c30fc4e42fbfd94d95d3aace729926b2001271b))
* server cluster cleanup ([f87de9c](https://github.com/dhis2/maps-gl/commit/f87de9c7965e4ca4959b91cbd1da9d8a814ff68b))
* server cluster handling ([25f77c4](https://github.com/dhis2/maps-gl/commit/25f77c4ad0015f5fb109f384a2f4a076836c9e25))
* server cluster handling ([60fb82a](https://github.com/dhis2/maps-gl/commit/60fb82a654aeb1fb7299d3e78ca06338361668ab))
* server cluster updates ([04eecef](https://github.com/dhis2/maps-gl/commit/04eecef5da3707af66e3ac9748c0a2523e62cf02))
* server tiles debugging ([36c4200](https://github.com/dhis2/maps-gl/commit/36c4200f0a0c2aa273577cfc9c4345711bf45c4c))
* spider handling ([1813157](https://github.com/dhis2/maps-gl/commit/1813157c34d611106817f9960d38eba1d9546387))
* spider handling ([3b48c6a](https://github.com/dhis2/maps-gl/commit/3b48c6a5526d74e44ea1155e6e20ae8839629a4b))
* spider handling ([a2948b5](https://github.com/dhis2/maps-gl/commit/a2948b5ae4035f69afcf379eacda9bb372f12fc3))
* split view controls ([8f99b50](https://github.com/dhis2/maps-gl/commit/8f99b50faa586b42138f5d791ab15d9131b354a1))
* updated Mapbox GL JS and new bounds format ([cd9d503](https://github.com/dhis2/maps-gl/commit/cd9d503030b04c4f71be179257d472c4453d6c82))


### Features

* bing Maps layer ([a980875](https://github.com/dhis2/maps-gl/commit/a980875e8cbfb8808c7bb585c7fc961b1e37e47f))
* bing Maps layer ([e86d51a](https://github.com/dhis2/maps-gl/commit/e86d51a961dc56e66c05ec6f7c84e7266d279c00))
* bing maps support ([20c7d23](https://github.com/dhis2/maps-gl/commit/20c7d234bc1f718c6cb82280a8fdd83d989c7b0f))
* close popup method ([070df2b](https://github.com/dhis2/maps-gl/commit/070df2bbf3c393e67d34f2e667ee124b5fdce2b9))
* control types export ([bd70f22](https://github.com/dhis2/maps-gl/commit/bd70f223b727d88781620835bc1f16ac915eeebe))
* dependency upgrade and zoom to layer bounds ([e4936be](https://github.com/dhis2/maps-gl/commit/e4936be9b004928c7fbd75339dfebb6806cfc48a))
* donut chart ([44f7f64](https://github.com/dhis2/maps-gl/commit/44f7f64822337e497b427d985db4e10276fe1881))
* earth engine loader ([f446b8e](https://github.com/dhis2/maps-gl/commit/f446b8ed9aa8d638411f424c166f95b20ef17a32))
* fit to layer bounds control ([a012b5e](https://github.com/dhis2/maps-gl/commit/a012b5eb2ad7496c6ca69209a86672603cea18c5))
* geojson and group layers ([16b837f](https://github.com/dhis2/maps-gl/commit/16b837f8f53b335d0108eb43b6655fde5e6df569))
* geojson layer ([b4486fe](https://github.com/dhis2/maps-gl/commit/b4486fe5f62278270b57eaad8dada442f989f90f))
* hover labels ([63874c3](https://github.com/dhis2/maps-gl/commit/63874c3eb6cbcdcab4d4a67ece2f988c8897a9dd))
* image markers ([c07c48d](https://github.com/dhis2/maps-gl/commit/c07c48dcbc6942280d06a854ada76950ce35681d))
* layer opacity ([de53e08](https://github.com/dhis2/maps-gl/commit/de53e084492508d3f2b5ae8e0c4782eb63718909))
* map control buttons ([bd07caa](https://github.com/dhis2/maps-gl/commit/bd07caa59cc00c2e33ed1df9d37d34ace0636600))
* map control buttons ([c9c8d5f](https://github.com/dhis2/maps-gl/commit/c9c8d5f8e619b21913bdbb8e7a4c60817cdf7699))
* map controls ([bb91804](https://github.com/dhis2/maps-gl/commit/bb91804ba40e4f5b8bd61a52d717e07977054742))
* map controls ([cacd51e](https://github.com/dhis2/maps-gl/commit/cacd51ee55fdab9d558e3a4282d2d78539d89949))
* map controls ([d40ca6a](https://github.com/dhis2/maps-gl/commit/d40ca6aabc5fe52f280366290ef088033179e112))
* map style ([519f867](https://github.com/dhis2/maps-gl/commit/519f867a4f88f933bb1924acc95065d7cdf258e9))
* map sync function ([007ce32](https://github.com/dhis2/maps-gl/commit/007ce32af9fbba5f517b34af1f137601d1307547))
* measure control ([49e3d2c](https://github.com/dhis2/maps-gl/commit/49e3d2c45ae86f5714ee5354a4f86627347b0bbb))
* measurement control ([841f932](https://github.com/dhis2/maps-gl/commit/841f932dc9223a804a4f7e6446c8d9746519bf08))
* measurement control ([902d22b](https://github.com/dhis2/maps-gl/commit/902d22b347767f4de767dad908558ffdd494f667))
* mesaure control ([9aa23de](https://github.com/dhis2/maps-gl/commit/9aa23defe90d3b7e3e1f4be068642e12ca58d4ce))
* mesaure control ([3f43958](https://github.com/dhis2/maps-gl/commit/3f43958260b0192ce35d625895b189ca5db22534))
* new server cluster layer ([092336b](https://github.com/dhis2/maps-gl/commit/092336b8ea85a50f6140860a8d927acc0e1ad436))
* search control ([ec323e9](https://github.com/dhis2/maps-gl/commit/ec323e9be5b278a8d9c1f826824709bccd8b3e70))
* search control ([ab411c3](https://github.com/dhis2/maps-gl/commit/ab411c3187f1b189f9719f36fb18796f2e43eae4))
* server cluster ([d2f920a](https://github.com/dhis2/maps-gl/commit/d2f920adcbdd3b95ab446f637dec19351a97457a))
* server cluster testing ([14702e1](https://github.com/dhis2/maps-gl/commit/14702e15f8580bbd5ba238e2525074f6a911120c))
* spider component ([77a9d7e](https://github.com/dhis2/maps-gl/commit/77a9d7e06aec2ac11a3a6ba68aa26eae8fd264c3))
* spiderify ([aaec935](https://github.com/dhis2/maps-gl/commit/aaec9355e4093a57977fadf5cbc8dea02d932317))
* wms layer ([deed1ee](https://github.com/dhis2/maps-gl/commit/deed1ee1c43959dcfd61f5941711fb0687b7f40c))
