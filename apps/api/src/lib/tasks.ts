export interface TaskTemplate {
  id: string;
  stage_name: string;
  title: string;
  description: string;
  task_type: string;
  priority: string;
  offset_days: number;
}

export function scheduleTemplateTasks(
  templates: TaskTemplate[],
  plantingDate: string,
): { title: string; description: string; task_type: string; priority: string; due_date: string }[] {
  const planted = new Date(plantingDate + "T00:00:00");
  return templates.map((t) => {
    const due = new Date(planted.getTime() + t.offset_days * 1000 * 60 * 60 * 24);
    return {
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      priority: t.priority,
      due_date: due.toISOString().slice(0, 10),
    };
  });
}
