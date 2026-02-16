
# Auth Sayfasi Hata Duzeltmeleri

## Tespit Edilen Sorunlar

### 1. Basarili kayitta loading spinner sonsuza kadar donuyor
`handleRegister` fonksiyonunda `setIsLoading(false)` sadece hata durumunda cagiriliyor (satir 87). Basarili kayit sonrasi kullanici e-posta dogrulama beklerken buton surekli "Kayit yapiliyor..." olarak kaliyor.

### 2. Var olan e-posta ile kayit olununca yanlis davranis
Supabase, e-posta numaralandirmayi onlemek icin var olan bir e-postayla `signUp` yapildiginda hata dondurmez. Bunun yerine `user.identities` dizisi bos doner. Bu kontrol edilmedigi icin kullanici yanlis yonlendiriliyor.

### 3. Rate limit hatasi kullanici dostu degil
"email rate limit exceeded" hatasi ham Ingilizce olarak gosteriliyor. Turkce ve anlasilir bir mesaja donusturulmeli.

## Yapilacak Degisiklikler

### Dosya: `src/pages/Auth.tsx`

#### handleRegister fonksiyonu yeniden yazilacak:

1. `signUp` cagrisindan donen `data` objesi kontrol edilecek
2. Eger `data.user?.identities` bos diziyse, "Bu e-posta zaten kayitli" hatasi gosterilecek
3. Basarili kayit sonrasi `setIsLoading(false)` cagrilacak ve "E-posta dogrulama baglantisi gonderildi" mesaji gosterilecek
4. Form alanlari temizlenecek

#### handleLogin fonksiyonunda rate limit kontrolu:

1. Hata mesajinda "rate limit" veya "429" varsa Turkce mesaj gosterilecek

#### AuthContext signUp donusu:

`signUp` fonksiyonu sadece `{ error }` donduruyor, `data` donmesi gerekiyor.

### Dosya: `src/contexts/AuthContext.tsx`

`signUp` fonksiyonunun donus tipi `{ error, data }` olarak guncellenecek:

```text
Onceki:  return { error: error as Error | null };
Sonraki: return { error: error as Error | null, data };
```

Interface'e de `data` eklenmeli.

### Auth.tsx'teki handleRegister degisiklikleri:

```text
const { error, data } = await signUp(registerEmail, registerPassword, registerName);

if (error) {
  // Rate limit kontrolu
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    mesaj = 'Cok fazla deneme yaptiniz. Lutfen birka dakika bekleyin.';
  }
  toast({ ... });
  setIsLoading(false);
  return;
}

// Var olan e-posta kontrolu
if (data?.user?.identities?.length === 0) {
  toast({ title: 'Bu e-posta zaten kayitli', description: 'Giris Yap sekmesinden giris yapin.' });
  setIsLoading(false);
  return;
}

// Basarili kayit
toast({ title: 'Kayit Basarili', description: 'E-posta adresinize dogrulama baglantisi gonderildi.' });
setIsLoading(false);
```

### handleLogin'deki rate limit kontrolu:

```text
if (error.message.includes('rate limit') || error.message.includes('429')) {
  mesaj = 'Cok fazla giris denemesi. Lutfen birka dakika bekleyin.';
}
```

## Ozet

- 2 dosya degisecek: `AuthContext.tsx` ve `Auth.tsx`
- signUp donus tipi genisletilecek (data eklenmesi)
- Var olan e-posta kontrolu eklenecek
- Rate limit hatalari Turkce mesajla gosterilecek
- Basarili kayit sonrasi loading durdurup bilgi mesaji gosterilecek
