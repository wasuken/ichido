export type Task = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  order: number;
};

export type View = "focus" | "list" | "add";
