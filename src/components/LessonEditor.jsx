// src/components/LessonEditor.jsx
import { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

function LessonEditor({ initialContent = "", onChange }) {
  const [content, setContent] = useState(initialContent);

  // IMPORTANT : synchroniser quand initialContent change (mode édition)
  useEffect(() => {
    setContent(initialContent || "");
  }, [initialContent]);

  const handleEditorChange = (newContent) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  return (
    <div>
      <Editor
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
        value={content}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "code",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | formatselect | " +
            "bold italic underline | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "link image media | removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        }}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
}

export default LessonEditor;
