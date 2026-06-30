import { type Graph, getNode } from "./graph";
import type { Node, InputNode } from "./nodes";

export function updateInputValue<T>(
  graph: Graph<T>,
  id: string,
  value: T,
): InputNode<T> {
  const node = getNode(graph, id);

  if (!node) {
    throw new Error(`Node does not exist: ${id}`);
  }

  if (node.kind !== "input") {
    throw new Error(`Cannot update calculated node: ${id}`);
  }

  assertNoCyclesFrom(node);

  node.setValue(value);

  react(node);

  return node;
}

type VisitState<T> = {
    visiting: Set<Node<T>>,
    visited: Set<Node<T>>,
    path: Node<T>[],
}

function assertNoCyclesFrom<T>(node : Node<T>){
    visitForCycles(node, {
        visiting: new Set(),
        visited: new Set(),
        path: [],
    });
}

function visitForCycles<T>(node : Node<T>, state : VisitState<T>){
    if(state.visiting.has(node)){
        throw new Error(`Cycle detected: ${formatCyclePath(state.path, node)}`);
    }

    if(state.visited.has(node)){
        return;
    }

    state.visiting.add(node);
    state.path.push(node);

    for(const dependent of node.dependents){
        visitForCycles(dependent, state);
    }

    state.path.pop();
    state.visiting.delete(node);
    state.visited.add(node);
}

function formatCyclePath<T>(path : Node<T>[], repeatedNode : Node<T>) : string{
    const cycleStart = path.findIndex((node) => node === repeatedNode);
    const cycle = path.slice(cycleStart).map((node) => node.id);
    cycle.push(repeatedNode.id);

    return cycle.join(" -> ");
}

function react<T>(node : Node<T>){
    const dirtyNodes = setDirty(node, new Set());
    recalculateAllDirtyNodes(dirtyNodes);
}

function setDirty<T>(node : Node<T>, dirtySet : Set<Node<T>>) : Set<Node<T>> {
    if(dirtySet.has(node)){
        return dirtySet;
    }

    node.dirty = true;
    dirtySet.add(node);
    
    for (const dependent of node.dependents){
        setDirty(dependent, dirtySet)
    }

    return dirtySet;
}

function recalculateAllDirtyNodes<T>(dirtySet : Set<Node<T>>){
    for(const node of dirtySet){
        if(!node.dirty){
            continue;
        }
        recalculateDirtyNode(node);
    }
}

function recalculateDirtyNode<T>(node : Node<T>){
    if(node.kind == "input"){
        node.dirty = false;
        return
    }
    for(const dependee of node.dependees){
        if(dependee.dirty){
            recalculateDirtyNode(dependee)
        }
    }
    node.value = node.calculate();
    node.dirty = false;
}
