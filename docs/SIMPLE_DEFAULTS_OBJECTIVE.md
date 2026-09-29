Продолжай разработку текущего Phosphored.

Не проводи повторный общий аудит всего репозитория и не переписывай работающие подсистемы без причины. Изучи затронутый код и его зависимости, затем внеси изменения production-quality.

Работай как сильный senior/staff engineer, product engineer и interaction designer.

Не выполняй требования буквально, если видишь более простое, элегантное и устойчивое решение. Продумывай UX самостоятельно.

При этом не удаляй уже реализованные возможности.

Если существующая функция слишком сложна, нишевая или не нужна большинству пользователей, сохрани её как built-in plugin и выключи по умолчанию.

Пользовательские данные при этом не должны теряться.

# 1. Главная цель продукта

Phosphored должен стать новым типом personal knowledge workspace.

Это не:

* Obsidian с другим UI;
* mind-map;
* force-directed graph viewer;
* файловый менеджер;
* todo-приложение;
* набор отдельных экранов.

Это единое пространственное рабочее пространство, в котором знания имеют физическую форму.

Главный принцип:

**Phosphored не показывает знания. Он превращает их в пространство, по которому можно двигаться.**

И второй принцип:

**внутри система может быть чрезвычайно сложной, но пользователь почти не должен видеть эту сложность.**

Ориентир по UX - лучшие consumer-продукты Apple:

* минимум интерфейса;
* сильные defaults;
* direct manipulation;
* очень плавная spatial continuity;
* progressive disclosure;
* отсутствие необходимости понимать внутреннюю архитектуру;
* ощущение, что система заранее понимает намерение пользователя.

Первые пять минут Phosphored должен казаться проще Obsidian.

Через годы использования он должен оказаться значительно глубже.

Пользователь не должен заметить момент, когда продукт стал сложным.

# 2. UI breakthrough

Не воспринимай существующий UI как окончательную форму продукта.

Работающую функциональность и данные сохраняй, но способы взаимодействия можно серьёзно переосмыслить.

Не нужно просто сделать красивую toolbar.

Нужен новый interaction language именно для spatial knowledge system.

Основное правило:

**не добавляй интерфейс, если можно сделать поведение.**

Перед добавлением:

* кнопки;
* toolbar;
* sidebar;
* modal;
* dropdown;
* отдельной страницы;

сначала подумай, можно ли сделать действие непосредственно над объектом.

Примеры:

* приблизился - увидел больше;
* нажал Atom - сфокусировался;
* потянул - переместил;
* потянул ветвь - переместил ветвь;
* поиск - камера привела к мысли;
* открыл Atom - он превратился в editor;
* закрыл - вернулся обратно в spatial context;
* приблизил - cluster естественно раскрылся.

При этом не делай скрытые загадочные gestures.

Принцип:

**минимум постоянного UI, максимум discoverability.**

Любое важное действие должно либо быть очевидным, либо иметь contextual affordance, либо иметь понятную альтернативу через context menu / search / commands.

# 3. Simple by default

Первый запуск должен быть почти очевидным без onboarding.

Основные действия:

1. создать мысль;
2. написать;
3. связать;
4. найти;
5. приблизиться;
6. переместить;
7. открыть.

Не спрашивать пользователя до начала работы:

* какую physics выбрать;
* какой layout;
* какой provider;
* какие типы;
* какую hierarchy;
* какой task marker;
* какой template root;
* какой storage engine.

Good defaults first.

Advanced settings only when человек сам до них дошёл.

Использовать progressive disclosure.

Условно:

Level 1:

* создать;
* открыть;
* искать;
* связать;
* двигать;
* zoom;
* archive/delete;
* backup.

Level 2 contextual:

* Pin;
* branch actions;
* appearance;
* state;
* advanced link actions;
* export Atom.

Level 3 optional:

* Tasks;
* Kanban;
* Templates;
* Obsidian;
* Daily Notes;
* alternative physics;
* advanced layouts;
* developer/plugin options.

# 4. Core остаётся маленьким и автономным

Core не должен зависеть от Obsidian, Markdown folders или сторонних plugins.

В core оставить фундамент:

* Atom;
* Link;
* Properties;
* базовые states;
* local storage;
* world coordinates;
* renderer primitives;
* search primitives;
* navigation;
* events;
* commands;
* settings infrastructure;
* plugin runtime;
* permission runtime;
* native backup/restore;
* минимальный UI shell.

Не создавать параллельные модели вроде:

* ObsidianNote;
* TemplateNote;
* TaskNote;
* FolderEntity.

По возможности всё остаётся:

