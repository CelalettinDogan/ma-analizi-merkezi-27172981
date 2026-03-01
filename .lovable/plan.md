

# Secret Ekleme Planı

## Durum
Mevcut secret'lar arasında `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` ve `GOOGLE_PLAY_PACKAGE_NAME` bulunmuyor. Bu iki secret'ın eklenmesi gerekiyor.

## Eklenecek Secret'lar

1. **GOOGLE_PLAY_SERVICE_ACCOUNT_KEY** — Paylaştığın service account JSON'unun tamamı (tek satır string)
2. **GOOGLE_PLAY_PACKAGE_NAME** — `app.golmetrik.android`

## Yöntem
Implementation moduna geçtiğimde `add_secret` aracını kullanarak senden bu değerleri güvenli şekilde isteyeceğim. Secret'lar backend'e güvenli olarak kaydedilecek ve Edge Function'lar (`verify-purchase`, `play-store-webhook`) tarafından kullanılabilir olacak.

## Not
Chat'te paylaştığın private key'i doğrudan secret olarak kaydedeceğim — tekrar girmen gerekmeyecek, araç üzerinden onaylamanı isteyeceğim.

