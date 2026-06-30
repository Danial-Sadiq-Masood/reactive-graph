import { type Node } from "./nodes";

export interface Graph<T>{
  nodes: Map<string, Node<T>>;
}

export function createGraph<T>(): Graph<T> {
  return {
    nodes: new Map(),
  };
}

export function addNode<T>(graph: Graph<T>, node: Node<T>): Node<T> {
  if (graph.nodes.has(node.id)) {
    throw new Error(`Node already exists: ${node.id}`);
  }

  graph.nodes.set(node.id, node);
  return node;
}

export function getNode<T>(graph: Graph<T>, id: string): Node<T> | undefined {
  return graph.nodes.get(id);
}

