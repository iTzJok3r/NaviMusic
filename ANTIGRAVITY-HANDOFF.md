# Archimedes Music — مهام Antigravity المتبقية

> تسليم من الجلسة السابقة. **اقرأ قسم «قواعد صارمة» قبل أي تعديل.**

---

## ١. الحالة الحالية — لا تكسرها

| الملف | البصمة | الحالة |
|---|---|---|
| `Archimedes-Music.apk` | `0F41463E9978B6E5` | مثبَّت على جوال المستخدم (M2010J19SC · Android 12) |
| `Archimedes-Music-Portable.exe` | `0D126428AF31C5FE` | `ALL CHECKS PASSED` |

**آخر فحص سلامة — كل هذه تعمل:**
```
المعادل: 10 نطاقات ✓ · مضخم البيس: lowshelf ✓ · 8D: الزاوية تتحرك ✓
الصدى: convolver ✓ · الكلمات: تُزامن وتتمرّر ✓ · المكتبة المحلية: تُكتشف وتُشغَّل ✓
التشغيل في الخلفية: يستمر + إشعار بـ3 أزرار ✓ · يوتيوب: يعمل ✓
err: null في كل الفحوص
```

---

## ٢. قواعد صارمة

### أ. لا وكيلان على ملف واحد
**هذا ما أنتج كوداً هجيناً معطوباً سابقاً.** وكيلان كتبا `desktop/renderer.js` معاً، فصار:
- التوجيه: `dry 0.25 / wet +1.15` (من وكيل)
- المرشحات والمتابع: تصميم الإلغاء الطوري (من آخر)

**والنتيجة:** قيمة موجبة في مسار يجب أن يكون سالباً ⟹ **طرقة باس عند كل تفعيل + صراع كل 20 مللي ثانية**.

**إن عمل وكيلان، فليكن كلٌّ في ملف أو نطاق مختلف.**

### ب. لا تحذف عمل الآخرين
كل التعديلات السابقة **إصلاحات في مكانها**، ولم يُحذف شيء. الاستثناء المُعلَن الوحيد: إخفاء زر إغلاق مكرر بـCSS (العنصر ومعالجه باقيان).

### ج. حذار من تخمين أسماء الدوال
أُهدرت جولات على أسماء مخترعة. **الأسماء الحقيقية:**
```
parseLrc · parseSrtOrVtt · parseSubtitle · karaokizeLyrics
cleanArtistName · cleanAlbumName · cleanSongTitle
togglePlayPause · playNext · playPrevious · playSongAt · playLocalTrackAt
shuffleCurrentQueue · removeFromQueue · clearCurrentQueue · setAudioSpeed
cycleBassBoostLevel · toggleReverbMode · toggleNoBeatMode · toggle8DFromCard → toggleSpatialAudio
toggleFloatLyrics · setVisualizerEnabled · scanLocalDeviceMusic · autoDetectLyrics
```
**اقرأ الاسم من الكود أولاً — لا تخمّن.**

---

## ٣. دروس القياس — وفّرت عليّ 6 جولات

**أخطأت في منهجية القياس أربع مرات. لا تكرّرها:**

| الخطأ | الصواب |
|---|---|
| قِستُ **المدخل** لا المخرج — `lowAnalyser`/`midAnalyser` موصولة بـ`prevNode` (كاشفات) | **أنشئ مسبراً عند نقطة الدمج** `noBeatBands.merge` |
| استخدمت مسابر **شفافة**: `peaking`/`highshelf` بكسب 0 تقيس النطاق كاملاً | **استخدم `bandpass`** دقيقة للقياس |
| قارنت **نوافذ مختلفة المحتوى** فأعطت نتائج مستحيلة (كسب سالب يرفع!) | **ثبّت المقطع والطوابع الزمنية** ثم بدّل OFF/ON |
| بدّلت OFF/ON كل 600 مللي ثانية على مؤثر **عابري** | **اقفز إلى نفس الطابع الزمني** (`audio.currentTime = m`) لكل حالة |

