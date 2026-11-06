export type Task = {
  id: string;
  text: string;
  tags: string[];
  done: boolean;
  createdAt: number;
  order: number;
};

export type View = "focus" | "list" | "add" | "tags";
