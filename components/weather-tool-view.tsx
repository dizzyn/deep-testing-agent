interface WeatherToolInvocation {
  state: string;
  input?: { location?: string };
  output?: {
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
  };
}

export function WeatherToolView({
  invocation,
}: {
  invocation: WeatherToolInvocation;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
      {invocation.state === "output-available" && invocation.output ? (
        <div className="space-y-2">
          <div className="text-sm text-gray-400 mb-3">Weather Information</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Location:</span>
              <div className="text-white">{invocation.input?.location}</div>
            </div>
            <div>
              <span className="text-gray-400">Temperature:</span>
              <div className="text-white">
                {invocation.output.temperature}°F
              </div>
            </div>
            <div>
              <span className="text-gray-400">Condition:</span>
              <div className="text-white">{invocation.output.condition}</div>
            </div>
            <div>
              <span className="text-gray-400">Humidity:</span>
              <div className="text-white">{invocation.output.humidity}%</div>
            </div>
          </div>
        </div>
      ) : invocation.state === "input-streaming" ||
        invocation.state === "input-available" ? (
        <div className="text-gray-300">
          Getting weather for {invocation.input?.location || "..."}...
        </div>
      ) : invocation.state === "executing" ? (
        <div className="text-gray-300">Fetching weather data...</div>
      ) : invocation.state === "approval-requested" ? (
        <div className="text-yellow-400">
          Waiting for approval to get weather for {invocation.input?.location}
          ...
        </div>
      ) : (
        <div className="text-gray-400">
          Weather tool state: {invocation.state}
        </div>
      )}
    </div>
  );
}