**Atom + Link + Properties + State + Spatial Data.**

# 5. States

Сохранить простую модель:

* normal;
* now;
* paused;
* archived.

Не плодить todo/doing/waiting и другие фундаментальные состояния.

Tasks могут интерпретировать state через plugin.

Archive сохраняет:

* links;
* positions;
* appearance;
* pin;
* metadata.

"Сейчас / Всё / Архив" являются lenses/views, а не отдельными хранилищами.

# 6. Один spatial world

Не должно ощущаться:

Global Graph → Local Graph → Note.

Это один непрерывный мир:

**world → regions → islands → clusters → branches → local neighborhood → Atom → content.**

Все уровни используют одну spatial world model.

World coordinates не меняются просто из-за zoom.

Пользователь должен формировать spatial memory.

# 7. Local Graph поставить во главу угла

Local Graph должен стать одним из главных механизмов работы, но не отдельным техническим режимом.

При focus Atom автоматически проявлять meaningful neighborhood:

* direct links;
* backlinks;
* current branch;
* nearby Atom;
* relevant hubs;
* meaningful bridges;
* важные connections второго/третьего уровня.

Не ограничиваться тупым depth=1/2.

Использовать adaptive context с учётом:

* graph distance;
* structural importance;
* relation;
* hub importance;
* density;
* branch boundaries;
* zoom.

Остальной Gigagraph не исчезает.

Он может:

* становиться менее контрастным;
* терять detail;
* уходить визуально назад.

Пользователь всегда понимает:

**где эта мысль находится относительно всей системы.**

Advanced depth/radius настройки можно оставить optional.

# 8. Gigagraph

Поскольку folder-first системы нет, глобальный graph является главным desktop знаний.

Он должен быть полезен даже при 1000+ Atom.

На дальнем zoom нельзя показывать тысячу равноправных точек.

Показывать:

* большие области;
* projects;
* hubs;
* islands;
* major branches;
* bridges;
* плотность;
* disconnected areas.

При приближении detail раскрывается естественно.

Gigagraph не должен превращаться в красивый, но бесполезный hairball.

# 9. Полностью переосмыслить physics/layout

Текущая физика неудовлетворительна.

Проблемы:

* связанные Atom висят вокруг как случайные звёзды;
* Links плохо определяют структуру;
* branches не читаются;
* edges путаются;
* disconnected components разлетаются;
* topology плохо отражается геометрией;
* разные physics modes слишком похожи.

Не лечить это увеличением repulsion.

Нужен гибрид:

**incremental structural layout + elastic molecular physics.**

Сначала строить временный spatial skeleton.

Skeleton не изменяет реальные Links.

Он определяет, какие Links сильнее формируют геометрию.

Учитывать:

* topology;
* hubs;
* centrality;
* importance;
* relation;
* branch size;
* descendants;
* existing positions;
* manual positions;
* node/label footprint;
* density;
* available free space;
* direction текущей ветви.

Layout должен не взрываться из случайного cloud, а постепенно расти:

hub
→ major branches
→ subbranches
→ leaves.

Большая branch получает больше spatial sector.

Новые Atom преимущественно растут в свободную сторону.

Визуально структура должна быть где-то между:

* деревом;
* нейроном;
* молекулой;
* organic knowledge network.

Но без жёсткой классической mind-map symmetry.

Cycles и cross-links сохраняются.

# 10. Physics должна ощущаться живой

Graph не должен быть статичным набором точек.

Но и вся карта не должна трястись.

Когда двигается Atom:

* direct neighbours реагируют заметно;
* следующий уровень слабее;
* дальнейшая connected structure едва ощущает импульс;
* Links натягиваются;
* branch мягко меняет форму;
* pinned/stable regions сопротивляются.

Propagation зависит от:

* graph distance;
* spatial distance;
* structural boundaries.

Ощущение:

**двигаю настоящий элемент молекулы.**

Не:

**двигаю независимую иконку.**

И не:

**началось землетрясение всей карты.**

Нужен баланс:

**стабильность без мёртвости, жизнь без хаоса.**

# 11. Drag и ручное формование graph

Во время drag physics полностью уступает пользователю.

Target строго следует pointer/finger.

После отпускания:

* короткая local relaxation;
* новая структура считается валидной.

Не возвращать Atom на старое auto-layout положение.

Использовать static-friction-like behaviour:

* после drag velocity = 0;
* малые остаточные forces не вызывают creeping;
* сильные structural changes могут естественно сдвинуть свободный Atom;
* Pin означает абсолютный anchor.

Пользователь должен буквально уметь **лепить graph руками**.

