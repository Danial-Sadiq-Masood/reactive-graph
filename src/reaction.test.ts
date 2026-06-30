import { describe, expect, it } from "vitest";
import { addNode, createGraph } from "./graph";
import { createCalculatedNode, createInputNode } from "./nodes";
import { updateInputValue } from "./reaction";

describe("reaction", () => {
  it("updates a calculated node that depends on an input node", () => {
    const graph = createGraph<number>();
    const input = addNode(graph, createInputNode("input", 1));
    const doubled = addNode(
      graph,
      createCalculatedNode(
        "doubled",
        new Map([["input", input]]),
        (dependees) => dependees.get("input").value * 2
      )
    );

    updateInputValue(graph, "input", 3);

    expect(input.value).toBe(3);
    expect(doubled.value).toBe(6);
    expect(input.dirty).toBe(false);
    expect(doubled.dirty).toBe(false);
  });

  it("recalculates chained calculated nodes in dependency order", () => {
    const graph = createGraph<number>();
    const input = addNode(graph, createInputNode("input", 2));
    const doubled = addNode(
      graph,
      createCalculatedNode("doubled", new Map([["input", input]]), (dependees) => dependees.get("input").value * 2)
    );
    const quadrupled = addNode(
      graph,
      createCalculatedNode(
        "quadrupled",
        new Map([["doubled",doubled]]),
        (dependees) => dependees.get("doubled").value * 2
      )
    );

    updateInputValue(graph, "input", 5);

    expect(doubled.value).toBe(10);
    expect(quadrupled.value).toBe(20);
  });

  it("calculates each dirty calculated node once in a shared dependency graph", () => {
    const graph = createGraph<number>();
    const calls = {
      left: 0,
      right: 0,
      total: 0,
    };

    const input = addNode(graph, createInputNode("input", 1));
    const left = addNode(
      graph,
      createCalculatedNode("left", new Map([["input", input]]), (dependees) => {
        calls.left += 1;
        return dependees.get("input").value + 1;
      })
    );
    const right = addNode(
      graph,
      createCalculatedNode("right", new Map([["input",input]]), (dependees) => {
        calls.right += 1;
        return dependees.get("input").value + 2;
      })
    );
    const total = addNode(
      graph,
      createCalculatedNode("total", new Map([["left",left], ["right",right]]), (dependees) => {
        calls.total += 1;
        return dependees.get("left").value + dependees.get("right").value;
      })
    );

    calls.left = 0;
    calls.right = 0;
    calls.total = 0;

    updateInputValue(graph, "input", 10);

    expect(left.value).toBe(11);
    expect(right.value).toBe(12);
    expect(total.value).toBe(23);
    expect(calls).toEqual({
      left: 1,
      right: 1,
      total: 1,
    });
  });

  it("throws when updating a missing node", () => {
    const graph = createGraph<number>();

    expect(() => updateInputValue(graph, "missing", 1)).toThrow(
      "Node does not exist: missing"
    );
  });

  it("throws when updating a calculated node directly", () => {
    const graph = createGraph<number>();
    const input = addNode(graph, createInputNode("input", 1));
    addNode(
      graph,
      createCalculatedNode("doubled", new Map([["input",input]]), (dependees) => dependees.get("input").value * 2)
    );

    expect(() => updateInputValue(graph, "doubled", 10)).toThrow(
      "Cannot update calculated node: doubled"
    );
  });

  it("throws before mutating values or dirty flags when a reachable cycle exists", () => {
    const graph = createGraph<number>();
    const calls = {
      a: 0,
      b: 0,
    };

    const input = createInputNode("input", 1);
    const a = createCalculatedNode("a", new Map([["input",input]]), (dependees) => {
      calls.a += 1;
      return dependees.get("input").value + 1;
    });
    const b = createCalculatedNode("b", new Map([["a",a]]), (dependees) => {
      calls.b += 1;
      return dependees.get("a").value + 1;
    });

    addNode(graph, input);
    addNode(graph, a);
    addNode(graph, b);

    a.dependees.set("b",b);
    b.dependents.add(a);
    calls.a = 0;
    calls.b = 0;

    expect(() => updateInputValue(graph, "input", 10)).toThrow(
      "Cycle detected: a -> b -> a"
    );

    expect(input.value).toBe(1);
    expect(a.value).toBe(2);
    expect(b.value).toBe(3);
    expect(input.dirty).toBe(false);
    expect(a.dirty).toBe(false);
    expect(b.dirty).toBe(false);
    expect(calls).toEqual({
      a: 0,
      b: 0,
    });
  });
});
