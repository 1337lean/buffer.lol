import type { IPLensFeature } from "@/data/ip-lens";

export function IPLensFeatureCard({ feature }: { feature: IPLensFeature }) {
  return (
    <article className="tool-card ip-lens-feature-card">
      <div className="tool-card-topline">
        <span className="command-icon" aria-hidden="true">{feature.command}</span>
        <span className="availability is-live">Included</span>
      </div>
      <div>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    </article>
  );
}
