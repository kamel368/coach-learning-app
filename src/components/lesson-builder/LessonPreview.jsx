// src/components/lesson-builder/LessonPreview.jsx
import ReactPlayer from "react-player";

export default function LessonPreview({
  lesson,
  selectedBlockId,
  onSelectBlock,
}) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-semibold mb-4">{lesson.title}</h1>
      {lesson.blocks.map((block) => (
        <div
          key={block.id}
          className={`rounded border p-3 ${
            selectedBlockId === block.id
              ? "border-blue-400 shadow-sm"
              : "border-transparent"
          }`}
          onClick={() => onSelectBlock(block.id)}
        >
          {renderBlock(block)}
        </div>
      ))}
      {lesson.blocks.length === 0 && (
        <p className="text-sm text-slate-400">
          Aucun contenu pour l’instant. Ajoutez des blocs dans le mode édition.
        </p>
      )}
    </div>
  );
}

function renderBlock(block) {
  switch (block.type) {
    case "text":
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: block.data.html || "" }}
        />
      );

    case "info":
      return (
        <div
          className={`p-3 rounded text-sm ${
            block.data.variant === "warning"
              ? "bg-red-50 border border-red-300"
              : block.data.variant === "success"
              ? "bg-green-50 border border-green-300"
              : "bg-blue-50 border border-blue-300"
          }`}
        >
          <div className="font-medium mb-1">{block.data.title}</div>
          <div>{block.data.body}</div>
        </div>
      );

    case "image":
      return (
        <figure className="text-center">
          {block.data.url && (
            <img
              src={block.data.url}
              alt={block.data.alt}
              className="mx-auto max-h-80 object-contain"
            />
          )}
          {block.data.caption && (
            <figcaption className="text-xs text-slate-500 mt-1">
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      );

    case "toggle":
      return (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            {block.data.title}
          </summary>
          <div className="mt-2">{block.data.body}</div>
        </details>
      );

    case "timeline":
      return (
        <ol className="relative border-s border-slate-200 text-sm">
          {block.data.items.map((item, idx) => (
            <li key={idx} className="mb-4 ms-4">
              <div className="absolute w-2 h-2 bg-blue-400 rounded-full -start-1 mt-1" />
              <h3 className="font-medium">{item.label}</h3>
              <p className="text-slate-600">{item.description}</p>
            </li>
          ))}
        </ol>
      );

    case "separator":
      return <hr className="border-t border-slate-200" />;

    case "video":
      return (
        <div className="flex justify-center">
          {block.data.url && (
            <div className="w-full max-w-xl">
              <ReactPlayer url={block.data.url} controls width="100%" />
              {(block.data.title || block.data.description) && (
                <div className="mt-2 text-sm">
                  {block.data.title && (
                    <div className="font-medium">{block.data.title}</div>
                  )}
                  {block.data.description && (
                    <div className="text-slate-600">
                      {block.data.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );

    case "lessonLink":
      return (
        <a
          href="#"
          className="block border border-blue-200 rounded p-3 text-sm bg-blue-50"
        >
          <div className="text-xs uppercase text-blue-500">
            Leçon liée ({block.data.moduleTitle})
          </div>
          <div className="font-medium">{block.data.lessonTitle}</div>
        </a>
      );

    default:
      return null;
  }
}
