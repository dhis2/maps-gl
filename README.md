# maps-gl

[![DHIS2 Build and Release](https://github.com/dhis2/maps-gl/workflows/DHIS2%20Build%20and%20Release/badge.svg)](https://github.com/dhis2/maps-gl/actions?query=workflow%3A%22DHIS2+Build+and+Release%22)

WebGL mapping engine for DHIS2 Maps

## Link to DHIS2 Maps:

maps-gl folder: `yarn link`
maps-app folder: `yarn link @dhis2/maps-gl`

## Vendored files

`yarn install` writes two third-party files into `src/vendor` (gitignored) through `scripts/prepare-vendor-files.js`:

-   `mapbox-gl-rtl-text.js`, from `@mapbox/mapbox-gl-rtl-text`: the plugin MapLibre's workers load to render right-to-left text. Version 1.0.0 dropped the single-file script MapLibre loads, so stay on 0.x.
-   `ee_api_js_worker.js`, from `@google/earthengine`: the Earth Engine API, adapted to run in the Earth Engine web worker, which we use for performance reasons.

To upgrade either one:

1. Update its pinned version in `package.json`
2. Run `yarn install`
3. Test it in maps-app: Arabic labels for the plugin, Earth Engine layers for the API

## Build from source

In order to use the library you must first build it from source using the command `yarn build`

You may also watch the src directory for changes with the command `yarn watch`

Both of these commands will run the javascript files in the `src` directory through babel to produce both CommonJS and ES Module builds in the `build` directory.

## Publishing

Publication is done automatically by a GitHub action for all commits on the `master` branch. Commits (including pull-request squashed commits) should follow the [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines so that the release bot can determine which version to cut - breaking, feature, or bug

## Publishing pre-release versions during app development

Builds for all non-production branches are automatically copied to [d2-ci/maps-gl](https://github.com/d2-ci/maps-gl) for use during development and testing, prior to production release.

To test changes in a development branch, change the maps-gl dependency of package.json of the app you are testing with. There are a few options:

1. point to a specific commit:

```
"dependencies": {
        "@dhis2/maps-gl": "git+https://github.com/d2-ci/maps-gl.git#70249ebe8be39051fa10142f850de449e1ec488c",
        ...
}
```

2. point to a branch:

```
"dependencies": {
        "@dhis2/maps-gl": "git+https://github.com/d2-ci/maps-gl.git#chore/some-chore",
        ...
}
```

## Report an issue

The issue tracker can be found in [DHIS2 JIRA](https://jira.dhis2.org)
under the [LIBS](https://jira.dhis2.org/projects/LIBS) project.

Deep links:

-   [Bug](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10006&components=11028)
-   [Feature](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10300&components=11028)
-   [Task](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10003&components=11028)
