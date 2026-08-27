import { getTasks, createTask, toggleTask } from './actions';

export default async function Home() {
  const tasks = await getTasks();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-orange-900 dark:text-orange-50 mb-8">
          To-Do List
        </h1>

        {/* Add task form */}
        <form action={createTask} className="flex gap-2 mb-8">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-orange-300 dark:border-orange-700 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-orange-50 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-600 dark:bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-400 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Task list */}
        <ul className="space-y-2">
          {tasks.length === 0 && (
            <li className="text-orange-400 text-center py-8">No tasks yet. Add one above!</li>
          )}
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-zinc-800 px-4 py-3"
            >
              <form
                action={async () => {
                  'use server';
                  await toggleTask(task.id, !task.completed);
                }}
              >
                <button
                  type="submit"
                  className={`h-5 w-5 rounded border-2 flex-shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-orange-600 dark:bg-orange-500 border-orange-600 dark:border-orange-500'
                      : 'border-orange-300 dark:border-orange-700 hover:border-orange-500'
                  }`}
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.completed && (
                    <svg viewBox="0 0 12 12" className="text-white w-full h-full p-0.5">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? 'line-through text-orange-300'
                    : 'text-zinc-800 dark:text-orange-100'
                }`}
              >
                {task.title}
              </span>
            </li>
          ))}
        </ul>

        {tasks.length > 0 && (
          <p className="mt-4 text-xs text-orange-400 text-right">
            {tasks.filter((t) => t.completed).length} / {tasks.length} completed
          </p>
        )}
      </div>
    </div>
  );
}
