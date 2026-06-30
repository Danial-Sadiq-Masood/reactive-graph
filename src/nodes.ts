export type NodeKind = "input" | "calculated";

export interface BaseNode<T> {
    id : string,
    kind : NodeKind,
    value : T,
    dirty : boolean,
    dependents : Set<CalculatedNode<T>>,
}

export interface InputNode<T> extends BaseNode<T>{
    kind : "input",
    setValue(t : T): void;
}

export interface CalculatedNode<T> extends BaseNode<T>{
    kind : "calculated",
    dependees : Set<Node<T>>
    calculate() : T
}

export type Node<T> = InputNode<T> | CalculatedNode<T>

export function createInputNode<T>(id: string, initialValue: T): InputNode<T> {
  const node: InputNode<T> = {
    id,
    kind: "input",
    value: initialValue,
    dirty: false,
    dependents: new Set(),
    setValue(value: T) {
      node.value = value;
    },
  };

  return node;
}

export function createCalculatedNode<T>(
  id: string,
  dependees: Set<Node<T>>,
  calculate: () => T,
): CalculatedNode<T> {
  const node: CalculatedNode<T> = {
    id,
    kind: "calculated",
    value: calculate(),
    dirty: false,
    dependents: new Set(),
    dependees: dependees,
    calculate,
  };

  for (const dependee of node.dependees) {
    dependee.dependents.add(node);
  }

  return node;
}