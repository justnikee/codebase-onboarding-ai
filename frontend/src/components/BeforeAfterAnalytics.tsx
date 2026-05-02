"use client";

import { motion } from "framer-motion";
import { Clock, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const data = [
  {
    name: "Legacy Code Setup",
    manual: 24,
    ai: 2,
  },
  {
    name: "Env Config",
    manual: 16,
    ai: 1,
  },
  {
    name: "Doc Reading",
    manual: 32,
    ai: 3,
  },
  {
    name: "First PR",
    manual: 40,
    ai: 6,
  },
];

export function BeforeAfterAnalytics() {
  return (
    <div className="py-32 w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          The Onboarding Revolution
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          We reduced developer time-to-first-commit from weeks down to mere hours. Here is the actual data.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
        {/* Analytics Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <Card className="h-full bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl">
            <CardContent className="p-8 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Time Saved (Hours)</h3>
                <p className="text-sm text-slate-400">Comparing manual onboarding vs DevBoard AI</p>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}h`} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                    />
                    <Bar dataKey="manual" name="Manual Onboarding" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#475569" />
                      ))}
                    </Bar>
                    <Bar dataKey="ai" name="DevBoard AI" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#8b5cf6" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Before Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-slate-900/50 border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-medium border border-red-500/20">
                Before
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">Manual Onboarding</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Days spent reading legacy code",
                    "Endless Slack questions to senior devs",
                    "Struggling with local environment setup"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-400">
                      <XCircle className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* After Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 relative overflow-hidden shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)]">
              <div className="absolute top-4 right-4 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                After
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">AI-Powered Flow</h3>
                </div>

                <div className="space-y-4">
                  {[
                    "Instant architectural overviews",
                    "Context-aware AI Q&A trained on the repo",
                    "Automated step-by-step setup guides"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
