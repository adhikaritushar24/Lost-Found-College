export default function About() {
  const steps = [
    {
      icon: "📝",
      title: "Report",
      text: "Lost something on campus, or found someone else's item? Report it in seconds with a photo and location.",
    },
    {
      icon: "🔍",
      title: "Browse & Search",
      text: "Search and filter through reported items by category, location, or keyword to find what you're looking for.",
    },
    {
      icon: "🔔",
      title: "Get Notified",
      text: "If someone reports a found item that matches something you lost, you'll get notified automatically.",
    },
    {
      icon: "🤝",
      title: "Reunite",
      text: "Connect, verify ownership, and get your belongings back to their rightful owner.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-purple-50/30 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/25 mb-4">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            About Lost & Found
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            A simple campus platform to help students report, find, and reunite
            with lost belongings.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm shadow-purple-100/40 hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 text-xl ring-1 ring-purple-100">
                {step.icon}
              </span>
              <h3 className="text-sm font-semibold text-gray-900 mt-3.5">
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-2xl p-8 text-center relative overflow-hidden shadow-lg shadow-purple-500/20">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <p className="relative text-white text-sm font-medium">
            Built as a student project to make lost-and-found on campus faster
            and less stressful for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
