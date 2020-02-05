# maps-gl

![DHIS2 Build and Release](https://github.com/dhis2/maps-gl/workflows/DHIS2%20Build%20and%20Release/badge.svg)

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
