# ADR 0006: Durable state and immutable job keys

Status: accepted

PostgreSQL is authoritative for state; Redis is transport and short-lived coordination. Expensive jobs use keys derived from immutable source hashes, source/model/prompt/settings versions, DesignContract checksum, asset-selection version, adapter version, and output specification. Outputs are durably stored before success is committed. Retries reuse matching successful outputs, bounded failures preserve earlier stages, and cancellation stops at safe boundaries.
