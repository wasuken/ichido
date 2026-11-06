export type Task = {
  id: string;
  parentId: string | null;
  text: string;
  tags: string[];
  done: boolean;
  createdAt: number;
  order: number;
};

export type View = "focus" | "list" | "add" | "tags";