# 12. Branch / Cluster как интерактивные объекты

Semantic branch/cluster должен быть не только visual aggregation.

Пользователь может:

* drag whole branch;
* Normal;
* Now;
* Pause;
* Archive;
* Pin/Unpin там, где логично;
* Delete;
* Export через соответствующий plugin.

Group action применяется к текущей visual structural branch.

Не использовать полный connected component, потому что один cross-link не должен захватить половину graph.

При drag branch:

* сохранить internal geometry;
* применить shared spatial delta;
* external Links растягиваются;
* после release local structure мягко settling.

Delete показывает количество Atom:

`Удалить ветвь? 27 атомов`

# 13. Default physics одна

Обычный пользователь не должен видеть список graph engines.

По умолчанию одна универсальная очень хорошая physics.

Alternative physics существуют как optional built-in plugins, выключенные по умолчанию.

Например:

### Branch

Структурный knowledge graph:

* hubs;
* angular sectors;
* branches;
* hierarchy;
* crossing reduction.

### Molecule

Органическая network:

* elastic bonds;
* topology;
* более выраженная propagation movement.

### Compact / Constellation

Большие базы:

* compact islands;
* intelligent clustering;
* stronger LOD.

Режимы должны отличаться самой моделью, а не набором коэффициентов.

# 14. Disconnected Atom

Каждый connected component считать spatial island.

Singleton = маленький island.

Использовать intelligent hierarchical packing.

Disconnected notes:

* не улетают в космос;
* не складываются в grid;
* не превращаются в random cloud.

Они остаются частью общего knowledge world.

# 15. Link routing

Links должны помогать читать graph.

Использовать:

* natural curves;
* parallel separation;
* crossing reduction;
* obstacle avoidance;
* обход labels/nodes;
* structural links сильнее;
* cross-links мягче;
* focus highlighting;
* LOD.

На дальнем zoom показывать только meaningful structural links.

Данные всех Links сохраняются.

# 16. Semantic Zoom - signature feature

Zoom не просто увеличивает canvas.

Он задаёт уровень мышления.

Далеко:

**вся система.**

Средне:

**область / branch.**

Ближе:

**relationships.**

Очень близко:

**content.**

Сейчас grouping вызывает скачки.

Исправить фундаментально.

Жёстко разделить:

* world state;
* physics;
* semantic representation;
* camera.

Camera zoom не меняет world coordinates.

Cluster и children - разные visual representations одной spatial structure.

При zoom in:

* centroid сохраняется;
* children появляются внутри cluster;
* position интерполируется;
* opacity crossfade;
* scale interpolation;
* aggregated edges morph в detailed edges.

При zoom out обратный процесс.

Transitions:

* smooth;
* interruptible;
* reversible.

Использовать ranges + hysteresis, а не один жёсткий threshold.

Не пересобирать layout при semantic switch.

Главный критерий:

**пользователь не способен глазами заметить момент смены semantic level.**

Detail должен ощущаться так, будто всегда находился внутри карты.

# 17. Search = spatial navigation

Search не должен быть просто списком.

Главное действие результата:

**показать мне эту мысль в моём пространстве.**

При выборе результата выполнить intelligent camera flight:

* если нужно, немного zoom out;
* плавно переместиться;
* приблизиться;
* правильно frame target;
* подсветить;
* проявить Local Graph.

Коротко и очень smooth.

Не teleport.

Можно оставить secondary action:

`Открыть сразу`.

Поиск должен помогать spatial memory.

# 18. Immersive Atom opening

Не ощущение:

graph → новая страница.

Atom должен естественно превращаться в editor.

Например:

focus
→ camera слегка центрирует
→ preview расширяется
→ Atom morph в editor.

Desktop может использовать contextual editor.

Mobile почти fullscreen.

При закрытии возвращаются:

* camera;
* zoom;
* focus;
* Local Graph context.

Editor должен как будто вырастать из мысли.

# 19. Spatial Back / Forward

Navigation history должна помнить:

* focused Atom;
* camera;
* zoom;
* meaningful semantic state.

Search → Atom B → Link C → Atom D → Back

естественно возвращает пользователя назад по spatial journey.

Использовать обычные platform Back/Forward.

Не создавать тяжёлую history panel.

# 20. Создание Atom должно быть мгновенным

Новая мысль:

один action
→ Atom появляется в разумном месте
→ cursor уже готов писать.

Не спрашивать перед созданием:

* type;
* category;
* folder;
* layout;
* properties.

Сначала мысль.

Организация потом.

Если Atom создаётся из focused Atom соответствующим действием, новый Atom появляется рядом и получает связь, если намерение пользователя очевидно.

