# POSPHOREA — MASTER PRODUCT GOAL
Продолжай разработку **существующего** проекта Phosphora в моём текущем GitHub-репозитории.

С этого момента продукт называется:

# **Posphorea**
Переименуй проект **везде**, где старое название является именно названием продукта:

- UI;
- title;
- metadata;
- manifest;
- PWA;
- package/app naming, где безопасно;
- README/documentation;
- GitHub Pages presentation;
- internal user-facing strings;
- branding;
- loading;
- export filenames;
- default names.
Перед изменением repository slug, deployment URLs или других вещей, которые могут физически сломать GitHub Pages/CI/external links, оцени последствия. Не ломай рабочий deployment ради косметического rename. Если repository rename требует отдельного внешнего действия, подготовь код корректно и не разрушай существующий deploy.

---

# 0. ЭТО УЖЕ СИЛЬНО РАЗРАБОТАННОЕ ПРИЛОЖЕНИЕ
Это критически важно.

**Не начинай Posphorea с нуля.**

Не воспринимай этот prompt как specification нового проекта.

Сначала изучи:

- текущее состояние repository;
- текущую архитектуру;
- реализованный UI;
- существующие gestures;
- renderer;
- physics/layout providers;
- plugins;
- Tasks/Kanban;
- editor;
- themes;
- semantic zoom;
- lasso;
- selection;
- context menus;
- storage;
- tests;
- текущий roadmap / TODO / существующую документацию.
Определи:

### Уже хорошо реализовано
Сохранять.

### Реализовано, но UX плохой
Переделывать существующее.

### Реализовано частично
Доводить.

### Дублируется
Объединять.

### Реально отсутствует
Только тогда создавать новое.

Не создавать вторую реализацию функции рядом с первой.

Не делать новый menu, если действие уже существует в другом menu и правильнее перенести/упростить его.

Не строить новую task architecture поверх существующей, если можно мигрировать текущую.

Работай **эволюционно с текущим build**.

---

# 1. Сначала изучи текущее состояние и составь внутренний roadmap
Перед большими изменениями:

1. изучи существующий roadmap;
2. посмотри, что уже реализовано из прошлых требований;
3. сопоставь его с этим prompt;
4. обнови приоритеты.
Не трать время на повторную реализацию уже готового.

Главный приоритет теперь задают проблемы и идеи ниже.

---

# 2. Продуктовая цель
Posphorea должна стать:

**живым пространством знаний, которое физически ощущается под пальцами.**

Это не:

- Obsidian clone;
- mind-map;
- generic force graph;
- file manager;
- task manager;
- dashboard.
Основная модель:

**Atom + Link + Properties + Spatial State + Plugins.**

Интерфейс максимально простой.

Сложность спрятана внутри.

Основной принцип:

**не добавляй интерфейс, если действие можно выразить непосредственно через объект.**

---

# 3. Один obvious path для каждого частого действия
Сейчас приложение всё ещё содержит:

- дублирование;
- похожие actions в нескольких menus;
- спрятанные частые функции;
- лишние submenu;
- странную hierarchy.
Проведи полный UX inventory текущего UI.

Для каждого frequent action оставь **один очевидный primary path**.

Secondary path разрешён только если это:

- keyboard shortcut;
- accessibility;
- power-user action.
Никакой ситуации:

`одна и та же команда находится в context menu, "Дополнительно", другом popup и toolbar`.

---

# 4. Целевая gesture grammar
Пользователь должен постепенно понимать приложение буквально пальцами.

### Пустое пространство
Pan:
обычное движение canvas.

Pinch:
zoom.

Long press:
создание Atom / существующий contextual behaviour, если это уже реализовано логично.

### Atom
Tap:
focus/open по текущему контексту.

Tap по тексту:
редактировать.

Drag:
двигать.

Drag на другой Atom:
предложить Link.

Long press без movement:
context menu.

### Multiple Atom
Lasso:
выделение.

Drag выделенного:
двигается selection.

Context action:
применяется ко всей selection.

### Links
Drag onto target:
создать.

