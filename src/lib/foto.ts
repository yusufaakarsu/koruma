/**
 * Yüklenen ilan fotoğrafları için standart boyut:
 *   - 3:4 aspect (dikey, ilan kartlarıyla aynı)
 *   - 1080×1440 px
 *   - JPEG kalite 0.85
 *
 * `fotoKirp` — kullanıcının seçtiği crop alanını piksel koordinatlarıyla alır,
 * canvas'la kırpıp standart boyuta indirir.
 */

export const FOTO_ORANI = 3 / 4; // genişlik / yükseklik
const HEDEF_GENISLIK = 1080;
const HEDEF_YUKSEKLIK = 1440;

/** react-easy-crop'tan gelen croppedAreaPixels objesinin şekli. */
export type KirpAlani = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function gorseliYukle(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Resim okunamadı"));
    img.src = src;
  });
}

/**
 * Kullanıcının seçtiği `kirp` alanını (orijinal piksel koordinatlarında)
 * canvas'a alıp hedef boyutta JPEG dosyası döndürür.
 */
export async function fotoKirp(
  kaynakUrl: string,
  kirp: KirpAlani,
  dosyaAdi: string,
): Promise<File> {
  const img = await gorseliYukle(kaynakUrl);
  const canvas = document.createElement("canvas");
  canvas.width = HEDEF_GENISLIK;
  canvas.height = HEDEF_YUKSEKLIK;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas oluşturulamadı");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    kirp.x,
    kirp.y,
    kirp.width,
    kirp.height,
    0,
    0,
    HEDEF_GENISLIK,
    HEDEF_YUKSEKLIK,
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Sıkıştırma başarısız"))),
      "image/jpeg",
      0.85,
    );
  });
  const ad = dosyaAdi.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], ad, { type: "image/jpeg" });
}