# 21. Помогать создавать хороший graph

Пользователь не должен быть graph designer.

Phosphored должен contextual помогать замечать:

* orphan notes;
* overloaded hubs;
* disconnected Atom;
* useful links;
* duplicate-like notes;
* interesting bridges;
* related thoughts.

Не делать dashboard проблем.

При создании можно мягко предложить:

`Связать: + Юрий + Phosphored`

При drag рядом с подходящей целью может появиться affordance:

`Связать`

Но обычный drag сам Links не создаёт.

# 22. Auto-linking

Без обязательного AI/LLM.

Использовать:

* title;
* aliases;
* нормализацию Unicode;
* case normalization;
* ё/е;
* punctuation;
* token similarity.

Exact title/alias match имеет highest confidence.

Fuzzy около 80% - suggestion, а не silent autolink.

Короткие слова обрабатывать осторожно.

Режимы:

* Предлагать - default;
* Автоматически;
* Выключено.

Silent linking только для действительно однозначных случаев.

Если пользователь отверг auto-link, не создавать его снова до meaningful content change.

Optional syntax:

* `@Юрий`
* `[[Юрий]]`

может существовать как power feature.

# 23. Labels / Emoji / Collision

Исправить съезд labels после emoji.

Использовать реальные text metrics.

Учитывать:

* Unicode graphemes;
* emoji;
* Cyrillic;
* Latin;
* CJK;
* fallback fonts;
* mixed text.

Anchor Atom стабилен.

Measurement cache.

Collision footprint включает:

* node;
* label;
* multiline preview;
* icon;
* padding.

Collision мягкий:

* до overlap почти ничего;
* shallow overlap - мягкая correction;
* deep overlap - сильнее;
* bounded force.

Никаких explosive magnetic forces.

# 24. Close Zoom и Markdown

Сейчас preview слишком далеко, широкий и однострочный.

Переделать progressive content detail:

**title → short preview → multiline preview → richer content.**

На близком zoom:

* content рядом с Atom;
* readable max-width;
* несколько строк;
* adaptive height;
* Markdown rendering;
* bold;
* italic;
* code;
* links;
* lists;
* checkbox.

Не превращать graph в стену карточек.

Количество content зависит от zoom.

# 25. Save indicator

Не показывать внутренние storage writes.

В normal state постоянно тихая:

`✓`

Не переключать Saving/Saved при каждом движении.

Position updates:

* coalesce;
* batch;
* debounce/throttle;
* transaction;
* final drag обязательно flush.

Только настоящая persistent write error после retry меняет indicator на error.

После восстановления снова ✓.

# 26. Хранилища

Добавить простой экран/меню:

**Хранилища**

Показывать только понятную информацию:

`Личные заметки`
`842 атома · изменено сегодня`

Действия:

* создать;
* открыть;
* переименовать;
* backup;
* удалить.

Не показывать человеку SQLite/OPFS terminology.

# 27. Удаление хранилища

Добавить полноценное безопасное удаление.

Пример:

**Удалить «Личные заметки»?**

`842 атома будут удалены с этого устройства.`

Secondary action:

`Сначала создать резервную копию`

Кнопки:

* Отмена;
* Удалить.

Не требовать ввод названия вручную без необходимости.

Если удаляется active storage:

* переключиться на другое;
* если другого нет - создать новый пустой storage.

Удалять только выбранное storage.

Не трогать:

* другие storage;
* application cache;
* PWA;
* другие Vault.

# 28. Native backup - один файл

Главный backup Phosphored:

**одна кнопка → один файл.**

Не Markdown folder.

Например:

`Личные заметки_2026-09-17_16-30.phosphored`

Внутри можно использовать:

* SQLite snapshot;
* manifest;
* schema/version metadata;
* plugin data.

Выбери наиболее надёжную реализацию.

Backup должен содержать всё:

* Atom;
* Links;
* positions;
* state;
* appearance;
* settings;
* plugin settings/data;
* metadata.

Import:

1. validate;
2. проверить format/schema;
3. migration во temporary storage;
4. только после успешной проверки заменить current data.

Повреждённый import никогда не уничтожает рабочее storage.

# 29. Offline-first

Phosphored прежде всего local-first.

После первого успешного запуска offline работают:

* app startup;
* storage;
* Gigagraph;
* Local Graph;
* search;
* Atom;
* editing;
* Links;
* drag;
* native backup;
* enabled local plugins.

Network features деградируют отдельно.

Internet не является условием существования знаний.

# 30. Automatic PWA update

Новая production build автоматически скачивается, когда появляется интернет.