Explicit link interaction:
reconnect/delete/relation.

Именно такой interaction language должен становиться основой всего UI.

---

# 5. ГЛАВНЫЙ BLOCKER: Living Graph
Сейчас connected Atom снова ощущаются слишком независимыми.

Это неправильно.

Если Atom не pinned, graph должен быть живой connected structure.

При drag одного Atom:

- dragged Atom следует пальцу 1:1;
- direct neighbours заметно реагируют;
- второй graph level реагирует слабее;
- дальше воздействие постепенно затухает;
- branch сохраняет свою внутреннюю форму;
- hub обладает большей инерцией/структурным весом;
- pinned nodes остаются неподвижными;
- соседние branches могут освобождать место;
- после release система мягко находит новое equilibrium.
Пользователь должен иметь возможность буквально:

**потянуть за одну точку целую незакреплённую сеть.**

Но это не означает жёсткий перенос всей connected component.

Реакция attenuated.

---

# 6. Structural Weight
Поведение должно учитывать условный физический/структурный вес.

Вес может зависеть от:

- number of Links;
- graph centrality;
- subtree size;
- branch size;
- importance;
- Atom visual size;
- type;
- user spatial history.
Leaf двигается легче.

Большой hub тяжелее.

Но unpinned Atom никогда не становится скрыто закреплённым.

---

# 7. Distance и topology влияют на propagation
Drag propagation должна зависеть одновременно от:

- graph distance;
- physical distance;
- structural boundaries;
- branch membership;
- weight.
Не просто один коэффициент по hop count.

Connected branch должна вести себя как эластичная структура.

---

# 8. Сохранение формы branch
При moving:

### Leaf
локально растягивает branch.

### Branch hub
тянет значительную часть branch.

### Main hub
способен сдвигать заметную часть component.

### Group/constellation
сохраняет internal geometry сильнее.

Всё это остаётся responsive.

---

# 9. Большой zoom не должен путать Links
Сейчас при drag на большом масштабе связи визуально путаются.

Исправить link geometry / routing / transform handling.

Проверить:

- screen/world transforms;
- curve control points;
- drag representation;
- semantic representation;
- high zoom precision;
- clipping;
- interpolation.
Link должен оставаться визуально прикреплённым к правильным endpoints при любом zoom.

Не должно появляться впечатление, что линия временно принадлежит другому Atom.

---

# 10. Manual movement ≠ Pin
После ручного drag:

не фиксировать Atom навсегда в точке.

Drag сообщает:

**я хочу изменить форму карты примерно таким образом.**

Это spatial intent.

Graph принимает это решение и адаптирует соседей.

Pin — единственное absolute lock.

---

# 11. Layout / Physics switching должен сохранять spatial memory
Сейчас при смене типа структуры Atom улетают куда-то, а после возврата старого layout снова выглядят нормально.

Это неправильная архитектура.

Новый provider должен получать:

**current world coordinates как initial condition.**

Нельзя:

old layout
→ уничтожить positions
→ новый random layout.

Нужно:

old equilibrium
→ меняются физические правила
→ current structure постепенно приходит к equilibrium нового provider.

---

# 12. Morph физических правил
При смене provider:

1. сохранить positions;
2. сохранить Pins;
3. сохранить manual spatial influence;
4. сохранить branch identity;
5. инициализировать новый provider этой geometry;
6. постепенно менять force rules;
7. локально адаптировать graph.
Это должно выглядеть почти как:

**сама материя карты изменила свои свойства.**

Очень сильная signature interaction.

---

# 13. Auto-layout должен учитывать новые Atom
Living structure должна самостоятельно адаптироваться, когда появляются:

- новые children;
- новые Links;
- новый hub;
- крупная branch.
Учитывать:

- subtree size;
- weights;
- free space;
- collisions;
- labels;
- crossings;
- branch cohesion.
Не перестраивать всю карту.

Адаптировать affected region.

---

# 14. Links всегда должны быть понятны
Сейчас может существовать две связи, но первая не видна даже на максимальном zoom, пока связанный Atom не выбран.

Это неприемлемо.

