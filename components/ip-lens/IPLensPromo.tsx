import Image from "next/image";
import Link from "next/link";
import { ipLensConfig } from "@/data/ip-lens";

export function IPLensPromo() {
  return (
    <aside className="ip-lens-promo" aria-labelledby="ip-lens-promo-title">
      <Image className="ip-lens-promo-icon" src={ipLensConfig.appIcon} width={92} height={92} alt="" />
      <div>
        <span className="section-kicker">native://ios</span>
        <h2 id="ip-lens-promo-title">{ipLensConfig.appName}</h2>
        <p>A focused networking toolkit, built natively for iPhone.</p>
      </div>
      <Link href="/ip-lens">Explore the app <span aria-hidden="true">→</span></Link>
    </aside>
  );
}
