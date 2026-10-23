import type { TranslationKeys } from "./types";
import { en } from "./en";

export const ru: TranslationKeys = {
    ...en,

    "plugin.ribbon": "Music Rating",
    "plugin.openCommand": "Открыть Music Rating",

    "view.title": "Music Rating",
    "view.empty.noTracks": "Нет треков",
    "view.empty.allRated": "Все треки оценены",
    "view.empty.showAll": "Показать все",
    "view.empty.noPlayable": "Нет треков для воспроизведения",

    "sidebar.shuffle": "Перемешать",
    "sidebar.mode.filter": "Только без оценки",
    "sidebar.mode.list": "Все треки",
    "sidebar.auto.on": "Автовоспроизведение: включено",
    "sidebar.auto.off": "Автовоспроизведение: выключено",

    "rating.clear": "Удалить оценку",
    "rating.cleared": "Оценка удалена",
    "rating.saved": "Оценка {value} сохранена",

    "youtube.open": "YouTube",
    "youtube.add": "＋ Добавить YouTube",
    "youtube.placeholder": "https://music.youtube.com/watch?v=...",
    "youtube.save": "Сохранить",
    "youtube.cancel": "Отмена",
    "youtube.empty": "Ссылка пустая",
    "youtube.saved": "Ссылка сохранена",

    "notice.noPlayable": "Нет треков для воспроизведения",
    "notice.ratingSaved": "Оценка {value} сохранена",
    "notice.ratingCleared": "Оценка удалена",
    "notice.youtubeSaved": "Ссылка сохранена",
    "notice.youtubeEmpty": "Ссылка пустая",

    "settings.language.name": "Язык",
    "settings.language.desc": "Язык интерфейса плагина.",
    "settings.language.auto": "Автоматически (как в Obsidian)",
    "settings.musicFolder.name": "Папка коллекции",
    "settings.musicFolder.desc": "Корневая папка коллекции. Плагин создаёт внутри подпапки Artists/ и Tracks/.",
    "settings.audioFolder.name": "Папка с аудиофайлами",
    "settings.audioFolder.desc": "Папка с аудиофайлами. Используется для автоподстановки ссылки на файл по шаблону «Исполнитель - Название».",
    "settings.artistsIndexName.name": "Заметка-индекс исполнителей",
    "settings.artistsIndexName.desc": "Заметка в корне коллекции со списком всех исполнителей. Создаётся автоматически. Оставьте пустым для «Artists».",
    "settings.showNotice.name": "Показывать уведомление при оценке",
    "settings.advanceOnRate.name": "Переключать трек после оценки",
    "settings.advanceOnRate.desc": "Автоматически переходить к следующему треку после выставления оценки.",

    "common.artist.unknown": "Unknown",
    "common.empty": "—",

    "tab.rating": "Оценка",
    "tab.queue": "Очередь",

    "track.edit": "Редактировать трек",
    "track.add": "Добавить трек",
    "track.delete": "Удалить трек",
    "track.deleteConfirmTitle": "Удалить трек?",
    "track.deleteConfirmMessage": "Удалить «{title}» ({artist})? Если это последний трек исполнителя, исполнитель тоже будет удалён.",
    "track.playPause": "Плей / пауза",
    "track.editTitle": "Редактировать трек",
    "track.createTitle": "Новый трек",
    "track.field.artist": "Исполнитель",
    "track.field.title": "Название",
    "track.field.localFile": "Название файла музыки",
    "track.field.youtube": "Ссылка на YouTube",
    "track.field.required": "обязательно",
    "track.sync": "Найти подходящий аудиофайл",
    "track.sync.noMatch": "Подходящий аудиофайл не найден",
    "track.sync.found": "Найдено: {name}",

    "notice.trackUpdated": "Трек обновлён",
    "notice.trackCreated": "Трек создан",
    "notice.trackExists": "Такой трек уже существует",
    "notice.requiredFields": "Заполните обязательные поля",

    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.create": "Создать",
    "common.delete": "Удалить",
};