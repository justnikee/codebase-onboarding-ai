export function WhyThisExists() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-40">
      <div className="bg-[#111] border border-white/5 p-12 md:p-16 rounded-2xl flex flex-col md:flex-row gap-8 items-start">
        <div className="md:w-1/3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tighter text-white">Why this exists</h2>
        </div>
        <div className="md:w-2/3">
          <p className="text-xl text-zinc-400 leading-relaxed font-medium">
            "Because reading through undocumented code, guessing what functions do, and tracing spaghetti dependencies takes too long. BOB is your instant pair-programmer that actually knows the context."
          </p>
        </div>
      </div>
    </div>
  );
}
