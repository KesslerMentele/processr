import { marked } from 'marked';
import { useEffect, useState } from "react";


const HelpPanel = () => {
  const [grammarDocs, setGrammarDocs] = useState<{ name: string; content: string }[] | null>(null);

  useEffect(() => {
    void fetch('/api/pack/grammar')
    .then(r => r.json())
    .then((docs: { name: string; content: string }[]) => {
      setGrammarDocs(docs);
    });
  },[]);


  return (<div className="pack-editor-help">
    {grammarDocs === null
      ? <p className="pack-editor-help-loading">Loading…</p>
      : grammarDocs.map(doc => (
        <section key={doc.name} className="pack-editor-help-section">
          <div
            className="pack-editor-help-content"
            dangerouslySetInnerHTML={{ __html: marked(doc.content) as string }}
          />
        </section>
      ))
    }
  </div>);
};

export default HelpPanel;