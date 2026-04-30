
## Push Notification + Streak Odulleri Plani

Retention'i artirmak icin iki ana sistem: FCM push bildirimleri ve streak bazli oduller.

---

### Bolum 1: FCM Push Notification Altyapisi

#### 1.1 Capacitor Push Plugin Kurulumu
- `@capacitor/push-notifications` paketini ekle
- `usePushNotifications.ts` hook'u olustur:
  - Uygulama acildiginda izin iste
  - FCM token'i al ve `push_tokens` tablosuna kaydet
  - Foreground bildirim dinleyicisi (toast goster)
  - Deep link yonlendirmesi (bildirime tiklaninca ilgili sayfaya git)

#### 1.2 Bildirim Gonderme Edge Function
- `supabase/functions/send-push-notification/index.ts` olustur
- FCM HTTP v1 API kullanarak bildirim gonder
- Hedef kitle filtreleme: `all`, `premium`, `free`
- `push_tokens` tablosundan tokenleri cek, batch halinde gonder
- Admin paneldeki mevcut `NotificationManagement` bilesenini bu edge function'a bagla

#### 1.3 Otomatik Bildirimler (Cron Tabanli)
- `supabase/functions/scheduled-notifications/index.ts` olustur
- Gunluk sabah 09:00'da "Bugunun maclari hazir!" bildirimi
- Streak kirilma riski olan kullanicilara hatirlatma
- `pg_cron` ile zamanlanmis cagri

#### 1.4 Gerekli Secret
- `FCM_SERVER_KEY` veya Firebase Service Account JSON -- kullanicidan istenir

---

### Bolum 2: Streak Odulleri Sistemi

#### 2.1 Veritabani
- `streak_rewards` tablosu: kullanicinin hangi odulu aldigini takip
  - `user_id`, `reward_type`, `streak_day`, `granted_at`, `used`
- `grant_streak_reward()` RPC: streak milestone'a ulastiginda otomatik odul ver

#### 2.2 Odul Tanimlari
| Streak Gunu | Odul | Aciklama |
|-------------|------|----------|
| 3 gun | +1 Analiz | Gunluk limitin uzerine 1 bonus analiz |
| 5 gun | +1 AI Chat | Free kullanicilar icin 1 chatbot hakki |
| 7 gun | +2 AI Chat | 2 bonus chatbot hakki |
| 14 gun | +3 AI Chat + Badge | Ozel profil rozeti |
| 30 gun | 1 gun Premium deneme | 24 saatlik tam erisim |

#### 2.3 Frontend
- `useStreakRewards.ts` hook'u: mevcut odulleri ve kullanilabilir haklari getir
- Milestone kutlama ekrani guncelle: odulu goster ve animate et
- Bonus haklari `useAnalysisLimit` ve `useChatbot` hook'larina entegre et
- Profil sayfasinda kazanilan odulleri listele

#### 2.4 Backend Entegrasyon
- `get_daily_analysis_usage` ve `increment_chatbot_usage` RPC'lerini guncelle:
  - Bonus haklari hesaba kat (`streak_rewards` tablosundan unused bonus'lari say)
- Kullanici analiz/chat yaptiginda once bonus hakki dusurmesini kontrol et

---

### Dosya Degisiklikleri

**Yeni dosyalar:**
- `src/hooks/usePushNotifications.ts`
- `src/hooks/useStreakRewards.ts`
- `supabase/functions/send-push-notification/index.ts`
- `supabase/functions/scheduled-notifications/index.ts`
- `src/i18n/locales/*/rewards.json` (5 dil)

**Guncellenecek dosyalar:**
- `src/hooks/useStreak.ts` -- odul tetiklemesi ekle
- `src/hooks/useAnalysisLimit.ts` -- bonus analiz haklari
- `src/hooks/useChatbot.ts` -- bonus chat haklari
- `src/components/streak/StreakBadge.tsx` -- odul gosterimi
- `src/components/admin/NotificationManagement.tsx` -- edge function baglantisi
- `src/pages/Profile.tsx` -- odul listesi
- `src/App.tsx` -- push notification hook baglantisi
- `package.json` -- @capacitor/push-notifications

**Migration:**
- `streak_rewards` tablosu + RLS
- `grant_streak_reward()` RPC
- Bonus hesaplama fonksiyonlari

---

### Oncelik Sirasi
1. Push notification altyapisi (retention icin en kritik)
2. Streak odulleri (kullaniciyi geri donmeye motive eder)
3. Otomatik bildirimler (cron)

### Kullanicidan Gerekli
- Firebase projesinden **FCM Server Key** veya **Service Account JSON**
- Android Studio'da `google-services.json` dosyasinin projeye eklenmesi
- `npx cap sync` calistirilmasi
