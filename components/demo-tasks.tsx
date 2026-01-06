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
  {
    title: "Google Flights",
    description:
      "On Google Flights, search for a trip to Paris, apply the 'Bags' filter for a carry-on, and verify that prices update immediately.",
  },
  {
    title: "Wikipedia PDF",
    description:
      'On Wikipedia, search for "Quantum Mechanics," select "Download as PDF," and check the generated file for layout errors.',
  },
  {
    title: "Airbnb Map",
    description:
      "On Airbnb, search for Austin, TX, adjust the price slider to under $100, and verify the map pins refresh accordingly.",
  },
  {
    title: "GitHub Repository",
    description:
      "Navigate to a popular GitHub repository, check the issues tab, create a new issue, and verify it appears in the list.",
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
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 font-medium">Try a Demo Task</h3>
        <button
          onClick={shuffleTask}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <button
        onClick={() => onTaskClick(currentTask)}
        className="w-full text-left border border-gray-200 hover:border-gray-300 rounded-lg p-3 transition-colors group hover:bg-gray-50"
      >
        <div className="font-medium text-gray-900 mb-1 group-hover:text-blue-600">
          {currentTask.title}
        </div>
        <div className="text-gray-600 text-sm">{currentTask.description}</div>
      </button>
    </div>
  );
}
