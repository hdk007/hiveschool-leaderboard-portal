"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, FileText, BookOpen, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CurriculumModule } from "@/types/database";

export function ModuleCard({ module, index, defaultOpen = false }: { module: CurriculumModule; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const schedule = module.schedule ?? [];
  const hasExtras = module.topics.length > 0 || module.assignments.length > 0 || module.resources.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-secondary/40 sm:p-5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-base font-bold text-accent">
            {String(module.order_index || index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{module.module_name}</h3>
              {module.duration && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="size-3" /> {module.duration}
                </Badge>
              )}
            </div>
            {module.description && <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>}
            {module.outcome && (
              <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                <span>You&apos;ll walk away with {module.outcome.charAt(0).toLowerCase() + module.outcome.slice(1)}</span>
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <Progress value={module.completion_percentage} className="h-1.5 max-w-[200px]" />
              <span className="text-xs font-medium text-muted-foreground tabular">{module.completion_percentage}%</span>
            </div>
          </div>
          <ChevronDown className={cn("mt-1 size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-4 sm:p-5">
                {/* Schedule timeline */}
                {schedule.length > 0 && (
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock className="size-3.5" /> Schedule
                    </p>
                    <ol className="relative space-y-3 border-l border-border pl-5">
                      {schedule.map((s, i) => {
                        const isBreak = !s.detail && /break|lunch/i.test(s.title);
                        return (
                          <li key={i} className="relative">
                            <span
                              className={cn(
                                "absolute -left-[1.46rem] top-1 size-2.5 rounded-full ring-4 ring-card",
                                isBreak ? "bg-muted-foreground/40" : "bg-accent"
                              )}
                            />
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                              <span className="shrink-0 text-xs font-semibold tabular text-accent sm:w-20">{s.time}</span>
                              <div className="min-w-0">
                                <p className={cn("text-sm font-medium", isBreak && "text-muted-foreground")}>{s.title}</p>
                                {s.detail && <p className="text-xs text-muted-foreground">{s.detail}</p>}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {/* Optional extras */}
                {hasExtras && (
                  <div className={cn("grid gap-6 sm:grid-cols-3", schedule.length > 0 && "mt-6 border-t border-border pt-5")}>
                    <Section icon={BookOpen} title="Topics">
                      {module.topics.length ? (
                        <ul className="space-y-1.5">
                          {module.topics.map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {t}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty />
                      )}
                    </Section>

                    <Section icon={FileText} title="Assignments">
                      {module.assignments.length ? (
                        <ul className="space-y-1.5">
                          {module.assignments.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" /> {a}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty />
                      )}
                    </Section>

                    <Section icon={ExternalLink} title="Resources">
                      {module.resources.length ? (
                        <ul className="space-y-1.5">
                          {module.resources.map((r, i) => (
                            <li key={i}>
                              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                                <ExternalLink className="size-3.5" /> {r.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty />
                      )}
                    </Section>
                  </div>
                )}

                {schedule.length === 0 && !hasExtras && <Empty />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Coming soon.</p>;
}