Пользователь никогда не должен ради update:

* очищать site data;
* удалять PWA;
* удалять OPFS;
* удалять SQLite;
* вручную чистить Service Worker.

Application shell cache и user storage полностью независимы.

Service Worker:

* precache shell;
* version assets;
* cleanup old application caches;
* обнаруживать новую build;
* скачивать background;
* не касаться user DB.

Не допускать half-updated app.

Всегда либо:

**полностью рабочая старая версия**

либо:

**полностью рабочая новая версия.**

Если безопасно - активировать незаметно.

Если reload может уничтожить transient unsaved UI state - показать минимальный:

`Доступно обновление`

без technical terminology.

Offline после update по-прежнему обязателен.

# 31. Plugin-first, но не plugin-everything

В core остаются фундаментальные primitives.

Replaceable и optional behaviour должно иметь plugin path.

Не превращать каждую строку кода в plugin ради архитектурной чистоты.

Цель:

**простота продукта**, а не максимальное число plugins.

# 32. Уже реализованные advanced функции не удалять

Проведи targeted classification.

Если уже существующая feature:

* не нужна большинству;
* требует много настроек;
* является альтернативной реализацией;
* визуально перегружает default UI;

не удалять.

Перенести в built-in plugin и **выключить по умолчанию**.

Все данные сохранить.

# 33. Plugin Manager простой

Обычный пользователь видит:

**Плагины**

Например:

Tasks
`Задачи и Kanban`
[Включить]

Templates
`Шаблоны`
[Включить]

Obsidian
`Совместимость с Obsidian`
[Включить]

Daily Notes
`Дневные заметки`
[Включить]

Alternative Physics
`Другие способы организации карты`
[Включить]

Без:

* technical IDs;
* manifests;
* provider names;
* developer terminology.

Advanced information отдельно.

# 34. Obsidian - optional plugin

Core полностью независим от Obsidian.

Obsidian plugin выключен по умолчанию.

Он отвечает за:

* Vault import;
* Markdown export;
* YAML/frontmatter;
* wikilinks;
* Properties;
* source paths;
* folders;
* direct Vault mode;
* Atom `.md` export;
* branch import/export.

Если plugin выключен, Phosphored работает полностью.

# 35. Direct Obsidian Vault

Если browser/runtime позволяет безопасный directory read/write:

показать:

**Подключить Vault**

Работать непосредственно с `.md`.

Использовать capability detection.

Не desktop/mobile detection.

Если direct access недоступен:

* Import Vault;
* Export Vault.

Не показывать broken button.

Не переводить приложение на Electron/Tauri только ради этого.

# 36. Obsidian folders становятся Atom

При import каждая folder становится обычным Atom.

Файлы непосредственно внутри связаны с Folder Atom.

Подпапка:

* становится Atom;
* связана с parent folder.

Например:

Projects
→ Phosphored
→ Physics
→ Plugins

Folder остаётся Atom + plugin-defined property/type.

Если plugin выключен, данные не теряются.

Повторный import не создаёт duplicates.

# 37. Obsidian round-trip

Plugin максимально сохраняет:

* stable phosphored ID;
* title;
* content;
* aliases;
* tags;
* type;
* state;
* importance;
* Links;
* relation metadata;
* x/y;
* Pin;
* appearance;
* source path;
* unknown Obsidian Properties.

Unknown YAML не удалять.

Spatial metadata должна путешествовать вместе с Markdown.

Не хранить важную spatial structure только в отдельном `layout.json`.

# 38. Markdown Export

Native backup остаётся одним `.phosphored`.

Markdown export относится к Obsidian/interop plugin.

Поддержать:

* Export Atom as `.md`;
* Export branch;
* Import branch;
* whole Vault import/export.

При экспорте Vault/folder использовать понятное имя storage + timestamp там, где создаётся archive.

Не просто `phosphored`.

# 39. Branch export/import

Export branch относится именно к текущей structural branch.

Не arbitrary connected component.

Сохранять:

* Atom;
* Links;
* relative coordinates;
* internal geometry;
* IDs/metadata.

При import branch:

* восстанавливать internal structure;
* размещать целиком в свободной области;
* physics только мягко адаптирует boundary.

Не создавать random cloud.

# 40. Templates - optional plugin

Templates plugin выключен по умолчанию.

После включения он регистрирует plugin-defined Atom type:

**Template**

и при необходимости:

**Template Group**.

Atom остаётся обычным Atom.

Если plugin отключили:

* content остаётся;
* Links остаются;
* metadata остаётся;
* Atom отображается обычным.

Но скрыто помнит extension type.

