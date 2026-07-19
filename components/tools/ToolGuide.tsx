import type { Tool } from "@/data/tools";

export function ToolGuide({ tool }: { tool: Tool }) {
  return (
    <article className="tool-guide" aria-labelledby="tool-guide-heading">
      <header>
        <span className="section-kicker">Guide</span>
        <h2 id="tool-guide-heading">About the {tool.name}</h2>
        <p>{tool.seo.intro}</p>
      </header>

      <div className="tool-guide-sections">
        {tool.seo.sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
      </div>

      <section className="tool-faq" aria-labelledby="tool-faq-heading">
        <span className="section-kicker">FAQ</span>
        <h2 id="tool-faq-heading">Common questions</h2>
        <dl>
          {tool.seo.faq.map((item) => (
            <div key={item.question}>
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