Если Link существует, пользователь должен иметь предсказуемый способ видеть его.

Использовать LOD только для visual priority:

- structural link;
- cross-link;
- ambient link;
- selected link.
Но не скрывать реальную local Link полностью просто из-за focus/lens heuristic.

---

# 15. Убрать неработающее lens behaviour
Если существующее линзирование:

- скрывает Links;
- убирает nearby labels;
- ухудшает понимание структуры;
убрать его полностью.

Сохранить полезные вещи:

- semantic zoom;
- ambient attention;
- priority LOD;
- opacity hierarchy.
Но не отдельную lens-систему, которая делает graph менее предсказуемым.

---

# 16. Link creation — drag onto Atom
Основной способ связывания должен стать почти очевидным без обучения.

Пользователь двигает Atom A.

При приближении к B:

- B мягко подсвечивается;
- появляется monochrome chain icon;
- между ними появляется preview elastic Link;
- target может слегка магнититься;
- на mobile возможен subtle haptic feedback.
Можно показать коротко:

**Связать**

Если отпустить:

- создаётся Link;
- Atom A возвращается к исходной spatial position либо очень близко к ней;
- новая связь начинает влиять на living physics;
- local graph адаптируется.
Таким образом создание связи не разрушает расположение пользователя.

---

# 17. Link drag intent должен отличаться от обычного rearrangement
Не создавать Link при случайном пересечении Atom во время обычного rearrangement.

Нужны:

- magnetic threshold;
- short visual confirmation;
- clear chain affordance;
- release inside connection state.
Пользователь должен понимать, что сейчас произойдёт.

---

# 18. Existing connection
Если Link уже существует:

не создавать duplicate.

Показывать:

`Связаны`

или соответствующую chain visual state.

---

# 19. Advanced Link editing
Дополнительно можно оставить быстрый режим:

focus Atom
→ connection handle
→ провести линию.

Existing endpoint можно схватить и перенести:

A → B

становится:

A → C.

Без delete + recreate.

---

# 20. Link Undo
Undo after linking/unlinking:

- маленький toast;
- несколько секунд;
- dismissable;
- не мигает;
- не остаётся навсегда;
- не участвует в graph rendering.
Сейчас бесконечно висящие Undo/Cancel surfaces исправить системно.

---

# 21. Undo не должен мигать при движении canvas
Любой toast/status UI должен быть отделён от camera/render invalidation.

Pan/zoom/drag не должны заставлять Undo визуально rerender/flicker.

---

# 22. Основное место теперь называется «Поле»
Переименовать пользовательское состояние/раздел:

**Обычно → Поле**

Где это относится именно к главному normal workspace/state.

Логика:

- Поле;
- Сейчас;
- Архив.
Не превращать это в три физически разные базы.

Это разные lenses/state representations одной knowledge system.

Внутреннее enum `normal` можно сохранить, если rename DB/schema создаёт ненужную migration.

UI говорит:

**Поле**.

---

# 23. Pause упростить
Pause не является равноправной основной категорией.

Не показывать её рядом с:

- Поле;
- Сейчас;
- Архив
без необходимости.

Внутренняя модель:

state:

- normal/field
- now
- archived
modifier:

- paused true/false
UI action:

**Отложить**

Paused items можно показать contextual/secondary.

Убрать бессмысленную Pause из `Дополнительно`, если она там дублируется.

---

# 24. Type должен быть рядом с основными свойствами
Сейчас Type спрятан слишком глубоко.

Type важен для:

- icons;
- AI;
- semantics;
- visual hierarchy.
В Atom menu разместить его рядом с основными metadata/actions.

Не прятать в `Дополнительно`.

Но **тип Task удалить**.

Task больше не Atom type.

---

# 25. Monochrome icon system
Сделать для Atom красивую базовую библиотеку чёрно-белых/монохромных пиктограмм в эстетике Nothing-like minimal iconography:

- минималистичные;
- графичные;
- единый stroke;
- хорошо читаемые на маленьком масштабе;
- без emoji aesthetic.
Примеры:

