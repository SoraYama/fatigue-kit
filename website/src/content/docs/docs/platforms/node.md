---
title: Node.js
description: Persist records in a local JSON file.
---

```ts
import { createFatigue } from 'fatigue-kit'
import { fileAdapter } from 'fatigue-kit/adapters/node-file'

const fatigue = createFatigue({ storage: fileAdapter('./data/fatigue.json') })
```

The Node 18+ adapter caches one JSON object and writes via a temporary file plus rename. Parent directories are created automatically. Invalid or missing files start empty; write errors call `onError`.

It does not coordinate multiple processes or independently created adapters for the same file. Use external locking or a transactional custom store when that is required.