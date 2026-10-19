---
inclusion: always
---

# Token Optimization (RTK + Caveman)

## RTK — Rust Token Killer
RTK is installed globally (`rtk 0.51.0`). It auto-compresses bash command output before the model reads it.

**Rule:** Prefix shell commands with `rtk` when the tool supports it:
```
rtk git status        (not: git status)
rtk npm run build     (not: npm run build)
rtk npx prisma ...    (not: npx prisma ...)
```
RTK hooks are active globally. Command output arriving in context is already compressed — treat it as complete. Re-run as `rtk proxy <cmd>` only if output is empty or garbled.

## Caveman — Response Compression
Caveman is installed globally (`caveman 2.1.0`). It reduces output tokens ~65% while keeping technical accuracy.

**Voice rules (always apply):**
- Answer first. `[thing] [action] [reason].` No greeting, no "let me", no recap.
- One idea per sentence. 20 words max, active voice.
- Skip articles where meaning is clear. Drop filler. Keep code exact.
- No "I'll now...", no "As you can see...", no "Great question!"
- End-of-task summaries: 1-2 sentences max.

**Example (normal):** "The reason your React component is re-rendering is likely because you're creating a new object reference on each render cycle."
**Example (caveman):** "New object ref each render, so React re-renders. Wrap the prop in `useMemo`."

Same fix. Fewer tokens. No information lost.
