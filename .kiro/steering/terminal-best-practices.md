---
inclusion: always
name: terminal-best-practices
description: Best practices untuk menjalankan command terminal di Kiro untuk menghindari timeout dan memastikan output terbaca dengan baik
---

# Terminal Command Best Practices

Panduan ini menjelaskan cara menjalankan command terminal di Kiro untuk menghindari timeout issues dan memastikan output dapat dibaca dengan baik.

## 🚨 Masalah Umum

1. **Timeout pada long-running commands** (npm install, npm run build)
2. **Output buffering** - command selesai tapi Kiro tidak menerima output
3. **Spinner/Progress bars** tidak terdeteksi sebagai output aktif
4. **Default timeout (120 detik)** terlalu pendek untuk beberapa operasi

## ✅ Solusi & Best Practices

### 1. Selalu Set Explicit Timeout untuk Long-Running Commands

**Untuk npm commands dan build processes:**

```bash
# Build commands - set timeout ke 300 detik (5 menit) atau lebih
npm run build --no-progress

# Install commands
npm install --no-progress --loglevel=error

# Test commands yang lama
npm run test --no-progress
```

**Implementasi di Kiro:**

```xml
<invoke name="execute_bash">
<parameter name="command">npm run build --no-progress 2>&1 | cat</parameter>
<parameter name="timeout">300000</parameter>
<parameter name="description">Build Next.js project dengan progress disabled</parameter>
</invoke>
```

### 2. Disable Progress/Spinner untuk npm dan Tools Lainnya

**npm flags:**
- `--no-progress` - Disable progress bar
- `--loglevel=error` - Hanya tampilkan errors
- `--loglevel=warn` - Tampilkan warnings dan errors
- `--silent` atau `-s` - Minimal output

**yarn/npm alternative:**
```bash
npm install --no-progress --loglevel=error
yarn install --silent
```

**Force line buffering:**
```bash
npm run build 2>&1 | cat
```

### 3. Gunakan Background Process untuk Dev Servers & Watchers

**Untuk development servers, build watchers, atau interactive commands:**

```xml
<invoke name="control_bash_process">
<parameter name="action">start</parameter>
<parameter name="command">npm run dev</parameter>
<parameter name="cwd">/path/to/project</parameter>
</invoke>
```

**Check output:**
```xml
<invoke name="get_process_output">
<parameter name="terminalId">terminal_id_dari_start</parameter>
<parameter name="lines">50</parameter>
</invoke>
```

**Stop process:**
```xml
<invoke name="control_bash_process">
<parameter name="action">stop</parameter>
<parameter name="terminalId">terminal_id</parameter>
</invoke>
```

### 4. Break Down Long Commands Menjadi Steps

**Alih-alih satu command panjang:**

```bash
# BAD: Terlalu banyak dalam satu command
npm install && npm run build && npm run test && npm run lint
```

**Lebih baik pecah:**

```xml
<!-- Step 1 -->
<invoke name="execute_bash">
<parameter name="command">npm install --no-progress --loglevel=error</parameter>
<parameter name="timeout">180000</parameter>
</invoke>

<!-- Step 2 -->
<invoke name="execute_bash">
<parameter name="command">npm run build --no-progress 2>&1 | cat</parameter>
<parameter name="timeout">300000</parameter>
</invoke>

<!-- Step 3 -->
<invoke name="execute_bash">
<parameter name="command">npm run lint</parameter>
<parameter name="timeout">120000</parameter>
</invoke>
```

### 5. Output Redirection untuk Debugging

**Redirect output ke file untuk commands yang sangat lama:**

```bash
npm run build > build.log 2>&1
echo "Build completed with exit code: $?"
tail -50 build.log
```

### 6. Timeout Guidelines per Command Type

| Command Type | Recommended Timeout | Flags |
|--------------|---------------------|-------|
| `npm install` | 180-300 detik | `--no-progress --loglevel=error` |
| `npm run build` | 300-600 detik | `--no-progress 2>&1 \| cat` |
| `npm run dev` | Background process | N/A |
| `npm run test` | 180-300 detik | `--no-progress` |
| `npm run lint` | 60-120 detik | Default OK |
| Git operations | 60-120 detik | Default OK |
| File operations | 30-60 detik | Default OK |

### 7. Platform-Specific Considerations (macOS/zsh)