При повторном включении автоматически снова становится Template.

Этот механизм должен быть универсальным для plugin-defined types.

# 41. Template hierarchy

Templates могут естественно образовывать:

Шаблоны
→ Работа
→ Встреча
→ Отчёт
→ Личное
→ Дневник

Picker при вставке показывает это как понятные вложенные группы.

Можно:

* раскрывать groups;
* искать;
* видеть recent;
* создавать group прямо из picker.

Не заставлять пользователя вручную управлять техническим root Atom, если UI может скрыть это.

Внутри всё остаётся Atom + Link.

# 42. Template insertion

Template можно вставить:

* в новый Atom;
* в существующий;
* в cursor position;
* вместо selection, если логично.

Picker должен быть быстрым и простым.

Template library можно скрывать из default Gigagraph, чтобы не засорять layout.

# 43. Tasks - optional plugin

Tasks plugin выключен по умолчанию.

Task живёт в Markdown content Atom.

Не считать task каждый checkbox.

Использовать checkbox + configurable marker.

Например:

`- [ ] @task Купить билеты`

Default marker должен работать сразу.

Настройка marker существует, но пользователь не должен видеть setup screen при первом включении.

# 44. Kanban

При включённом Tasks появляется отдельный View.

Основной active Kanban:

**Сейчас | Общие | Пауза**

Column определяется state source Atom:

* now → Сейчас;
* normal → Общие;
* paused → Пауза.

Дополнительно очень простой switch:

**Активные | Завершённые | Архив**

Не делать пять постоянных колонок.

Task card:

* title task;
* source Atom;
* короткий context при необходимости.

Действия:

* открыть source Atom;
* focus конкретного task;
* complete;
* restore;
* drag между active columns.

Completion обновляет исходный Markdown checkbox.

Не превращать Tasks в отдельный Jira.

# 45. Daily Notes - optional plugin

Daily Notes убрать из hardcoded core.

Default после включения простой:

**одна дневная заметка.**

Advanced settings позволяют отдельно включить:

* Year;
* Month;
* Week of month.

Например:

2026
→ Сентябрь
→ Неделя 3
→ 17 сентября

или:

2026
→ 17 сентября

или:

17 сентября.

Каждый уровень = обычный Atom + Link.

No duplicates.

Naming format configurable, но спрятан в advanced settings.

# 46. Physics полностью через Plugin API

Default bundled physics должна использовать публичный provider mechanism.

Core не содержит привилегированной hardcoded implementation, если это можно избежать.

Provider API примерно:

* registerPhysicsProvider;
* registerLayoutProvider;
* registerLinkRoutingProvider;
* registerCollisionProvider;
* registerSemanticGroupingProvider.

Alternative physics plugins используют тот же механизм.

# 47. Public Plugin API

Нужны устойчивые namespaces примерно:

* `app.atoms`
* `app.links`
* `app.graph`
* `app.events`
* `app.commands`
* `app.storage`
* `app.ui`
* `app.settings`
* `app.views`
* `app.types`

Extensions примерно:

* registerView;
* registerAtomType;
* registerPhysicsProvider;
* registerLayoutProvider;
* registerLinkRoutingProvider;
* registerCollisionProvider;
* registerSemanticGroupingProvider;
* registerImportProvider;
* registerExportProvider.

Названия можешь улучшить.

Не делать decorative API поверх hardcoded systems.

Built-in plugins максимально используют тот же public mechanism.

# 48. Plugin-defined Atom types

Plugin может добавлять type.

Но Atom не становится зависимым от plugin.

Хранить:

* canonical Atom data;
* extension type ID;
* plugin-specific properties.

Если plugin отсутствует:

Atom остаётся читаемым и редактируемым.

После возвращения plugin behaviour восстанавливается автоматически.

Это нужно не только Templates.

Будущие plugins смогут добавлять:

* events;
* contacts;
* books;
* media;
* custom project nodes.

Без schema fragmentation.

# 49. Plugin developer experience

Минимальный plugin должен требовать мало boilerplate.

Концептуально:

```ts
activate(app) {
  app.commands.register(...)
}
```

или:

```ts
activate(app) {
  app.types.register(...)
}
```

Plugin package:

`.phosphored`

с:

* manifest.json;
* main.js;
* optional style.css;
* assets.

Lifecycle:

install → enable → disable → update → uninstall.

Settings/storage namespaced.

# 50. Plugin security

Marketplace сейчас делать не нужно.

Но архитектура должна быть готова к:

* official store;
* alternative repositories;
* sideload;
* local/private plugins;
* plugins пользователя.

Не строить runtime по принципу:

`plugin = unrestricted JS with full access`.

Manifest должен декларировать capabilities:

* network;
* filesystem;
* Vault;
* clipboard;
* notifications;
* read Atom;
* modify Atom;
* UI;
* background;
* external URLs;
* sync.

Не давать direct uncontrolled SQLite access.

Архитектура должна позволять позже:

* permission prompts;
* permission diff on update;
* signing;
* repository trust;
* reputation;
* isolation/sandboxing.

Не нужно сейчас реализовывать весь marketplace.

Принцип:

**safe by default, powerful by permission, simple to develop.**

# 51. Plugins не должны разрушать единый UI

Plugin не получает право автоматически добавить:

* 5 toolbar buttons;
* 3 sidebar;
* badges everywhere.

Plugin использует controlled extension surfaces:

* commands;
* contextual actions;
* optional View;
* Atom type;
* settings;
* inspector contribution.

Даже с 10 plugins Phosphored должен выглядеть одним продуктом.

# 52. Views использовать редко

Graph остаётся главным workspace.

Dedicated View использовать только там, где он объективно лучше.

Kanban - хороший пример.

Не превращать Phosphored в приложение с 20 tabs.

View появляется только если соответствующая capability/plugin включена.

# 53. Motion должна объяснять

Animation должна объяснять:

* откуда появился объект;
* куда он ушёл;
* что связано;
* как изменился scale/context.

Не использовать animation ради decoration.

Motion:

* короткая;
* responsive;
* interruptible;
* spatially meaningful.

Никаких decorative waits и долгих bounce.

# 54. Mobile не является уменьшенным Desktop

Mobile проектировать отдельно.

Использовать:

* tap;
* long press;
* drag;
* pinch;
* swipe;
* contextual bottom surfaces где логично.

Desktop:

* hover;
* right click;
* keyboard;
* multi-selection;
* precise pointer.

Критические действия не должны зависеть только от hover.

# 55. Tap / Context behaviour

Сохранить чистую модель:

Quick tap/click Atom:

* editor/focus.

Long press mobile:

* context menu only.

Right click desktop:

* context menu only.

Editor и context menu не открываются одновременно.

Close возвращает в чистый spatial context.

# 56. Drag state zones

Ordinary drag = movement.

Не путать movement с state change.

Во время drag можно contextual показывать drop zones:

normal:

* Сейчас;
* Пауза;
* Архив.

now:

* Обычный;
* Пауза;
* Архив.

paused:

* Обычный;
* Сейчас;
* Архив.

archived:

* Восстановить.

Drop outside zones меняет только position.

Drop в state zone не использует coordinates самой UI zone как world position.

# 57. Stress tests 100 / 500 / 1000 Atom

Создать realistic deterministic fixtures.

Не просто random nodes.

Использовать:

* projects;
* hubs;
* folders;
* long labels;
* emoji;
* cross-links;
* disconnected islands;
* templates;
* tasks;
* mixed density.

## 100 Atom

Должно выглядеть очень красиво.

Проверить:

* branches;
* labels;
* Local Graph;
* search flight;
* Atom opening;
* tactile drag.

## 500 Atom

Должно быть организованно.

Проверить:

* islands;
* clusters;
* semantic zoom;
* routing;
* Local Graph;
* branch drag;
* performance.

## 1000 Atom

Должно оставаться понятным и красивым.

Нельзя показывать тысячу одинаковых nodes.

Использовать:

* LOD;
* semantic grouping;
* branch reduction;
* link reduction;
* progressive disclosure.

Проверить минимум:

* initial layout;
* reopen saved layout;
* overview → detail zoom;
* pan;
* search navigation;
* Local Graph;
* single drag;
* branch drag;
* create Atom;
* add/remove Link;
* state change;
* open/close editor;
* physics switch;
* semantic transition;
* storage reload.

# 58. Каждый Physics Provider тестировать на 100 / 500 / 1000

Каждый provider должен сохранять собственный характер.

Branch остаётся branching.

Molecule остаётся organic.

Compact остаётся compact.

Не сводить всё к одной physics при больших graph.

Adaptive LOD допустим.

# 59. Performance

Не делать:

* full layout каждый drag frame;
* simulation restart при local change;
* DB write каждый pixel;
* semantic regroup каждый wheel event;
* Markdown render всех Atom на каждый zoom;
* measure всех labels каждый frame.

Использовать:

* Workers;
* incremental layout;
* dirty regions;
* spatial indexes;
* cached measurements;
* LOD;
* local wake/sleep;
* requestAnimationFrame;
* batching;
* graph-distance propagation;
* stable world coordinates;
* hysteresis.

