Продолжай разработку текущего Phosphored.

Не проводи повторный аудит всего репозитория и не переписывай работающие части без причины. Изучи только затронутые подсистемы и их зависимости.

Работай как сильный senior/staff engineer, product engineer и interaction designer.

Задача этой итерации не просто закрыть список функций. Нужно заложить фундамент Phosphored как нового типа personal knowledge workspace.

Phosphored не должен быть:

* Obsidian с другим интерфейсом;
* mind-map;
* стандартным force-directed graph;
* todo-приложением с графом;
* файловым менеджером без папок.

Это должна быть **пространственная система мышления**, где знания имеют физическую форму.

Ключевое ощущение:

**пользователь не управляет интерфейсом вокруг graph. Он непосредственно взаимодействует со своими мыслями.**

Ориентир UX: лучшие consumer-продукты Apple в те периоды, когда сложная технология ощущалась очевидной, физичной и почти невидимой.

Интерфейс должен быть:

* минимальным;
* мгновенно понятным;
* tactile;
* fluid;
* spatially consistent;
* очень быстрым;
* спокойным;
* мощным без визуального шума.

Smoothness, continuity, spatial memory, offline reliability и сохранность данных считать функциональными требованиями.

Если проблема фундаментальная, исправляй архитектуру. Не скрывай её коэффициентами, таймерами и дополнительными условиями.

---

# 1. Главная модель продукта: Gigagraph + Local Graph

Phosphored не имеет folder-first интерфейса.

Поэтому graph является не дополнительной визуализацией базы, а **главным рабочим столом продукта**.

Нужно взять лучшее из Global Graph и Local Graph Obsidian, но превратить это в единую систему, пригодную для постоянной работы.

Не должно ощущаться:

Global Graph → отдельный Local Graph → отдельная Note.

Это одно непрерывное пространство:

**весь мир → область → cluster → branch → local neighborhood → Atom → content.**

Переход между уровнями происходит через:

* zoom;
* focus;
* search;
* navigation;
* semantic detail.

Все уровни используют одну spatial world model.

---

# 2. Local Graph поставить во главу угла

Local Graph является одним из основных инструментов работы.

Большой глобальный graph со временем неизбежно становится сложным. Практическая ценность возникает вокруг текущей мысли и её контекста.

При focus Atom показывать meaningful neighborhood:

* direct links;
* backlinks;
* ближайшие Atom;
* текущую branch;
* hubs;
* bridge nodes;
* важные связи второго/третьего уровня;
* meaningful cross-links.

Остальной Gigagraph не обязан исчезать.

Лучше плавно:

* уменьшать opacity;
* снижать detail;
* ослаблять Links;
* отводить визуально назад.

Пользователь должен чувствовать:

**я приблизился к части своего мира знаний, но всё ещё понимаю, где нахожусь.**

Не сводить Local Graph к тупому `depth = 1/2/3`.

Использовать adaptive context с учётом:

* graph distance;
* structural significance;
* relation;
* hub importance;
* density;
* branch boundaries;
* текущего zoom.

Explicit depth можно оставить как дополнительную настройку.

---

# 3. Gigagraph должен быть настоящим рабочим столом

Глобальный graph должен оставаться полезным на:

* 100 Atom;
* 500 Atom;
* 1000 Atom;
* и архитектурно быть готовым к гораздо большим базам.

На дальнем zoom пользователь не должен видеть тысячу одинаковых точек.

Он должен видеть структуру:

* крупные области;
* проекты;
* islands;
* hubs;
* branches;
* density;
* bridges;
* disconnected regions.

При приближении структура раскрывается:

**world → regions → clusters → branches → local graph → Atom → content.**

Это не отдельные страницы.

Это одна карта.

Spatial memory должна сохраняться между уровнями.

---

# 4. Полностью переделать layout/physics

Текущая физика неудовлетворительна.

Сейчас:

* связанные Atom висят вокруг как случайные звёзды;
* структура плохо отражает topology;
* branches не читаются;
* Links пересекаются;
* graph выглядит случайным;
* disconnected Atom висят в космосе;
* разные physics modes слишком похожи.

Нужен другой фундамент:

**incremental structural layout + elastic molecular physics.**

Сначала рассчитывать временный **spatial skeleton**.

Он не изменяет настоящие Links.

Он только определяет, какие связи сильнее формируют геометрию.

Учитывать:

* topology;
* hubs;
* centrality;
* relation;
* importance;
* descendants;
* branch size;
* существующие user positions;
* предыдущую геометрию;
* label footprint;
* свободные spatial sectors;
* density.

После этого структура должна **вырастать**, а не взрываться из случайной стартовой позиции.

Пример:

hub
→ main branches
→ subbranches
→ leaves.

Большой branch получает больше пространства.

Новые descendants преимущественно появляются в свободном направлении текущей ветви.

Нужна органическая структура между:

* деревом;
* нейроном;
* молекулой;
* knowledge map.

Без жёсткой симметрии classic mind-map.

Cycles и cross-links сохраняются.

---

# 5. Graph должен ощущаться живым

Нельзя сделать graph полностью статичным после layout.

И нельзя запускать землетрясение всей карты при каждом drag.

Когда пользователь двигает Atom:

* непосредственные соседи реагируют заметно;
* следующий graph-level слабее;
* дальние элементы могут едва почувствовать движение;
* Links натягиваются;
* branch немного меняет форму;
* pinned/stable regions сопротивляются.

Передавать displacement с attenuation по:

* graph distance;
* physical distance;
* structural boundaries.

Идеальное ощущение:

**я двигаю один атом молекулы и чувствую связанную структуру.**

Не:

**всё неподвижно.**

И не:

**вся карта трясётся.**

Нужен баланс:

**стабильность без мёртвости, жизнь без хаоса.**

---

# 6. Drag должен позволять буквально лепить graph

Во время drag выбранный Atom полностью следует pointer/finger.

Physics никогда не должна бороться с рукой пользователя.

При drag:

1. target следует pointer;
2. direct neighborhood мягко реагирует;
3. воздействие распространяется наружу с attenuation;
4. pinned regions служат anchors;
5. Links визуально натягиваются;
6. после release происходит короткая local relaxation.

После drag новое положение считается новой корректной конфигурацией.

Не возвращать Atom автоматически на предыдущий auto-layout.

Использовать static-friction-like модель:

* после drag velocity → 0;
* малые силы не вызывают медленного creep;
* серьёзные structural changes могут естественно передвинуть Atom;
* `Pin` полностью запрещает physics двигать Atom.

При branch drag:

* branch двигается как единая структура;
* внутренняя форма почти сохраняется;
* boundary Links растягиваются;
* после release окружающий graph локально адаптируется.

---

# 7. Несколько реально разных Physics Plugins

Physics вынести из core.

Built-in implementations должны работать через тот же provider API, который позже смогут использовать сторонние plugins.

Минимум несколько действительно разных моделей.

## Branch

Для структурированных знаний:

* сильный spatial skeleton;
* выраженные hubs;
* branches/subbranches;
* хорошие angular sectors;
* минимизация crossings;
* высокая читаемость hierarchy.

## Molecule

Для свободного мышления:

* topology важнее hierarchy;
* elastic bonds;
* мягкие органические structures;
* более выраженная физическая реакция сети.

## Compact / Constellation

Для больших graph:

* intelligent clustering;
* компактные islands;
* сильный overview;
* эффективный LOD;
* удобен на 500-1000+ Atom.

Можно придумать лучшие названия и реализации.

Критически важно:

**это не три набора коэффициентов одного force simulation.**

Они должны реально различаться по:

* layout;
* movement;
* density;
* visual language;
* behaviour.

---

# 8. Disconnected components и islands

Disconnected Atom не должны улетать далеко от общей карты.

