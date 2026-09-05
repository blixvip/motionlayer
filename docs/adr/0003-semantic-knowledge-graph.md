# ADR 0003: Versioned semantic knowledge graph

Status: accepted

Semantic interpretation is separate from visual planning. Exact source spans, canonical entities, aliases, relations, claims, modality, negation, metaphor, and ambiguity form a checksummed `VisualKnowledgeGraphVersion`. The opportunity engine consumes this graph and the global narrative state, then the storyboard optimizer selects a sparse set with recurrence and cognitive-load constraints. Unresolved meanings remain explicit review states and never receive invented identities.
