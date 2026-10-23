---
title: Help and feedback
description: Get integration help, share a reproducible problem, or tell us how your project uses fatigue-kit.
---

[Get integration help or report a bug](https://github.com/SoraYama/fatigue-kit/issues/new?template=bug-report.yml) · [Suggest a feature](https://github.com/SoraYama/fatigue-kit/issues/new?template=feature-request.yml) · [Share adoption feedback](https://github.com/SoraYama/fatigue-kit/issues/new?template=adoption-feedback.yml)

## Stuck during integration?

Include your package versions, platform, adapter, rules, namespace/key scope and reproduction steps. Describe the expected and actual behavior, whether it blocks you, and any workaround. A minimal example is enough; business source code is not required.

First check that you chose persistent storage if records should survive reloads. The default engine uses memory. Local state cannot enforce authoritative quotas across tabs, processes or devices. See [known limitations](../known-limitations/).

## Share a reproducible state

Use the [Playground](../../../playground/) to recreate the rules, move the simulated clock, and copy a share link. Replace real identifiers and records with fictional data before posting: the URL includes the key, rules, clock and record. If the issue depends on a real adapter or framework, include minimal code too; the Playground uses memory.

The generated Web code uses localStorage and your device clock. It intentionally does not import your simulated record. Call consumption close to the actual display action; React hooks must not consume during render or mount.

## Tell us what happened after trying it

The adoption form asks what you used before, why you tried the library, which step was hardest, and whether you integrated, continued or stopped. A follow-up after at least 14 days helps us understand continued adoption; low-frequency UI does not need daily calls to count as useful.

Feedback is public. Anonymous project descriptions are welcome. Follow-up and reuse of feedback as an anonymous case study are separate, optional permissions in the form. No contact details are required. Closing a code change is distinct from confirming that it solved your problem: we will link the fix or explanation back to the original issue and record whether you could verify it.
