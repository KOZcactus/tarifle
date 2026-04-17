import { BroadcastForm } from "@/components/admin/BroadcastForm";

export const metadata = {
  title: "Bildirim Gönder | Yönetim Paneli",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function BroadcastPage() {
  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-bold">
        📣 Toplu bildirim gönder
      </h2>
      <p className="mb-4 text-sm text-text-muted">
        Bu form seçtiğin hedef kitleye tek tek in-app bildirim oluşturur.
        E-posta gönderilmez. Askıya alınmış hesaplar ve silinmiş
        kullanıcılar hariç tutulur.
      </p>
      <BroadcastForm />

      <div className="mt-6 rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-xs text-text-muted">
        <p className="font-semibold text-text">İpuçları</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Başlığı kısa ve eyleme çağıran yaz (&quot;Yeni: 1100 tarif canlıda&quot;).</li>
          <li>Link iç sayfa olsun (&quot;/kesfet&quot; gibi). Tıklanınca bildirim okundu sayılır.</li>
          <li>
            Her broadcast ModerationAction log&apos;a yazılır; kimin ne zaman
            ne gönderdiği kalıcı kayıtta.
          </li>
        </ul>
      </div>
    </div>
  );
}
