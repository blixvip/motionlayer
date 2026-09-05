# ADR 0002: Script and transcript remain separate

Status: accepted

Immutable `ScriptVersion` records preserve verbatim copy. Spoken `TranscriptWord` records preserve actual timing. Alignment is a versioned many-to-many mapping so omissions, fillers, restarts, and paraphrases do not rewrite either source. Script-only beats use visibly estimated timing; narration and final-video projects place beats only on words that were actually spoken. Advancing input mode re-aligns existing beat intent and retains locked entity and asset decisions.
