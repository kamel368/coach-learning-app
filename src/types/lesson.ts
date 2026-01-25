// src/types/lesson.ts

export type BlockType =
  | "text"
  | "info"
  | "image"
  | "toggle"
  | "timeline"
  | "separator"
  | "video"
  | "lessonLink";

export type LessonStatus = "draft" | "published" | "suspended";

export type BaseBlock = {
  id: string;        // uuid
  type: BlockType;
};

export type TextBlock = BaseBlock & {
  type: "text";
  data: { html: string };
};

export type InfoBlock = BaseBlock & {
  type: "info";
  data: {
    title: string;
    body: string;
    variant: "info" | "warning" | "success";
  };
};

export type ImageBlock = BaseBlock & {
  type: "image";
  data: {
    url: string;
    alt: string;
    caption?: string;
  };
};

export type ToggleBlock = BaseBlock & {
  type: "toggle";
  data: {
    title: string;
    body: string;
    defaultOpen: boolean;
  };
};

export type TimelineBlock = BaseBlock & {
  type: "timeline";
  data: {
    items: { label: string; description: string }[];
  };
};

export type SeparatorBlock = BaseBlock & {
  type: "separator";
  data: {};
};

export type VideoBlock = BaseBlock & {
  type: "video";
  data: {
    url: string;
    title?: string;
    description?: string;
  };
};

export type LessonLinkBlock = BaseBlock & {
  type: "lessonLink";
  data: {
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
  };
};

export type Block =
  | TextBlock
  | InfoBlock
  | ImageBlock
  | ToggleBlock
  | TimelineBlock
  | SeparatorBlock
  | VideoBlock
  | LessonLinkBlock;

export type Lesson = {
  id: string;
  chapterId: string;
  title: string;
  status: LessonStatus;
  blocks: Block[];
  createdAt?: any;
  updatedAt?: any;
};
