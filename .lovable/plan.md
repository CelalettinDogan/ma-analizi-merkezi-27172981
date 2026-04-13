

## Plan: onracr2001@gmail.com Hesabına 1 Aylık Premium Basic Atama

### Yapılacak
`premium_subscriptions` tablosuna yeni kayıt ekle:
- **user_id**: `39fc4d67-30ea-4f3a-84dd-dabd84408c9e`
- **plan_type**: `premium_basic`
- **starts_at**: `now()`
- **expires_at**: `now() + 30 gün`
- **is_active**: `true`
- **platform**: `admin`

Tek bir SQL INSERT işlemi. Kod değişikliği yok.