**الطريقة الصحيحة المُثبتة:**
```js
for (const m of [45, 80, 115, 150]) {
  for (let rep = 0; rep < 2; rep++) {
    toggleNoBeatMode(false); audio.currentTime = m; await wait(500);
    // اجمع ~34 عيّنة كل 55 مللي
    toggleNoBeatMode(true);  audio.currentTime = m; await wait(500);
    // اجمع نفس العدد
  }
}
// قارن بـ 20*log10(on/off)
```

**وقاعدة حاكمة:** حين يقول المستخدم إنه يرى/يسمع شيئاً وقياسك لا يراه — **قياسك هو المشكوك فيه.**

---

## ٤. إزالة الإيقاع — مكتملة، بانتظار حكم سمعي

**التصميم الحالي (V3):**
```
input ─┬──────────────────────────────────────────────► dry(1.0)
       ├─ kickTap(LP120) → lowAnalyser      [كشف]
       ├─ midBand(BP2800) → midAnalyser     [كشف]
       ├─ highBand(BP8000) → highAnalyser   [كشف]
       └─► kickDuck(90Hz) ► midDuck(3kHz) ► highDuck(7kHz) ► merge
            ↑ الإضعاف داخل المسار: 0 dB عادةً، ينخفض عند العابر فقط
```
**وفرع الضربة المتوازي مُتقاعِد (`target = 0`) لا محذوف** — كان **يُضيف** طاقة بسبب إزاحة الطور (4 أقطاب).

**الإعدادات الحالية:**
```js
kick : env = (transient - 1.10) / 0.42  →  -13.0 dB  ·  تحرير 0.20
mid  : env = (mRatio   - 1.12) / 0.48   →  -10.0 dB  ·  تحرير 0.22
high : env = (hRatio   - 1.15) / 0.52   →   -8.5 dB  ·  تحرير 0.22
حماية الاستمرار : midSustain/highSustain ÷ 45 نبضة (0.9 ثانية)
```

**المقيس:** انخفاض −4.0/−3.0/−3.4 dB · الإضعاف >3dB في 44–49٪ من الوقت · المُغلّف = 0 خلال الاستمرار (حماية صوتية تعمل) · عند الخمول 0 dB تماماً.

### 🔴 ما يجب أن يفعله Antigravity
**اسأل المستخدم أولاً** — هو لم يسمع V3 بعد. ثم:

| إجابته | التعديل |
|---|---|
| «أخفّ» | `kTarget -16` · `mTarget -13` · `hTarget -11` |
| «لا فرق» | العتبات إلى `1.02 / 0.30` |
| **«الحروف تشوّهت / لثغة»** | **`mTarget` من −10 إلى −6** — العلاج المباشر، لأن الوسط يحمل الحروف |
| «ممتاز» | لا تلمس شيئاً |

**⚠️ الخطر الوحيد المتبقي:** `midDuck` عند **−10 dB** وتردده **3000 هرتز** — **وهذا نطاق الحروف (س ت ك ف والنَّفَس)**. لم يُختبر سمعياً.

**تعديل جُرِّب ورُفض:** تقصير التحرير إلى 160/180 مللي ثانية **قلّل الإزالة** (−1.9 سنير مقابل −3.0) ولم يُزل الأثر التراكمي. **التحرير 220 أفضل — لا تُقصّره.**

---

## ٥. المهام المتبقية — مرتّبة

### ١. قائمة التشغيل (كاملة)
الإنشاء والحذف والإضافة تعمل جزئياً. **اختبر:** إنشاء قائمة · إضافة أغنية من `addSongToPlaylist` · حذف · إعادة ترتيب · حذف أغنية من قائمة.
المواضع: `renderPlaylists()` · `addSongToPlaylist()` (قرب سطر 4880) · `playlistModal`.

### ٢. التنزيلات على الجوال
`downloadTrackNow(id, name, suffix)` — يعمل على سطح المكتب (اختبار: **3,204,076 بايت متطابقة**). على أندرويد يستخدم `ArchimedesNative.startDownload` + `pollAndroidDownload` مع `REQ_CREATE_DOCUMENT = 4711`.
**اختبر:** تنزيل مقطع من المسار الأصلي · الإلغاء · الكتابة فوق ملف موجود · تغيّر المسار.
⚠️ **`canDownloadOnThisPlatform()`** — تحقق أنه لا يعرض زر التحميل حيث لا يعمل.