Каждый connected component считать spatial island.

Singleton = маленький island.

На верхнем уровне использовать intelligent packing.

Islands:

* не пересекаются;
* сохраняют внутреннюю форму;
* располагаются достаточно близко;
* могут адаптироваться при изменении размера.

Singleton notes группировать мягко.

Не grid.

Не random cloud.

На больших базах использовать hierarchical island packing.

---

# 9. Links должны помогать понимать graph

Сейчас Links слишком легко превращаются в spaghetti.

Использовать качественный routing:

* natural curves;
* parallel separation;
* crossing reduction;
* obstacle avoidance;
* не проводить линии через labels/nodes без необходимости;
* structural links заметнее;
* cross-links мягче;
* focus усиливает relevant Links;
* distant zoom показывает только meaningful skeleton.

Все Links сохраняются в данных.

Но rendering должен использовать LOD.

Не обязательно показывать всё сразу.

---

# 10. Semantic Zoom должен быть практически незаметен

Сейчас zoom меняет grouping, из-за чего graph прыгает.

Grouping нужен.

Исправлять надо continuity.

Жёстко разделить:

* world state;
* physics;
* semantic representation;
* camera.

Zoom не имеет права сам менять world coordinates.

## Continuity-preserving semantic zoom

Cluster и children считать разными визуальными представлениями одной spatial structure.

При раскрытии cluster:

* centroid сохраняется;
* children появляются внутри его пространства;
* position плавно интерполируется;
* scale интерполируется;
* opacity crossfade;
* aggregated Links morph в detailed Links;
* cluster плавно растворяется.

При zoom out обратный процесс.

Никаких discrete jumps.

Transitions:

* interruptible;
* reversible;
* continuous.

Если пользователь изменил направление zoom посередине transition, animation продолжает движение обратно из текущего состояния.

Использовать ranges и hysteresis вместо одного жёсткого threshold.

Цель:

**пользователь вообще не замечает момент semantic regrouping.**

Детали должны ощущаться так, будто они всегда находились внутри карты.

---

# 11. Search должен быть spatial navigation

Поиск не должен означать только:

`нашёл → открыть`.

Главное действие:

**показать, где эта мысль находится.**

При выборе результата камера плавно летит к Atom:

* при необходимости немного zoom out;
* spatial movement;
* плавное приближение;
* правильный final framing;
* target highlight;
* проявление Local Graph.

Animation короткая, но очень smooth.

Без teleport.

Пользователь должен понять путь:

**откуда я пришёл и где находится найденная информация.**

Можно оставить secondary action:

`Открыть сразу`.

---

# 12. Immersive opening Atom

Открытие заметки не должно ощущаться переходом на другую страницу.

Atom:

→ focus
→ camera слегка центрируется
→ preview расширяется
→ плавно превращается в editor.

Окружающий Local Graph остаётся контекстом.

На desktop editor может быть contextual.

На mobile почти fullscreen.

Но визуально он должен **вырастать из Atom**.

При закрытии восстанавливается:

* тот же camera;
* zoom;
* focus;
* local context.

Back ощущается:

**из мысли обратно в её окружение.**

---

# 13. Spatial history

Back/Forward должны учитывать spatial navigation.

Например:

A → Search → B → C → D

Back:

D → C → B → A.

Сохранять разумно:

* focus;
* camera;
* zoom;
* semantic context.

Без тяжёлого UI.

Поддержать обычные:

* Back;
* Forward;
* keyboard;
* platform gestures.

---

# 14. Помогать пользователю строить хороший graph

Graph должен становиться хорошим не только благодаря ручному rearrange.

Ненавязчиво помогать обнаруживать:

* orphan Atom;
* overloaded hub;
* слабосвязанную branch;
* потенциальную связь;
* duplicates;
* useful bridge;
* disconnected note;
* Atom, который логично связан с текущим.

Но не создавать dashboard ошибок.

Помощь contextual.

При создании Atom можно предложить links.