Camera interaction всегда имеет highest interactive priority.

# 60. Innovation review

После реализации пройди по основным пользовательским сценариям и для каждого спроси:

* можно ли убрать ещё один click?
* можно ли убрать кнопку?
* можно ли избежать modal?
* можно ли сохранить spatial context?
* можно ли заменить настройку хорошим default?
* можно ли сделать direct manipulation?
* можно ли сделать feature discoverable через реакцию среды?
* можно ли сделать переход более continuity-preserving?
* можно ли сделать mobile interaction естественнее?

Но не усложняй ради оригинальности.

Инновация здесь означает:

**меньше интерфейса при большей мощности.**

# 61. Signature interactions

Phosphored должен иметь несколько interactions, которые ощущаются уникально.

### Spatial Search

Поиск физически переносит пользователя к мысли.

### Infinite Semantic Zoom

От всей базы до content без ощущения смены экрана.

### Living Graph

Connected structure физически реагирует на действие.

### Morphing Atom

Atom естественно превращается из точки знания в editor.

### Contextual Local Graph

При focus relevant context проявляется автоматически.

### Organic Creation

Новые мысли естественно прорастают рядом с existing context.

Это не showcase animations.

Каждая signature interaction должна реально сокращать действия и помогать понимать знания.

# 62. Главный usability test

После реализации задай вопрос:

**может ли человек, который никогда не видел Phosphored, открыть его и начать пользоваться без инструкции?**

Если ему для базового действия нужно понимать:

* provider;
* physics;
* semantic grouping;
* graph depth;
* plugin type;
* storage engine;
* hierarchy;

значит default UX всё ещё слишком сложный.

Эти понятия могут существовать внутри.

Пользователь должен понимать действия, а не архитектуру.

# 63. Definition of Done

Default experience:

Пользователь открывает Phosphored.

Видит спокойное пространство.

Создаёт мысль.

Пишет.

Создаёт следующую.

Связывает.

Двигает.

Graph мягко реагирует.

Zoom естественно раскрывает структуру.

Search переносит к нужной мысли.

Atom плавно превращается в editor.

Back возвращает в прежний spatial context.

Никакой архитектурной терминологии не требуется.

При этом:

* Local Graph является фундаментальной частью навигации;
* Gigagraph остаётся полезным на больших базах;
* branches строятся осмысленно;
* disconnected notes не висят в космосе;
* links читаются;
* physics ощущается живой;
* пользователь может формовать graph руками;
* Pin работает;
* branch можно двигать как объект;
* semantic zoom максимально smooth;
* grouping не вызывает jumps;
* emoji не ломает labels;
* Markdown preview работает;
* save indicator не мигает;
* native backup = один файл;
* storages можно создавать, переименовывать и удалять;
* damaged backup не уничтожает рабочие данные;
* application полноценно работает offline;
* PWA сама безопасно обновляется;
* update не трогает SQLite/OPFS;
* Obsidian является optional plugin;
* folders Obsidian превращаются в Atom hierarchy;
* Markdown round-trip сохраняет spatial structure;
* отдельный Atom и branch можно переносить через interop plugin;
* Templates optional;
* Template types переживают отключение plugin;
* template groups работают;
* Tasks/Kanban optional;
* completed/archive доступны удобно;
* Daily Notes optional;
* alternative Physics optional;
* уже существующие advanced features не удалены, а убраны из default UX;
* Plugin API реально используется built-in plugins;
* architecture допускает безопасную community ecosystem;
* 100 Atom выглядят великолепно;
* 500 Atom выглядят организованно;
* 1000 Atom остаются понятными и navigable.

Не создавать:

* proof-of-concept;
* dummy providers;
* decorative Plugin API;
* лишние fundamental entities;
* технический UI ради architecture;
* настройки, если можно выбрать хороший default;
* отдельный экран, если interaction можно естественно сохранить в spatial context.

Фундаментальные принципы продукта:

**simple by default.**

**powerful when needed.**

**local-first.**

**graph-first.**

**Local Graph first.**

**one continuous spatial world.**

**small autonomous core.**

**plugin-first for optional and replaceable behaviour.**

**good defaults beat settings.**

**direct manipulation beats controls.**

**spatial continuity beats page navigation.**

**safe by default.**

**smoothness is functionality.**

**user controls the graph, graph helps the user.**

Итоговая цель:

**Phosphored должен быть настолько простым, что им можно начать пользоваться без обучения, и настолько глубоким, что через годы пользователь всё ещё не упрётся в его возможности.**

Инженерия должна быть сложной.

Опыт пользователя - нет.
