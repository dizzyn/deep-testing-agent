"use client";

import { useState } from "react";

interface DemoTask {
  title: string;
  description: string;
}

const DEMO_TASKS: DemoTask[] = [
  {
    title: "TODO items",
    description:
      "Go to demo.playwright.dev/todomvc, add multiple items, mark one complete, filter the list, and verify UI consistency when switching views.",
  },
  {
    title: "Shopping cart",
    description:
      "Go to `https://www.saucedemo.com/` using `standard_user` / `secret_sauce` and verify that I can add the most expensive item to the cart.",
  },
  {
    title: "Profile Update",
    description:
      "Log in to opensource-demo.orangehrmlive.com, update personal info in the profile, and check that navigation remains stable without errors.",
  },
  {
    title: "SauceDemo Checkout",
    description:
      "On https://www.saucedemo.com, add the fleece jacket and backpack to the cart, complete checkout, and verify the total price includes tax.",
  },
  {
    title: "OrangeHRM Add Employee",
    description:
      "Log in to OrangeHRM, go to PIM, add an employee with a middle name, and confirm the record saves successfully.",
  },
];

interface DemoTasksProps {
  onTaskClick: (task: DemoTask) => void;
}

export function DemoTasks({ onTaskClick }: DemoTasksProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(() => {
    // Initialize with first task for SSR consistency
    return 0;
  });

  const shuffleTask = (): void => {
    // Generate random index in the event handler, not during render
    const newIndex = Math.floor(Math.random() * DEMO_TASKS.length);
    setCurrentTaskIndex(newIndex);
  };

  const currentTask = DEMO_TASKS[currentTaskIndex];

  return (
    <div className="">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-zinc-100 font-medium">Try a Demo Task</h3>
        <button
          onClick={shuffleTask}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-sm transition-colors"
        >
          Rotate
        </button>
      </div>

      <button
        onClick={() => onTaskClick(currentTask)}
        className="w-full text-left border border-zinc-700 hover:border-zinc-600 rounded-lg p-3 transition-colors group hover:bg-zinc-800"
      >
        <div className="font-medium text-zinc-100 mb-1 group-hover:text-blue-400">
          {currentTask.title}
        </div>
        <div className="text-zinc-400 text-sm">{currentTask.description}</div>
      </button>
    </div>
  );
}
