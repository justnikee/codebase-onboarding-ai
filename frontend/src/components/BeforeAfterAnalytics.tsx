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
        <h2 className="text-4xl md:text-5xl font-extrabold text-theme-fg tracking-tight mb-4">
          Getting into a new codebase shouldn't take days
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
        {/* Analytics Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <Card className="h-full bg-theme-card/40 backdrop-blur-2xl border-theme-border-02 shadow-2xl">
            <CardContent className="p-8 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-theme-fg mb-2">Time Saved (Hours)</h3>
                <p className="text-sm text-theme-text-sec">Comparing manual onboarding vs DevBoard AI</p>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-theme-border-03)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="var(--color-theme-border-03)" 
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
                        <Cell key={`cell-${index}`} fill="var(--color-theme-border-02)" />
                      ))}
                    </Bar>
                    <Bar dataKey="ai" name="DevBoard AI" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="var(--color-theme-accent)" />
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
            <Card className="bg-theme-bg/50 border-theme-border-02 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-error/10 text-error px-3 py-1 rounded-full text-xs font-medium border border-error/20">
                Before
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-error/10 rounded-xl">
                    <Clock className="w-6 h-6 text-error" />
                  </div>
                  <h3 className="text-2xl font-semibold text-theme-fg">Manual Onboarding</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Reading files with no context",
                    "Asking teammates basic questions",
                    "Breaking things while setting up",
                    "No idea how pieces connect"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-theme-text-sec">
                      <XCircle className="w-5 h-5 text-error/50 flex-shrink-0 mt-0.5" />
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
            <Card className="bg-theme-card/40 border-theme-border-02 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium border border-success/20 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                After
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-theme-accent/20 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-theme-accent" />
                  </div>
                  <h3 className="text-2xl font-semibold text-theme-fg">AI-Powered Flow</h3>
                </div>

                <div className="space-y-4">
                  {[
                    "Clear overview of how everything fits together",
                    "Setup steps you can actually follow",
                    "Ask questions and get real answers",
                    "Start contributing much faster"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-theme-text-mid">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
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