### ٣. يوتيوب على الجوال
التضمين يعمل على سطح المكتب (`desktop/youtube-embed.js` · `mount()` تُرجع `{mode,getPlayer,isReady,destroy}`).
**اختبر على أندرويد:** `configure/resolveOrigin` · الأصل `https://appassets.androidplatform.net` · الأخطاء 150/153 · `openExternal`.
⚠️ **الخطأ 153 كان سببه أصلاً معتماً (`file://`)** — لا تُعِد ذلك.

### ٤. `settings-get` غير مكشوف
معرَّف في `desktop/main.js` **وليس في `desktop/preload.js`**. أضِفه إن احتاجه المستخدم، أو احذفه من `main.js` إن كان ميتاً.

### ٥. ١٣ موضع `innerHTML` بلا فحص أمني
**19 موضعاً** فيها `innerHTML` — **6 منها** فُحصت (سلاسل ثابتة آمنة)، **و13 بلا فحص.**
**راجعها:** كل واحدة تُدرج بيانات من السيرفر يجب أن تمرّ بـ`escapeHtml`.
```powershell
Select-String -Path desktop\renderer.js -Pattern 'innerHTML'
```

### ٦. حماية الصوت بارتباط الاستيريو
اقترحها المستخدم في مواصفته (§8) **ولم تُنفَّذ**. الفكرة: الأصوات مركزية غالباً، وبعض القرع موزّع أوسع — **استخدم الارتباط كإشارة ثقة إضافية فقط**، **لا تفترض «المركز = صوت» أو «الجانب = طبول»** (افتراضات غير موثوقة).
يحتاج `ChannelSplitter`/`ChannelMerger` — **عقدتان جديدتان**.

### ٧. اختبار الأنواع الستة سمعياً
بوب صوتي · هيب هوب · إلكتروني · أكوستيك · صوت هادئ · مزيج كثيف.
**لم تُختبر بالنوع** لأن **91٪ من مكتبة المستخدم بلا وسم نوع (1420 من 1565)**.

---

## ٦. بنية المشروع — للمرجع

```
desktop/renderer.js        ~8100 سطر — كل منطق الواجهة
desktop/renderer.html      ~937 سطر
desktop/main.js            العملية الرئيسية + خادم الواجهة (localhost عشوائي)
desktop/preload.js         الجسر الآمن
desktop/youtube-embed.js   طبقة التضمين
desktop/yt-audio-downloader.py   من كود Antigravity — لم يُعدَّل جوهرياً
design-system.css → styles.css → shell.css   (الترتيب مهم)
android/.../MainActivity.java   23 دالة @JavascriptInterface
lib/                       شجرة Flutter **ميتة** — لا تُبنى ولا تُستخدم
```

**أصول الواجهة:** Electron من `http://localhost:<port>` · أندرويد من `https://appassets.androidplatform.net`
⚠️ **`127.0.0.1` الحرفي يُنتج خطأ يوتيوب 150 — استخدم `localhost`.**

**الخوادم:** `http://<your-server>:4533` (LAN) · `https://m.itzjok3r.qzz.io` (tunnel)
**المصادقة:** Subsonic `md5(password + salt)` · الحزمة `com.itzjok3r.archimedes.debug`

---

## ٧. البناء — الأوامر الصحيحة

```powershell
# إلزامي قبل كل بناء
node --check desktop\renderer.js

# أندرويد
.\sync-android-assets.ps1
.\android\gradlew.bat --project-dir android assembleDebug --console=plain
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s <device> install -r android\app\build\outputs\apk\debug\app-debug.apk
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk Archimedes-Music.apk -Force

# سطح المكتب (أغلق Archimedes|electron|7za أولاً)
cd desktop
npx electron-builder --win portable
cd ..
Copy-Item desktop\dist\Archimedes-Music-Portable.exe Archimedes-Music-Portable.exe -Force

# التحقق
$env:NODE_PATH = (Resolve-Path desktop\node_modules).Path
node .dsh-verify\asar-check.js "desktop\dist\win-unpacked\resources\app.asar"
```

**أدوات التحقق الجاهزة في `.dsh-verify/`:** `cdp-eval.js` (فحص عبر CDP — ضع تعبير JS في `$env:CDP_EXPR` ورقم المنفذ في `$env:CDP_PORT`) · `asar-check.js` · `measure-cpu.ps1` · مسابر متعددة.