При drag рядом с подходящим Atom можно показать лёгкий affordance:

`Связать`.

Но обычный drag никогда не создаёт случайные Links.

---

# 15. Emoji, labels и collision

Исправить съезд labels после emoji.

Использовать реальные text metrics.

Учитывать:

* Unicode grapheme clusters;
* emoji;
* Cyrillic;
* Latin;
* CJK;
* mixed fonts;
* fallback fonts.

Anchor Atom не должен сдвигаться из-за glyph metrics.

Measurement кешировать.

Collision footprint включает:

* node;
* label;
* multiline content;
* icon;
* padding;
* close-zoom preview.

Collision мягкий:

* без overlap почти нет силы;
* shallow overlap → мягкая correction;
* deep overlap → сильнее;
* bounded;
* никаких explosive repulsion.

---

# 16. Close Zoom и Markdown preview

Сейчас preview:

* далеко от Atom;
* слишком широкий;
* одна строка;
* плохо показывает content;
* Markdown почти не работает.

Переделать.

Progressive detail:

**title → short preview → multiline preview → richer content.**

На close zoom:

* preview близко к Atom;
* readable max-width;
* multiline;
* adaptive height;
* bold;
* italic;
* inline code;
* links;
* lists;
* checkbox;
* базовый Markdown.

Не превращать graph в стену карточек.

Количество detail зависит от zoom.

---

# 17. Core должен оставаться автономным и минимальным

Очень важный архитектурный принцип.

Сам Phosphored должен полноценно работать без:

* Obsidian;
* Markdown folder structure;
* cloud;
* сторонних plugins.

Core отвечает за:

* Atom;
* Link;
* properties;
* local storage;
* native backup/restore;
* graph state;
* renderer primitives;
* events;
* commands;
* navigation;
* plugin runtime;
* permissions;
* минимальный UI shell.

Всё, что является interoperability/user policy/replaceable behaviour, переносить в plugins.

---

# 18. Native Phosphored backup: один файл

Основной export/backup Phosphored должен быть **одним файлом**.

Экспорт в папку с сотнями `.md` не является основным backup mechanism.

Приоритет:

**один надёжный portable snapshot.**

Можно использовать:

* SQLite database snapshot;

или лучше:

* один `.phosphored` archive, внутри которого SQLite + минимальный manifest/version metadata.

Выбери наиболее надёжную архитектуру.

Критерии:

* весь storage;
* Atom;
* Links;
* positions;
* appearance;
* states;
* plugin settings/data;
* metadata;
* всё необходимое для восстановления.

Import должен быть безопасным.

Перед заменой текущего storage:

1. validate archive/database;
2. проверить version/schema;
3. выполнить migration во временном storage при необходимости;
4. только после успешной проверки активировать импорт.

Никогда не уничтожать рабочую базу из-за повреждённого import.

---

# 19. Имя native export

Сейчас имя просто `phosphored`.

Исправить.

Использовать название текущего хранилища + timestamp.

Например:

`Моя база_2026-09-12_17-42.phosphored`

или `.sqlite`, если выбран raw SQLite export.

Имя должно быть безопасным для filesystem.

Timestamp нужен для snapshots и понятной истории backup.

---

# 20. Obsidian compatibility полностью вынести в Plugin

Obsidian interoperability не должна загрязнять core.

Создать полноценный bundled **Obsidian Plugin**.

Если plugin отключён, Phosphored остаётся полностью функциональным.

Plugin отвечает за:

* Vault import;
* Vault export;
* Markdown;
* YAML/frontmatter;
* wikilinks;
* Obsidian Properties;
* source paths;
* folder interpretation;
* direct Vault folder access;
* single-note `.md` export;
* branch Markdown export/import;
* whole Vault conversion.

Core предоставляет только общие import/export APIs и Atom/Link primitives.

---

# 21. Direct local Vault working mode

Для совместной работы с Obsidian важнейшая функция:

**Подключить локальный Vault.**

Если runtime/browser позволяет безопасный read/write directory access:

* выбрать Vault folder;
* читать `.md`;
* отслеживать изменения;
* записывать изменения обратно;
* поддерживать bidirectional workflow.

Использовать capability detection.

Не определять просто desktop/mobile.

Если браузер умеет directory access на mobile, использовать.

Если нет:

* Import Vault;
* Export Vault.

Никакой сломанной кнопки.

Phosphored остаётся PWA.

Не переходить на Electron/Tauri только ради Vault.

---

# 22. Obsidian folders превращать в Atom hierarchy

Это реализует Obsidian Plugin.

При import:

каждая папка становится обычным Atom.

Все непосредственные файлы связаны с Folder Atom.

Подпапка:

* становится Atom;
* связывается с parent folder.

Например:

Projects/
Phosphored/
Physics.md
Plugins.md

становится:

Projects
→ Phosphored
↙ Physics
↘ Plugins

Folder Atom может иметь plugin-defined type/property.

Но он всё равно остаётся Atom.

Не вводить фундаментальную отдельную `Folder` entity.

При отключении Obsidian plugin данные не исчезают.

---

# 23. Markdown round-trip

Obsidian Plugin должен максимально сохранять:

* stable Phosphored ID;
* title;
* content;
* aliases;
* tags;
* type;
* state;
* importance;
* Links;
* relation metadata;
* x/y position;
* Pin;
* appearance;
* source path;
* unknown Obsidian Properties.

Spatial metadata не должна существовать только в отдельном `layout.json`.

Markdown Atom должен содержать достаточно Phosphored metadata, чтобы после повторного import восстановиться максимально близко к исходному состоянию.

Технические properties можно скрывать в обычном UI.

Unknown YAML не удалять.

---

# 24. Export отдельных заметок через Obsidian Plugin

Добавить:

**Export Atom as Markdown**

Обычный Atom → один `.md`.

Если есть необходимые attachments, plugin корректно экспортирует их рядом.

Это не native backup.

Это interoperability export.

---

# 25. Export / Import branch

Obsidian Plugin должен поддерживать:

**Экспортировать ветвь**

Берётся именно visual structural branch, а не весь connected component через случайный cross-link.

Branch экспортируется как Markdown-compatible structure.

Можно использовать folder/ZIP в зависимости от среды.

Главное:

* Atom metadata сохраняется;
* Links сохраняются;
* relative spatial structure сохраняется;
* branch identity сохраняется.

При import branch должна появиться как **готовая ветвь**, а не случайный cloud.

Сохранять relative coordinates относительно branch centroid.

При вставке в другую базу:

* выбрать свободное место;
* сохранить внутреннюю геометрию;
* затем дать physics только мягко адаптировать внешние связи.

---

# 26. Templates Plugin: plugin-defined Atom types

Templates реализовать более естественно через plugin-defined types.

При включении Templates Plugin он регистрирует тип:

**Template**

При необходимости также можно зарегистрировать:

**Template Group**

или более удачную аналогичную концепцию.

Atom остаётся обычным Atom.

Plugin-defined type является extension metadata.

Критически важно:

если Templates Plugin отключили или удалили:

* Atom не исчезает;
* content не меняется;
* Links не исчезают;
* core отображает его как обычный Atom;
* исходный extension type metadata сохраняется.

Если Templates Plugin снова включить:

* Atom автоматически снова распознаётся как Template;
* ничего повторно настраивать не нужно.

Этот механизм сделать универсальным для plugin-defined types.

---

# 27. Template hierarchy / подпапки

Шаблоны не должны превращаться в длинный плоский список.

Позволить строить hierarchy.

Например:

Шаблоны
→ Работа
→ Встреча
→ Отчёт
→ Личное
→ Дневник
→ Рефлексия

Это всё обычные Atom + Links.

Template Group может быть plugin-defined type либо определяться структурно, если это даёт более чистую модель.