**Di macOS dengan zsh:**

- Shell commands menggunakan `zsh` by default
- Pastikan untuk quote file paths dengan spaces
- Gunakan `&&` untuk command chaining, bukan `;`
- Avoid interactive flags (`-i`, `--interactive`)

**Example:**
```bash
# Good - explicit output
npm run build --no-progress 2>&1 | cat

# Bad - interactive mode tidak didukung
npm run build -i
```

### 8. Verification Commands

**Setelah build/install, selalu verify:**

```bash
# Check build success
npm run build --no-progress 2>&1 | cat
echo "Exit code: $?"

# Check if node_modules exists
ls -la node_modules | head -5

# Check build output
ls -la .next/ 2>&1 | head -10
```

## 📋 Template Commands

### Build Command dengan Full Error Output
```xml
<invoke name="execute_bash">
<parameter name="command">npm run build --no-progress 2>&1 | cat || echo "Build failed with exit code $?"</parameter>
<parameter name="timeout">300000</parameter>
<parameter name="description">Build Next.js dengan full error output</parameter>
</invoke>
```

### Install Dependencies dengan Progress Disabled
```xml
<invoke name="execute_bash">
<parameter name="command">npm install --no-progress --loglevel=error 2>&1 | cat</parameter>
<parameter name="timeout">180000</parameter>
<parameter name="description">Install npm dependencies</parameter>
</invoke>
```

### Start Dev Server sebagai Background Process
```xml
<invoke name="control_bash_process">
<parameter name="action">start</parameter>
<parameter name="command">npm run dev</parameter>
<parameter name="cwd">/Users/macbookpro/Documents/Projects/offline-pos-inventory</parameter>
</invoke>
```

### Check Process Output
```xml
<invoke name="get_process_output">
<parameter name="terminalId">terminal_id_here</parameter>
<parameter name="lines">50</parameter>
</invoke>
```

### Run Tests dengan Verbose Output
```xml
<invoke name="execute_bash">
<parameter name="command">npm test -- --no-progress --verbose 2>&1 | cat</parameter>
<parameter name="timeout">180000</parameter>
<parameter name="description">Run tests dengan verbose output</parameter>
</invoke>
```

## ⚠️ Anti-Patterns to Avoid

### JANGAN Lakukan:

1. **Jangan gunakan default timeout untuk build commands**
   ```xml
   <!-- BAD -->
   <invoke name="execute_bash">
   <parameter name="command">npm run build</parameter>
   <!-- Timeout default 120 detik mungkin tidak cukup -->
   </invoke>
   ```

2. **Jangan biarkan spinner/progress berjalan tanpa output**
   ```bash
   # BAD - spinner akan menyebabkan timeout
   npm install
   
   # GOOD - progress disabled
   npm install --no-progress
   ```

3. **Jangan chain terlalu banyak commands dalam satu invoke**
   ```bash
   # BAD
   npm install && npm run build && npm run test && npm run lint && git push
   
   # GOOD - pecah menjadi multiple invokes
   ```

4. **Jangan gunakan interactive flags**
   ```bash
   # BAD - interactive mode tidak didukung
   git commit -i
   npm login
   
   # GOOD - non-interactive
   git commit -m "message"
   ```

## 🔧 Troubleshooting

### Jika Command Timeout:

1. **Check apakah process masih berjalan:**
   ```bash
   ps aux | grep npm
   ```

2. **Kill stuck process jika perlu:**
   ```bash
   pkill -f "npm run build"
   ```

3. **Increase timeout dan retry:**
   ```xml
   <invoke name="execute_bash">
   <parameter name="command">npm run build --no-progress 2>&1 | cat</parameter>
   <parameter name="timeout">600000</parameter> <!-- 10 menit -->
   </invoke>
   ```

### Jika Output Tidak Muncul:

1. **Force output dengan cat:**
   ```bash
   npm run build 2>&1 | cat
   ```

2. **Redirect ke file:**
   ```bash
   npm run build > output.log 2>&1 && cat output.log
   ```

## 📚 Referensi

- npm docs: https://docs.npmjs.com/cli/v9/using-npm/config
- Next.js build optimization: https://nextjs.org/docs/pages/building-your-application/deploying
- zsh manual: https://zsh.sourceforge.io/Doc/
