# maps-gl

[![DHIS2 Build and Release](https://github.com/dhis2/maps-gl/workflows/DHIS2%20Build%20and%20Release/badge.svg)](https://github.com/dhis2/maps-gl/actions?query=workflow%3A%22DHIS2+Build+and+Release%22)

WebGL/vector tiles engine for DHIS2 Maps

```sh
> yarn link
> cd examples/maps-gl-react
> yarn link @dhis2/maps-gl
> yarn start
```

## Link to DHIS2 Maps:

maps-gl folder: `yarn link`
maps-app folder: `yarn link @dhis2/maps-gl`

## Build from source

In order to use the library you must first build it from source using the command `yarn build`

You may also watch the src directory for changes with the command `yarn watch`

Both of these commands will run the javascript files in the `src` directory through babel to produce both CommonJS and ES Module builds in the `build` directory.

## Publishing

Publication is done automatically by a GitHub action for all commits on the `master` branch. Commits (including pull-request squashed commits) should follow the [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines so that the release bot can determine which version to cut - breaking, feature, or bug

## Report an issue

The issue tracker can be found in [DHIS2 JIRA](https://jira.dhis2.org)
under the [LIBS](https://jira.dhis2.org/projects/LIBS) project.

Deep links:

-   [Bug](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10006&components=11028)
-   [Feature](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10300&components=11028)
-   [Task](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10003&components=11028)