- note;
- idea;
- project;
- person;
- folder;
- hub;
- reference;
- media;
- event;
- custom.
Icon является частью Type/Appearance.

Цвет остаётся отдельной характеристикой.

---

# 26. UI CLEANUP — один большой проход
Перед добавлением новых menus провести реальную чистку.

Проверить:

- context menu;
- additional menu;
- appearance;
- editor;
- Atom menu;
- selection actions;
- links;
- state actions.
Убрать:

- duplicates;
- redundant navigation;
- лишние headings;
- одинаковые actions в разных местах;
- dead controls;
- legacy controls.
Цель:

**минимум изучения приложения до уверенной работы.**

---

# 27. Рекомендуемая hierarchy Atom menu
Не следовать ей буквально, если текущий UI позволяет сделать ещё лучше.

Но частые вещи должны быть наверху.

Например:

### Основное

- Поле / Сейчас / Архив
- Тип
- Pin
- Связи

### Appearance

- icon
- color
- size/style

### Secondary

- Отложить
- Export
- plugin actions
- Delete
Не делать `Связи` и `Тип` спрятанными в третьем уровне.

---

# 28. Editor должен открываться сразу в visual mode
Сейчас visual editing почему-то скрыт при открытии.

Default editor:

**visual / WYSIWYG-like mode.**

Пользователь сразу видит:

- headings;
- bold;
- italic;
- lists;
- checkbox;
- task checkbox;
- links;
- formatting.
Подобно хорошей Obsidian visual editing experience.

Raw Markdown можно оставить power option.

---

# 29. Visual editor должен действительно быть visual
Если в тексте:

- checkbox;
- list;
- bold;
- heading;
- link;
пользователь должен видеть их именно такими сразу.

Не показывать сырые Markdown markers в default visual mode.

---

# 30. Editing toolbar
Toolbar видима сразу.

Не спрятана до дополнительного действия.

Она должна быть:

- компактной;
- touch-friendly;
- contextual.
На mobile можно использовать toolbar над keyboard.

---

# 31. Отмена / Готово
Editor обязательно имеет:

**Отмена**

и:

**Готово**

`Отмена` возвращает content к состоянию до editing session.

Если storage autosaves continuously, хранить temporary draft snapshot для session rollback.

Backdrop/system Back behaviour тоже должно быть логичным.

---

# 32. Task Checkbox — отдельное свойство checkbox
Очень важная модель.

Есть:

### обычный checkbox
и:

### task checkbox
Task checkbox является обычным checkbox + специальным metadata/marker.

Не каждый checkbox становится Task.

---

# 33. Markdown representation Tasks
Сделать совместимое текстовое representation по принципу Obsidian Tasks plugin.

Например концептуально:

`- [ ] #task Купить билеты`

или другой чистый marker.

Выбери representation, которое:

- portable;
- читаемо;
- легко parse;
- не ломает обычный Markdown.
Пользователь в visual mode не обязан видеть syntax marker.

---

# 34. Быстрая вставка Task Checkbox
В editor toolbar должны существовать отдельно:

- Checkbox;
- Task.
Пользователь может вставить task одним tap.

Не нужно:

создать checkbox
→ открыть свойства
→ сделать task.

---

# 35. Task имеет визуальный marker
В visual editor task checkbox слегка отличается от обычного.

Использовать:

- маленькую monochrome icon;
- subtle marker;
- typography/affordance.
Не перегружать.

---

# 36. Удалить Atom Type «Task»
Task больше не является Atom type.

Kanban собирает task checkboxes из любых Atom.

Например Atom `Posphorea` содержит:

- обычный текст;
- обычные checkbox;
- 4 Task checkbox.
Только эти 4 появляются в Kanban.

---

# 37. Kanban переделать
Текущий Kanban UX считать незавершённым.

Нужно серьёзно улучшить:

- вход;
- внешний appearance;
- внутреннюю hierarchy;
- task creation;
- grouping;
- mobile behaviour.

---

# 38. Kanban не popup из трёх точек
Переход:

**Поле ↔ Канбан**

должен быть одним из основных natural navigation actions.

