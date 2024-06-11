# maps-gl

[![DHIS2 Build and Release](https://github.com/dhis2/maps-gl/workflows/DHIS2%20Build%20and%20Release/badge.svg)](https://github.com/dhis2/maps-gl/actions?query=workflow%3A%22DHIS2+Build+and+Release%22)

WebGL mapping engine for DHIS2 Maps

## Link to DHIS2 Maps:

maps-gl folder: `yarn link`
maps-app folder: `yarn link @dhis2/maps-gl`

## How to upgrade earthengine-api

We run earthengine-api in a web worker for performance reasons, and this requires a separate build:

1. git clone https://github.com/MasterMaps/earthengine-api/tree/master (make sure the fork is synced)
2. git chekout master
3. git pull
4. git checkout web-worker-build
5. git merge master
6. cd javascript
7. yarn build
8. copy the contents of javascript/build/worker.js to ee_api_js_worker in this repo

PR to main earthengine-api repo: https://github.com/google/earthengine-api/pull/173

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
        "@dhis2/analytics": "git+https://github.com/d2-ci/maps-gl.git#70249ebe8be39051fa10142f850de449e1ec488c",
        ...
}
```

2. point to a branch:

```
"dependencies": {
        "@dhis2/analytics": "git+https://github.com/d2-ci/maps-gl.git#chore/some-chore",
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