**للتحقق على الجوال:**
```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$p = (& $adb -s <dev> shell "pidof com.itzjok3r.archimedes.debug").Trim()
& $adb -s <dev> forward tcp:9400 localabstract:webview_devtools_remote_$p
& $adb -s <dev> shell svc power stayon true   # ← مهم: وإلا دخل وضع الخمول وأوقف المتابع
```

**⚠️ قيد المحاكي:** لا يفكّ ترميز **MP3** (`MEDIA_ELEMENT_ERROR: Format error`) بينما **WAV يعمل** — أُثبت بالمقارنة. **فاختبر الصوت على الجوال فقط.**

---

## ٨. عيوب أُصلحت — لا تُعِدها

| العيب | الإصلاح |
|---|---|
| `[Unknown Artist]` خام في **17 موضعاً** (987 أغنية · 63٪) | `cleanArtistName` في كل موضع + `cleanAlbumName` |
| SRT بنهايات **CRLF** يُفقِد كل المقاطع إلا الأول | تطبيع `\r\n?` ⟶ `\n` في `parseSrtOrVtt` |
| وسوم LRC `[ti:]`/`[ar:]` تُعرَض **ككلمات** | `metaRegex` يستبعدها |
| `[00:05.5]` سنتي ثانية واحدة **يُفقَد** | النمط `(\d{1,3})` |
| الرجوع للخلف يُعلّق تمييز الكلمات | تصفير عند `cur < 0` |
| `ft.`/`feat.` يلوّث بحث الكلمات | حذفه بشرطين آمنين |
| **المكتبة المحلية لا تُكتشف أبداً** | فحص عند فتح القسم |
| تمرير الكلمات يستهدف الصندوق الخطأ | حساب مباشر بـ`rect` بدل `scrollIntoView` |
| Bars يعمل مع 8D فقط | مستمع `visibilitychange` يُعيد الحلقة |
| فشل التشغيل يُبتلع | `reportPlaybackFailure` |
| No Beat يكتُم (خفض ثابت 5 dB + رفع 3.5) | إضعاف داخل المسار، 0 dB عند الخمول |
| زر أبيض بلا ستايل في الاستوديو | `.modal-btn-icon` صار له أسلوب أساسي |
| تكرار X في الاستوديو | إخفاء `npCloseBtn` المكرر |

**والدرس الأكبر:** `noBeatDryGain = 0` (أصل الاكتتام) كان **يُلغى في `applyNoBeatRouting`** — فتعديل قيمة المُنشئ كان **على كود ميت**. **افحص دالة التوجيه لا القيم فقط.**

---

## ٩. أولوية العمل

```
1. اسأل المستخدم عن حكمه على إزالة الإيقاع  ← لا تلمس المؤثر قبله
2. قائمة التشغيل
3. التنزيلات على الجوال
4. يوتيوب على الجوال
5. 13 موضع innerHTML
6. settings-get
7. ارتباط الاستيريو (تحسين اختياري)
8. اختبار الأنواع الستة سمعياً
```

**وبعد كل تعديل:** `node --check` · ابنِ المنصتين · ثبّت على الجوال · **وأعدّ بناء الـEXE.**

---

## ١٠. أدوات مساعدة

- **نسخة استرجاع:** `.dsh-verify/backup-20261004-231343/` (renderer.js · renderer.html · shell.css)
- **المشروع تحت git** — استخدم `git diff -- desktop/renderer.js` لمراجعة التغييرات
- **قائمة مضيفين مسموحة** في IPC ليوتيوب · **حماية اجتياز المسار** في `readSubtitleFile` (رُفض `../../etc/hosts` في الاختبار) · **TLS مُتحقَّق** (أُزيل `nocheckcertificate=True`)
- ⚠️ `diagnoseConnection` يقبل أي مضيف/منفذ — **خطورة منخفضة**، تقييده يُبطل غرضه

**وفّر عمليات البحث:** استخدم `grep`/`Select-String` قبل قراءة ملفات ضخمة، و`node --check` قبل كل بناء.

---

*نهاية التسليم. ابدأ من قسم ٩.*
