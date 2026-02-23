

# Chatbot Otomatik Scroll Duzeltmesi

## Sorunlar

1. **Gecmis yuklendiginde scroll en alta gitmiyor**: Kullanici sohbet ekranina girdiginde en ustteki mesajlari goruyor, en alttaki (son) mesajlari gormesi gerekirken.

2. **Asistan yanit verdiginde scroll takip etmiyor**: Asistanin loading mesaji gercek icerikle degistirildiginde `messages.length` degismiyor. Bu yuzden satir 284-293'teki smooth scroll tetiklenmiyor. ResizeObserver yakalasa bile `isNearBottom` kontrolu basarisiz olabiliyor.

## Cozum

### Dosya: `src/components/chat/ChatContainer.tsx`

**Degisiklik 1 - ResizeObserver isNearBottom esigini artir (satir 255)**

`isNearBottom` icin esik degerini 150'den 300'e cikar. Boylece icerik buyudugunde (ornegin markdown renderlandiginda) scroll takibi daha guvenilir olur.

**Degisiklik 2 - Mesaj icerik degisikligini takip et (satir 283-293)**

Mevcut `messages.length` bazli scroll yerine, son mesajin `content` ve `isLoading` durumunu da izle. Boylece asistan yaniti geldiginde (loading -> icerik) smooth scroll tetiklenir.

Yeni yaklaşim:
- Son mesajin `content` uzunlugunu ve `isLoading` durumunu bir ref'te tut
- Her render'da bunlari karsilastir
- Degisiklik varsa ve kullanici scroll'u yukari cekmemisse, otomatik olarak alta kaydir

**Degisiklik 3 - Gecmis yuklendiginde kesin scroll (satir 240-281)**

`isLoadingHistory` false oldugunda ve mesajlar varken, `queueMicrotask` veya `requestAnimationFrame` ile scroll'u DOM renderindan sonra garanti et.

## Teknik Detay

```text
// Son mesajin durumunu izle
const lastMsg = messages[messages.length - 1];
const lastContentRef = useRef('');

useEffect(() => {
  if (!lastMsg) return;
  const contentChanged = lastMsg.content !== lastContentRef.current;
  const loadingFinished = !lastMsg.isLoading;
  
  if (contentChanged && loadingFinished) {
    scrollToLastMessage('smooth');
  }
  
  lastContentRef.current = lastMsg.content;
}, [lastMsg?.content, lastMsg?.isLoading]);
```

## Degisecek Dosya

| Dosya | Degisiklik |
|-------|-----------|
| `src/components/chat/ChatContainer.tsx` | Scroll mantigi iyilestirilecek: icerik degisikligi izleme, gecmis yukleme sonrasi scroll garantisi, isNearBottom esigi artirimi |

