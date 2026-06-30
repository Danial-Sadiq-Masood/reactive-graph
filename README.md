# Reactive Graph

This repository is a proof of concept for a small reactive dependency graph.

The goal is to recreate the core mechanics of a reactive system with a minimal
TypeScript implementation. The graph has input nodes and calculated nodes.
Input nodes hold directly assigned values. Calculated nodes derive their values
from other nodes.

The current design explores a two-phase dirty checking algorithm:

1. Mark the affected part of the graph as dirty.
2. Recalculate dirty nodes by recursively resolving their dependencies.

This lets the graph calculate the new state correctly and efficiently without
topologically sorting all nodes before each update.

The project is intentionally small and experimental. It is meant to make the
reactivity model easy to inspect, test, and evolve.