Сделать красивый compact control.

Например floating pill около нижнего края:

`Поле  |  Канбан`

или icon morph.

Не засовывать Kanban глубоко в overflow menu.

---

# 39. Field ↔ Kanban transition
Переход должен ощущаться spatially coherent.

Можно использовать:

- morph;
- cards collecting from graph;
- smooth view transformation.
Но быстро.

Не cinematic.

---

# 40. Kanban lanes
Основные:

- Сейчас
- Поле
- Архив
Это состояния source Atom.

Paused не делать отдельной огромной lane.

Paused groups:

- collapsed lower section;
- либо hide with filter.

---

# 41. Tasks grouped by Atom
Kanban не показывает бессмысленный поток отдельных cards.

Внутри lane:

**Source Atom**

→ его Tasks.

Например:

### Сейчас
**Posphorea**
☐ Исправить physics
☐ Переделать Kanban
☐ Темы

**Музыка**
☐ Записать вокал

Так Kanban сохраняет смысловой context.

---

# 42. Moving Kanban groups
Drag source group:

Поле → Сейчас

меняет state Atom:

normal → now.

Все его Tasks перемещаются вместе.

Task остаётся в исходной note.

---

# 43. Completed tasks
Task completion меняет checkbox в исходном Atom.

Kanban является representation content, а не отдельной базой.

Можно иметь:

`Активные | Выполненные`

но не плодить десять columns.

---

# 44. FOLDERS PLUGIN
Добавить built-in optional Plugin:

**Folders**

Core от него независим.

Это очень важная feature для больших graphs.

Но Folder в Posphorea — не filesystem folder.

Это:

**semantic spatial territory.**

---

# 45. Создание Folder через Lasso
Flow:

lasso group

→ selection появляется

→ в красивом contextual selection surface:

**Создать папку**

Tap:

- выбранные Atom становятся seed members;
- дать Folder имя;
- optional icon;
- optional subtle color;
- territory появляется на canvas.

---

# 46. Folder membership fuzzy
Не делать rigid membership системой:

Atom ∈ Folder A / нет.

Folder имеет:

- seed members;
- propagated membership.
Новые branches внутри её territory/topology естественно становятся её частью.

---

# 47. Folder propagation
Membership вычислять с учётом:

- graph distance;
- topology;
- parent/source branch;
- physical proximity;
- structural barriers;
- surrounding Folder memberships.
Это позволяет Folder естественно расширяться вместе с graph.

---

# 48. Crossing Folder territories
Если branch соединяет Folder A и Folder B:

не проводить жёсткую границу посередине одной Link.

Membership постепенно смешивается.

Например:

A side:
100% A

middle:
60% A / 40% B

B side:
100% B

Пользователь не видит проценты.

Он видит естественный spatial transition.

---

# 49. New descendants
Если пользователь создаёт новый descendant внутри strong Folder branch:

он автоматически получает membership Folder.

Не требовать:

`Добавить в папку`.

---

# 50. Folder territories
На canvas Folder визуально может отображаться:

- subtle background tint;
- faint organic region;
- soft boundary;
- region label;
- monochrome folder landmark.
Никаких жирных boxes.

Никаких прямоугольников как в diagram tool.

Территория должна быть:

**заметной, но атмосферной.**

---

# 51. Folder strip сверху
Добавить быстрый Folder navigation strip поверх canvas, аналогично идее Telegram folders.

Например:

`Все   Работа   Музыка   Люди`

Он:

- translucent;
- компактный;
- поверх основного layout;
- может сворачиваться в одну Folder icon;
- не отнимает большой permanent header.

---

# 52. Selecting Folder
Tap Folder:

не открывает отдельную page.

Camera показывает её territory.

Other territories становятся ambient.

Это буквально быстрый способ путешествовать по большой карте.

Folder navigation = shortcut through the same spatial world.

---

# 53. Background world как Google Maps
Добавить background camera behaviour.

Фон может иметь режимы:

### Static
Как сейчас.

### World Attached
Background двигается и zoom-ится вместе с canvas.