В picker:

**Вставить шаблон**

показывать эту hierarchy как понятные вложенные группы/подпапки.

Можно:

* раскрывать groups;
* искать;
* быстро переходить keyboard;
* показывать recent/favorite templates.

Создание новой группы должно быть простым непосредственно из picker/settings.

Не заставлять пользователя вручную строить техническую структуру.

---

# 28. Вставка Templates

Template можно вставить:

* при создании Atom;
* в существующий Atom;
* в cursor position;
* вместо выбранного текста, если это логично.

Поддержать быстрый searchable picker.

Templates сами остаются полноценными Atom, поэтому их можно:

* связывать;
* редактировать;
* архивировать;
* включать в graph.

Обычный global graph может по умолчанию скрывать Template library, чтобы она не засоряла layout.

Но Local Graph/filters могут её показать.

---

# 29. Tasks Plugin + Kanban

Task живёт внутри Markdown Atom.

Не считать задачей каждый checkbox.

Использовать checkbox + configurable marker.

Например:

`- [ ] @task Купить билеты`

Marker настраивается.

## Active Kanban

Отдельный полноценный View.

Основной режим:

**Сейчас | Общие | Пауза**

Определяется state Atom:

* now → Сейчас;
* normal → Общие;
* paused → Пауза.

Дополнительно очень легко переключать:

**Активные | Завершённые | Архив**

Не делать пять постоянных колонок.

UI должен быть очевидным и компактным.

Task card:

* открывает source Atom;
* focus конкретной строки;
* completion обновляет Markdown;
* можно восстановить;
* показывается source Atom;
* drag между active columns может менять Atom state.

Один Atom может содержать несколько tasks.

---

# 30. Daily Notes полностью сделать Plugin

Нынешнюю Daily Notes функцию полностью вынести из core.

Plugin settings:

отдельно включаются:

* Year;
* Month;
* Week of month.

Пример:

2026
→ Сентябрь
→ Неделя 2
→ 12 сентября

или:

2026
→ 12 сентября

или просто:

12 сентября.

Каждый элемент hierarchy = обычный Atom + Link.

Naming format можно настраивать.

Повторный запуск не создаёт duplicates.

Plugin-defined types можно использовать, если это улучшает UX.

После отключения plugin Atom остаются обычными данными.

---

# 31. Plugin-first architecture

Все функции, которые пользователь потенциально может захотеть:

* заменить;
* отключить;
* радикально изменить;
* получить альтернативную реализацию;

должны иметь extension path.

Кандидаты:

* physics;
* layouts;
* clustering;
* semantic grouping;
* collision;
* link routing;
* Templates;
* Tasks;
* Daily Notes;
* Obsidian compatibility;
* import/export adapters;
* alternative Views;
* node weighting;
* appearance strategies.

Не дробить искусственно всё подряд.

Core должен быть маленьким.

Policy и replaceable behaviour должны жить выше него.

---

# 32. Public Plugin API

Built-in Plugins не должны иметь секретный privileged API без необходимости.

Они должны максимально использовать тот же API, что позже сможет использовать community developer.

Namespaces примерно:

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
* `app.import`
* `app.export`

Provider API примерно:

* registerPhysicsProvider
* registerLayoutProvider
* registerLinkRoutingProvider
* registerCollisionProvider
* registerSemanticGroupingProvider
* registerView
* registerAtomType
* registerImportProvider
* registerExportProvider

Конкретные названия можешь улучшить.

Не делай fake API поверх hardcoded implementation.

---

# 33. Plugin-defined types как фундаментальный extension mechanism

Plugins должны иметь возможность добавлять Atom types.

Но custom type не должен делать данные зависимыми от plugin.

Хранить:

* canonical Atom data;
* extension type identifier;
* plugin-specific properties.

Если plugin отсутствует:

Atom остаётся полностью доступным.

UI может показать:

`Тип недоступен: Templates/Template`

