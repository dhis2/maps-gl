import server from 'mbtiles-server';

server({
  cache: `${process.cwd()}/data`,
  port: 5001,
  verbose: true,
});