# Өгөгдлийн сангийн схем (ERD)

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "id"
    PROFILES ||--o{ EXHIBITS : "creator_id"
    EXHIBITION_CATEGORIES |o--o{ EXHIBITS : "category_id"
    EVENTS ||--o{ EVENT_PHOTOS : "event_id"

    AUTH_USERS {
        uuid id PK
        text email
    }
    PROFILES {
        uuid id PK,FK
        text display_name
        text avatar_url
        text bio
        text role "creator | admin"
        timestamptz created_at
    }
    EXHIBITS {
        uuid id PK
        bigint catalog_no "каталогийн дугаар"
        text title
        text description
        text image_url
        uuid category_id FK
        text_array technology_stack
        int year_created
        uuid creator_id FK
        text demo_url
        text github_url
        text status "pending | published | rejected"
        timestamptz created_at
        timestamptz updated_at
    }
    EXHIBITION_CATEGORIES {
        uuid id PK
        text name UK
        text description
    }
    TEACHERS {
        uuid id PK
        text name
        text position
        text_array courses
        text bio
        text photo_url
    }
    EVENTS {
        uuid id PK
        text title
        date event_date
        text description
        text cover_image_url
    }
    EVENT_PHOTOS {
        uuid id PK
        uuid event_id FK
        text image_url
        text caption
    }
    HISTORY_MILESTONES {
        uuid id PK
        int year
        text title
        text description
    }
```

## Холбоосын тайлбар

| Foreign key | Холбоо | Зориулалт | Устгах үед |
| --- | --- | --- | --- |
| `profiles.id` → `auth.users.id` | 1:1 | Нэвтрэлтийн бүртгэлийг нийтийн профайлтай холбоно. Нэг багана PK ба FK хоёулаа. | Профайл устана |
| `exhibits.creator_id` → `profiles.id` | 1:N | Нэг бүтээгч олон бүтээлтэй. RLS эзэмшлийг энэ баганаар шалгана. | Бүтээл устана |
| `exhibits.category_id` → `exhibition_categories.id` | N:1 | Ангиллаар шүүх. Заавал биш. | `NULL` болно, бүтээл үлдэнэ |
| `event_photos.event_id` → `events.id` | 1:N | Арга хэмжээний зурагт цомог. | Зураг устана |

**Primary key:** хүснэгт бүрийн `id` нь мөрийг давтагдашгүй тодорхойлно. Дарааллын тоо бус UUID ашигласнаар бичлэгийн тоог таахаас хамгаална.

## Жишиг бүтцээс өөрчилсөн зүйл

- `exhibits.category` → `category_id` FK болгов: ангиллын нэр солигдоход бүх бүтээлийг шинэчлэх шаардлагагүй.
- `profiles.role`, `profiles.bio`: админ эрх болон ISM Creators-ийн танилцуулгад нэмэв.
- `exhibits.catalog_no`: музейн каталогийн дугаар (`ISM.2024.007`) харуулна.
- `history_milestones`: тэнхимийн түүх, Time Machine-д зориулж нэмэв.

## RLS товч

| Хүснэгт | Унших | Бичих |
| --- | --- | --- |
| `profiles` | Бүгд | Зөвхөн өөрийн `display_name`, `avatar_url`, `bio` |
| `exhibits` | `published` бол бүгд; бусдыг нь эзэмшигч, админ | Эзэмшигч эсвэл админ |
| `teachers`, `events`, `event_photos`, `history_milestones`, `exhibition_categories` | Бүгд | Зөвхөн админ |
| `storage.objects` (`media`) | Бүгд | Өөрийн `<user id>/` хавтас; устгах, солихыг админ бас хийнэ |