### Parallax
Несколько background layers двигаются относительно camera с разной скоростью.

---

# 54. Background parallax
Не делать тяжёлый 3D engine.

Достаточно 2–3 lightweight layers.

Например звездный фон:

### Far stars
двигаются очень слабо.

### Near stars
немного сильнее.

### Knowledge world
двигается полностью.

Получается depth.

---

# 55. Background zoom
При World/Parallax mode background scale связан с camera zoom.

Избегать pixelation и giant texture scaling.

Использовать подходящую repeat/procedural/vector/render implementation.

---

# 56. Twinkling stars
Для star themes добавить subtle animation:

- редкое мерцание;
- разные phase;
- небольшая amplitude.
Не blinking disco.

Очень спокойно.

Animation должна быть GPU-friendly и учитывать reduced-motion.

---

# 57. Background performance
Background никогда не должен ухудшать:

- pinch;
- pan;
- drag.
Не делать сотни DOM stars.

Использовать renderer-friendly implementation.

На слабом устройстве background detail можно снижать незаметно, сохраняя visual identity.

---

# 58. Themes — полностью пересмотреть контраст
Текущие темы слишком блеклые.

Сделать полноценные readable presets.

Минимум:

### Dark Contrast
глубокий фон, хорошо читаемый text/Links.

### Light Contrast
чистый светлый фон и сильная hierarchy.

### Soft Dark
мягче, но всё ещё WCAG-sensible/readable.

### Soft Light
то же.

Дополнительные themed backgrounds допустимы.

---

# 59. Никакого forced low contrast
Premium ≠ faded.

Primary text должен быть очевидно читаемым.

Links должны читаться.

Selected/attention state очевиден.

Secondary content можно приглушать.

---

# 60. Folder/Type icons + Themes
Monochrome icons должны автоматически адаптироваться под:

- light/dark;
- selected;
- state;
- contrast.
Не хранить отдельные цветные PNG для каждого theme.

---

# 61. AI / Intelligence — пока в ROADMAP
AI интеграцию сейчас **не ставить выше fundamentals**.

Я пока не хочу платить за provider usage и graph ещё маленький.

Но architecture/roadmap подготовить.

Не делать полноценный AI plugin сейчас, если для этого придётся отвлекаться от physics/UI.

---

# 62. Future AI Providers
Запланировать provider abstraction:

- OpenRouter;
- OpenAI / ChatGPT-compatible API;
- other OpenAI-compatible endpoints;
- future local model.
API keys user-controlled.

---

# 63. AI не просто чат
Будущая AI функция должна работать с самим graph.

Например:

### Suggested Links
AI предлагает ghost Link.

Accept / Reject.

### Suggested Folder
«Эти 12 Atom образуют тему X».

### Suggested Type/Icon

### Duplicate detection

### Hub suggestion

### Merge

### Bridge Atom

---

# 64. Bridge Atom
Очень важная future concept.

Если:

A и B логически связаны некоторой промежуточной концепцией,

AI может предложить:

A
↘
C
↗
B

где C — автоматически подготовленная новая note, объясняющая связь.

Показать preview.

Только после Accept создавать.

Spatially расположить C между/рядом с A/B.

---

# 65. AI organization for huge graphs
В будущем AI помогает поддерживать 1000+ Atom:

- categorization;
- Folder suggestions;
- orphan detection;
- cluster naming;
- hub discovery;
- link suggestions;
- icon suggestions;
- sizes;
- semantic color families;
- merge suggestions.
Цель:

**база сама помогает оставаться красивой и понятной.**

Но пользователь остаётся финальным authority.

---

# 66. AI никогда не должен молча переделывать graph
Любая destructive/structural suggestion:

- preview;
- accept;
- reject.
Особенно:

- merge;
- new Links;
- delete;
- Folder movement;
- generated bridge Atom.

---

# 67. Plugin-first
Внешние/specialized features по-прежнему Plugins.

В частности:

- Folders;
- Tasks/Kanban;
- Templates;
- Daily Notes;
- Obsidian;
- AI;
- alternative layouts/physics.
Не обязательно каждый tiny behaviour превращать в plugin.

