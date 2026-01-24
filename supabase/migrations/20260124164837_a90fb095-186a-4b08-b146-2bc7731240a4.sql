-- app_role enum'una 'vip' değeri ekle
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vip';

-- has_role fonksiyonunun vip için de çalıştığından emin ol (zaten var, sadece kontrol)
-- Fonksiyon zaten tüm roller için çalışıyor