# ADR 0004: Provider-neutral acquisition and hard rights gates

Status: accepted

All asset sources implement a typed provider interface. Search metadata is untrusted; URL retrieval and normalization run outside the render network. Identity, security, and licensing are hard gates applied from provider metadata and configured policy, never inferred by a model. Unknown rights mean preview-only. Final renders materialize only approved, content-hashed local renditions. The deterministic fake provider supports development without paid credentials.
