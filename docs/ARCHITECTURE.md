# Phosphora

Единая локальная карта. `Atom` и `Link` — независимые сущности. Состояние внимания не меняет связи. Интерфейс на Svelte, доменная модель и публичный API не импортируют Svelte.

## Слои

- `src/core`: модель, валидация, операции и события после успешного commit.
- `src/storage`: StorageAdapter → RPC → SQLite WASM Worker → официальный OPFS SAH pool VFS.
- `src/graph`: проекция данных, сокращение связей, семантический масштаб и взаимодействия.
- `src/plugins`: runtime и встроенные расширения через публичный API.
- Svelte: представление и локальное состояние редактора.

## Сохранность

База `/phosphored.sqlite3` находится в постоянном OPFS-каталоге `.phosphored`. Имена не зависят от хеша сборки или версии приложения. Service Worker обновляет только application shell и никогда не очищает OPFS.

SQLite работает в Worker. Изменение атома вместе с контекстной связью выполняется одной транзакцией. Событие и обновление интерфейса происходят после commit. Версия атома защищает от перезаписи устаревшей формы. Миграции используют `user_version`, транзакции и проверку ссылочной целостности. Более новая неизвестная схема блокирует запуск. Ошибка открытия или миграции никогда не приводит к удалению базы или подмене пустой базой.

SAH pool выбран за отсутствие требования COOP/COEP и SharedArrayBuffer. Web Lock удерживается на срок жизни подключения: вторая вкладка показывает понятную ошибку вместо конкурирующей записи. Это осознанное ограничение MVP. Закрытие вкладки освобождает блокировку средствами браузера.

Persistent storage запрашивается и результат проверяется. Это защищает от автоматического вытеснения там, где браузер предоставляет разрешение; ручная очистка данных сайта и потеря устройства всё равно требуют внешней резервной копии.

## Границы MVP

Один пользователь, одно локальное хранилище, без регистрации, сетевых запросов с содержимым карты, синхронизации и аналитики. Sync и E2EE относятся к будущему отдельному слою: стабильные UUID и timestamps не привязаны к серверу. Нативная оболочка сможет заменить StorageAdapter.

## Источники технических решений

- SQLite: https://www.sqlite.org/wasm/doc/trunk/persistence.md
- Vite Workers: https://vite.dev/guide/features.html#web-workers

Поддержка реальных Android/iOS устройств требует проверки на физических устройствах; эмуляция viewport не заменяет такую проверку.

## Map rendering

The map keeps projection, camera, hit testing and gestures independent of its renderer. `gpu-renderer.ts` loads PixiJS lazily and retains WebGL sprites: atom text and decoration are rasterised only when their appearance or zoom scale changes, while position and opacity update on the GPU. Curves share graphics batches. Unchanged scenes do not submit another GPU frame. Textures leaving the viewport and resources belonging to an unmounted map are released.

The existing Canvas surface handles input and gesture feedback above the GPU layer. Unsupported or software-only WebGL uses the complete Canvas renderer; context loss switches to it and context restoration rebuilds GPU resources. Software rendering uses a fixed quality level for large maps, independent of pointer presses. No input gesture resizes the rendering buffer or redistributes the field's decoration budget. Plugin providers continue returning ordinary GraphModel data and never receive GPU objects.

## Direct relationships

`RelationshipLayer.svelte` overlays touch-sized handles and a transient curve above either renderer. Canvas retains pan/pinch and only selects a link on an unmodified tap; `relationships.ts` uses screen-space curve hit testing. Grouped projections do not expose aggregate links as editable stored records. The graph controller includes endpoint IDs in projection/topology signatures so reconnection preserves the relationship ID while updating both retained projections and rest lengths.

`Core.changeLink(before, after)` snapshots scalar inputs before queueing, checks the prior record, rejects duplicate relationships and atomically replaces/removes/inserts the record with rejection metadata. The transient one-step undo uses the same conflict-checked operation. UI state is not persisted as graph data.