но content и data работают как normal Atom.

После восстановления plugin custom behaviour автоматически возвращается.

Этот механизм нужен не только Templates.

Он позволит позже делать:

* events;
* contacts;
* books;
* media;
* special project nodes;
* любые community types.

Без schema fragmentation.

---

# 34. Простая разработка Plugin

Plugin author experience должен быть лёгким.

Минимум boilerplate.

Что-то концептуально уровня:

```ts
activate(app) {
  app.types.register(...)
  app.commands.register(...)
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

Plugin settings и storage namespaced.

---

# 35. Plugin security заложить заранее

Marketplace сейчас делать не обязательно.

Но runtime нельзя проектировать так, будто любой plugin полностью доверенный.

В будущем:

* official marketplace;
* alternative repositories;
* sideload;
* private plugins;
* собственные plugins пользователя.

Manifest должен уметь декларировать capabilities:

* network;
* filesystem;
* Vault;
* clipboard;
* notifications;
* read atoms;
* modify atoms;
* UI;
* external links;
* background execution;
* sync.

Не давать plugin unrestricted direct access к внутренней SQLite schema.

Архитектура должна позволить позже:

* permission prompts;
* permission diff при update;
* sandbox/isolation;
* signing;
* repository trust;
* reputation.

Не нужно сейчас строить весь marketplace.

Но фундамент не должен мешать безопасности.

Принцип:

**safe by default, powerful by permission, simple to develop.**

---

# 36. Save indicator

Убрать постоянное визуальное мелькание Saving/Saved.

В штатном режиме просто:

`✓`

Movement updates:

* coalesce;
* batch;
* debounce/throttle;
* transaction;
* final drag position обязательно flush.

Только настоящая persistent error после retry показывает error state.

После восстановления снова ✓.

Внутренние storage writes не являются пользовательским событием.

---

# 37. Offline-first

Phosphored прежде всего local-first application.

После первого успешного запуска без интернета должны работать:

* open app;
* Gigagraph;
* Local Graph;
* search;
* Atom editing;
* Links;
* drag;
* Tasks;
* Templates;
* Daily Notes;
* local plugins;
* native backup;
* SQLite/OPFS.

Network-dependent features не блокируют остальной application.

---

# 38. Automatic PWA updates + offline

Новая production build должна автоматически скачиваться при появлении интернета.

При этом:

* site data не очищаются;
* OPFS не очищается;
* SQLite не удаляется;
* пользователь не переустанавливает PWA;
* offline functionality сохраняется.

Application cache и user data строго независимы.

Service Worker:

* precache application shell;
* version assets;
* clean obsolete application caches;
* обнаруживать новую build;
* загружать новую version в фоне;
* не касаться database;
* активировать безопасно.

Не допускать half-updated PWA.

С точки зрения пользователя всегда существует:

**полностью рабочая старая версия**
или
**полностью рабочая новая версия**.

Если reload можно выполнить без потери transient state, обновить незаметно.

Если нет, показать минимальный ненавязчивый update control.

---

# 39. Stress tests: 100 / 500 / 1000 Atom

Создать deterministic realistic fixtures.

Не случайные одинаковые nodes.

Использовать:

* projects;
* folder-like hubs;
* notes;
* cross-links;
* disconnected islands;
* long labels;
* emoji;
* tasks;
* templates;
* mixed density.

## 100 Atom

Приоритет:

* красота;
* tactile physics;
* clean labels;
* readable branches;
* Local Graph.

## 500 Atom

Проверить:

* clustering;
* island packing;
* search navigation;
* semantic zoom;
* local context;
* drag;
* link routing;
* Markdown previews;
* Tasks;
* performance.

## 1000 Atom

Gigagraph всё ещё должен выглядеть осмысленно.

Использовать:

* LOD;
* semantic grouping;
* structural links;
* branch reduction;
* progressive detail.

Проверять:

* initial layout;
* reopen saved layout;
* overview → detail zoom;
* pan;
* search camera flight;
* single Atom drag;
* branch drag;
* add Atom;
* add Link;
* remove Link;
* state change;
* Local Graph;
* open/close editor;
* switching physics;
* semantic transitions.

---

# 40. Каждый Physics Provider тестировать отдельно

Каждый built-in provider проходит:

* 100;
* 500;
* 1000 Atom.

Каждый сохраняет собственный характер.

На 1000 Atom:

* Branch остаётся branching;
* Molecule остаётся organic;
* Compact остаётся compact.

Не сводить их к одному algorithm.

---

# 41. Performance rules

Не делать:

* full graph layout каждый drag frame;
* full simulation restart при local change;
* DB write на каждый pixel;
* semantic regroup на каждый wheel event;
* full Markdown render graph на каждый zoom;
* full text measurement каждый frame.

Использовать:

* Workers;
* incremental calculations;
* dirty regions;
* spatial indexes;
* cached measurements;
* LOD;
* local wake/sleep;
* requestAnimationFrame;
* batching;
* graph-distance propagation;
* stable world positions;
* hysteresis.

Camera interaction всегда должно иметь priority над background refinement.

---

# 42. Definition of Done

Не считать задачу завершённой только потому, что feature существует технически.

Финальный продукт должен удовлетворять:

* Gigagraph является настоящим desktop знаний;
* Local Graph является главным contextual navigation mechanism;
* пользователь понимает, где находится текущая мысль;
* search пространственно переносит к Atom;
* opening Atom immersive;
* Back возвращает spatial context;
* branches автоматически выглядят логично;
* Links читаются;
* islands компактны;
* graph ощущается живым;
* пользователь может руками изменить его форму;
* новые user positions уважаются;
* Pin работает абсолютно;
* semantic zoom не выглядит переключением;
* zoom максимально smooth;
* разные physics действительно различаются;
* emoji не ломают labels;
* close zoom показывает нормальный Markdown;
* Save indicator не дёргается;
* native backup = один надёжный файл;
* filename = storage name + timestamp;
* damaged import не уничтожает текущую DB;
* core не зависит от Obsidian;
* Obsidian compatibility полностью plugin-based;
* direct local Vault mode работает там, где позволяет runtime;
* folders превращаются в Atom hierarchy;
* отдельные Markdown notes можно экспортировать;
* branches можно переносить с сохранением структуры;
* Template является plugin-defined Atom type;
* отключение Templates не уничтожает type metadata;
* повторное включение автоматически восстанавливает Template behaviour;
* template hierarchy удобно отображается как группы/подпапки;
* Tasks/Kanban работает plugin-ом;
* Daily Notes работает plugin-ом;
* physics работает plugin-ом;
* custom Atom types поддерживаются системно;
* PWA полноценно работает offline;
* PWA автоматически обновляется без потери storage;
* plugin architecture готова к будущей безопасной ecosystem;
* 100 Atom выглядят отлично;
* 500 Atom выглядят организованно;
* 1000 Atom остаются красивыми и navigable.

Не создавать:

* proof-of-concept;
* dummy providers;
* декоративный Plugin API;
* временные demo implementations;
* parallel domain models;
* лишние фундаментальные entities, если это решается Atom + Link + Properties.

Если находишь более сильное техническое или UX-решение, используй его.

Сохраняй фундаментальные принципы:

**local-first.**

**graph-first.**

**Local Graph first.**

**one continuous spatial world.**

**small autonomous core.**

**plugin-first for replaceable behaviour and integrations.**

**native backup is simple and reliable.**

**interop does not dictate the core data model.**

**safe by default.**

**smoothness is functionality.**

**user controls the graph, graph helps the user.**

Финальное ощущение:

**Phosphored не показывает знания. Он превращает их в пространство, по которому можно двигаться.**

Graph должен выглядеть так, будто вырос сам, вести себя так, будто живой, и подчиняться пользователю так естественно, словно это физический объект.
