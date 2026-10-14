# File Editing Rules (CRITICAL)

## Rule 1: ALWAYS use dedicated file tools for file operations

For ANY file read, create, or edit task — use the dedicated tools:

| Task | Tool to use |
|------|------------|
| Read a file | `read_file` or `read_code` |
| Edit part of a file | `str_replace` |
| Create or rewrite a file | `fs_write` |
| Append to a file | `fs_append` |
| Search for files | `file_search` or `grep_search` |

**NEVER use `execute_bash` for file operations.** This means never using `sed`, `awk`, `echo >`, `tee`, `cat >`, `python3 -c`, heredocs, or any shell command to read or write files. These approaches fail on JSX/TSX content due to shell metacharacter conflicts (`>`, `"`, backticks, `$`).

## Rule 2: `str_replace` is the default edit tool

When modifying existing code:
1. Read the relevant section first with `read_file` to get the exact current text
2. Use `str_replace` with the exact `oldStr` and the desired `newStr`
3. If the string is not found, re-read the file to get the current state — never guess

## Rule 3: `fs_write` for full rewrites only

Use `fs_write` only when changes are too large or spread across the file to use `str_replace` efficiently. Always read the full file first before rewriting.

## Rule 4: Stop and switch tools after first failure

If a file operation fails once, **immediately switch to the correct dedicated tool**. Never retry with another shell command variant. Two failed attempts using the same approach is a signal to change strategy entirely, not to keep tweaking.

## Why this matters

Shell heredocs and `-c` scripts break on JSX/TSX files because:
- `>` in className strings is interpreted as shell redirect
- Backticks are interpreted as command substitution
- `$` in `${variable}` JSX expressions triggers shell variable expansion
- Escaping these correctly across nested quotes is error-prone and time-consuming

The dedicated tools (`str_replace`, `fs_write`) operate directly on the filesystem without any shell interpretation — they always work correctly on any file content.
