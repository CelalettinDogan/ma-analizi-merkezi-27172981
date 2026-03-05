

# Test Kullanıcısı Oluşturma

Auth loglarına göre `test@demo.com` adresiyle zaten bir kayıt yapılmış (user_id: `95e406d2-9763-4db2-b535-6860a83e303a`) ancak e-posta onaylanmamış. Bu yüzden giriş yapılamıyor.

## Yapılacaklar

1. **Geçici edge function oluştur** (`supabase/functions/create-test-user/index.ts`):
   - Supabase Admin API ile mevcut kullanıcının e-postasını onayla (`email_confirm: true`)
   - Şifreyi `Test12345` olarak ayarla
   - `supabase.auth.admin.updateUser()` kullanılacak

2. **Deploy et ve çağır**:
   - Edge function'ı deploy edip `curl_edge_functions` ile çalıştır
   - Kullanıcı onaylandıktan sonra edge function'ı sil (tek seferlik işlem)

3. **Sonuç**: `test@demo.com` / `Test12345` ile giriş yapılabilir hale gelecek

## Değişecek Dosyalar
- `supabase/functions/create-test-user/index.ts` (oluştur → çalıştır → sil)

