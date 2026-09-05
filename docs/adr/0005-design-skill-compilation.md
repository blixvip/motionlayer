# ADR 0005: Design skills compile once

Status: accepted

Versioned skills, workspace motion language, brand settings, and explicit user direction compile into one checksummed `DesignContract`. Precedence is defaults, workspace, skill, brand kit, then current user direction; security, evidence, source lock, rights, accessibility, and safe zones remain non-overridable invariants. Material token conflicts are recorded. Scene generation consumes the contract rather than repeatedly ingesting raw skill prose.
