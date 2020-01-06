import sjcl from 'sjcl';

export function graphHash(graph: any, stringify: boolean = true) {
  const string_graph: string = stringify ? JSON.stringify(graph) : graph;
  const bitArray = sjcl.hash.sha256.hash(string_graph);
  return sjcl.codec.hex.fromBits(bitArray);
}
