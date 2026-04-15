import { renderToStaticMarkup } from 'react-dom/server';

type ScreencastPickerSource = {
  id: string;
  name: string;
  thumbnail: string;
  type: 'Screen' | 'Window';
};

type ScreencastPickerDocumentProps = {
  sourcesJson: string;
};

const escapeInlineJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

const screencastPickerScript = (sourcesJson: string) => `
  const sources = ${sourcesJson};
  const grid = document.querySelector('.grid');
  const cancel = () => {
    document.title = 'sharkord-capture-source:cancel';
  };

  document.querySelector('.cancel').addEventListener('click', cancel);

  for (const source of sources) {
    const button = document.createElement('button');
    button.className = 'source';
    button.type = 'button';
    button.innerHTML =
      '<img alt="" src="' +
      source.thumbnail +
      '" />' +
      '<span class="meta">' +
      '<span class="type">' +
      source.type +
      '</span>' +
      '<span class="name"></span>' +
      '</span>';
    button.querySelector('.name').textContent = source.name;
    button.addEventListener('click', () => {
      document.title = 'sharkord-capture-source:' + source.id;
    });
    grid.append(button);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cancel();
    }
  });
`;

const ScreencastPickerDocument = ({
  sourcesJson,
}: ScreencastPickerDocumentProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          width: 100%;
          height: 100%;
          margin: 0;
          background: #101418;
          color: #f8fafc;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        body {
          display: flex;
          flex-direction: column;
        }

        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .cancel {
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
          padding: 8px 12px;
          font: inherit;
          cursor: pointer;
        }

        main {
          overflow: auto;
          padding: 18px 20px 22px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .source {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          overflow: hidden;
          color: inherit;
          background: rgba(255, 255, 255, 0.06);
          text-align: left;
          cursor: pointer;
        }

        .source:hover,
        .source:focus-visible {
          outline: 2px solid #facc15;
          outline-offset: 2px;
        }

        img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          background: #020617;
        }

        .meta {
          display: grid;
          gap: 4px;
          padding: 10px 12px 12px;
        }

        .type {
          color: #fde047;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </head>
    <body>
      <header>
        <h1>Choose what to share</h1>
        <button className="cancel" type="button">
          Cancel
        </button>
      </header>
      <main>
        <div className="grid"></div>
      </main>
      <script
        dangerouslySetInnerHTML={{
          __html: screencastPickerScript(sourcesJson),
        }}
      />
    </body>
  </html>
);

const buildScreencastPickerDataUrl = (sources: ScreencastPickerSource[]) => {
  const html =
    '<!doctype html>' +
    renderToStaticMarkup(
      <ScreencastPickerDocument sourcesJson={escapeInlineJson(sources)} />
    );

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

export { buildScreencastPickerDataUrl };
export type { ScreencastPickerSource };