Core остаётся маленьким.

---

# 68. Existing plugins
Не создавай новый Folders/Tasks subsystem, пока не проверишь существующий Plugin API.

Built-in plugins должны максимально использовать public plugin system.

Если API чего-то не позволяет, улучшить API, а не hardcode special privileged path без необходимости.

---

# 69. Mobile-first
Все новые interactions обязательно тестировать touch-first.

Особенно:

- drag propagation;
- link-on-drop;
- chain target;
- lasso → Folder;
- Folder navigation;
- editor toolbar;
- Task checkbox;
- Kanban;
- parallax background.
Не полагаться на hover.

---

# 70. Performance
Все новые visual features должны проходить:

- 100 Atom;
- 500 Atom;
- 1000 Atom.
Особенно Living Graph.

Не допустить возвращения:

- full projection rebuild per drag;
- per-pointer heavy calculations;
- camera-triggered layout;
- giant label measurement;
- excessive GC.

---

# 71. Renderer
Если текущий renderer уже мигрирован/мигрирует на PixiJS или другой GPU backend:

сначала изучи фактическое состояние.

Не начинай вторую renderer migration.

Доведи существующую.

Interaction model должна быть renderer-independent.

---

# 72. Animation language
Все animations:

- короткие;
- elastic;
- interruptible;
- meaningful.
Одна consistent physics language.

Особенно:

- layout switching;
- link connection;
- Folder navigation;
- Field ↔ Kanban;
- editor opening;
- Undo.

---

# 73. Undo system
Сделать единый transient Undo manager.

Undo:

- кратковременный;
- dismissable;
- не flicker;
- не связан с canvas redraw;
- queue/coalescing разумные.
Не создавать отдельную постоянную кнопку `Отменить` после каждого action.

---

# 74. Roadmap order
Работай примерно в таком порядке:

## Phase 1 — Understand current product
repository + roadmap + implemented state.

## Phase 2 — Rename
Phosphora → Posphorea.

## Phase 3 — Living Graph
propagation, branch geometry, weights, link stability.

## Phase 4 — Layout continuity
provider switching from current positions.

## Phase 5 — Link UX
visibility + drag-on-target + connection affordance.

## Phase 6 — UX cleanup
menus, duplicated actions, Type, Pause, Undo.

## Phase 7 — Editor
visual mode default, toolbar, Cancel, visual Markdown.

## Phase 8 — Tasks/Kanban
task checkbox metadata + redesigned Kanban.

## Phase 9 — Themes/icons/background
contrast + monochrome icons + world/parallax backgrounds.

## Phase 10 — Folders plugin
fuzzy territories + navigation strip.

## Phase 11 — polish/performance
mobile + 100/500/1000.

## Future roadmap
AI Intelligence plugin.

Если actual repository state показывает, что некоторые phases уже существенно реализованы, не повторяй их. Проверь качество и переходи дальше.

---

# 75. Autonomous improvement
После каждого phase:

1. реально открой app;
2. проверь mobile-like interaction;
3. найди самое заметное слабое место;
4. исправь;
5. tests;
6. build;
7. commit stable milestone;
8. push GitHub;
9. периодически обновляй GitHub Pages;
10. продолжай.
Не спрашивай меня после каждого этапа:

`продолжать?`

Если следующий шаг очевиден, продолжай самостоятельно.

---

# 76. Git discipline
Один commit = meaningful stable milestone.

Не commit каждую мелочь.

Но и не держи огромную рабочую ветку незакоммиченной долго.

Перед push:

- remove debug instrumentation;
- tests;
- typecheck;
- build;
- relevant e2e.
После важных UI milestones проверить deployed GitHub Pages.

---

# 77. Не зацикливаться на одном benchmark
Measurement-first.

Но product-first.

Если microbenchmark после нескольких нормальных попыток остаётся странным, а реальный UX уже smooth:

- зафиксировать;
- оставить regression coverage;
- перейти дальше.
Не тратить весь model budget на одну цифру.

---

# 78. Главный UX acceptance test
Новый пользователь должен понять почти всё без tutorial.

Он должен интуитивно догадаться:

- canvas двигается;
- pinch zoom;
- Atom можно двигать;
- Atom можно открыть;
- long press даёт actions;
- lasso выделяет;
- один Atom можно бросить на другой и связать;
- Task можно вставить из editor;
- Kanban доступен рядом с Полем;
- Folder создаётся из group.
Если frequent action требует изучения документации, UX нужно улучшить.

---

# 79. Главное правило UI
Для каждой frequent operation спроси:

### Можно ли убрать click?

### Можно ли убрать menu?

### Можно ли сделать действие непосредственно над объектом?

### Можно ли убрать duplicate?

### Можно ли выбрать хороший default?

### Можно ли показать affordance только тогда, когда он нужен?
Смысл инновации:

**меньше интерфейса при большей мощности.**

---

# 80. Definition of Done текущей большой итерации
Не считать работу законченной, пока:

### Graph

- connected structure снова ощущается живой;
- neighbours реагируют на drag;
- branches сохраняют форму;
- structural weight влияет на движение;
- Pins работают как единственные hard anchors;
- large-zoom drag не путает Links;
- new Atom заставляют local structure адаптироваться.

### Layout

- switch provider не телепортирует Atom;
- новый provider стартует с current geometry;
- mental map сохраняется;
- transitions выглядят естественно.

### Links

- local Links предсказуемо видны;
- broken lens logic удалена;
- drag Atom onto Atom предлагает Link;
- chain icon/preview понятны;
- release создаёт Link;
- dragged Atom возвращается к композиции;
- duplicate Links предотвращаются;
- unlink/reconnect простые.

### UI

- нет очевидного дублирования;
- Type не спрятан;
- Pause не захламляет interface;
- Type Task удалён;
- Undo не висит бесконечно;
- Undo не flicker при camera movement;
- frequent actions имеют короткий путь.

### Editor

- visual mode default;
- formatting видно визуально;
- Task checkbox отдельно от ordinary checkbox;
- Task insertion один tap;
- toolbar сразу доступна;
- Cancel есть;
- Done есть.

### Kanban

- доступен прямо рядом с Полем;
- выглядит как полноценный красивый view;
- lanes = Сейчас / Поле / Архив;
- Tasks сгруппированы по source Atom;
- данные остаются в Atom;
- task completion синхронно меняет content.

### Themes

- существуют реально контрастные Light/Dark themes;
- soft themes тоже читаемы.

### Icons

- единая monochrome system;
- types легко различимы.

### Background

- static/world/parallax possibilities;
- zoom/pan background coherent;
- optional subtle star twinkling;
- performance mobile-safe.

### Folders

- это Plugin;
- создаётся из lasso;
- имеет fuzzy membership;
- descendants могут входить автоматически;
- overlapping regions распределяются естественно;
- territory visible subtly;
- Folder strip позволяет быстро путешествовать по graph;
- canvas остаётся одним пространством.

### AI

- присутствует в обновлённом roadmap;
- provider architecture предусмотрена;
- полноценная платная AI functionality сейчас не является blocker.

---

# 81. Финальная философия Posphorea
**The graph is alive.**

**The user shapes it, but does not have to manually maintain it.**

**Dragging teaches the structure instead of freezing it.**

**Changing layout changes the laws of the same world, not the world itself.**

**Links are physical relationships.**

**Folders are territories, not boxes.**

**Tasks live inside knowledge, not in a second database.**

**Kanban is another view of the same knowledge.**

**The background is part of the spatial world.**

**AI will cultivate the graph, not replace the user.**

**Frequent actions happen directly under the fingers.**

**Complexity belongs inside the system, not inside the user's workflow.**

Конечная цель:

# **даже при тысячах Atom Posphorea должна оставаться красивым, понятным и живым пространством.**
Пользователь не обслуживает базу данных.

Он гуляет по собственному пространству знаний, двигает его, связывает идеи, создаёт территории, пишет и выполняет задачи.

А Posphorea сама помогает сохранять структуру, красоту, понятность и движение.