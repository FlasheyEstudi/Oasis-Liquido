import re

file_path = 'Frontend/src/components/patient/pharmacy-map.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Make the pharmacy card display the stock info if prescription is active.
search_str = """                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}"""

replace_str = """                          </button>
                        </div>

                        {prescription && prescription.lines && (
                          <div className="mt-3 text-xs w-full pt-2 border-t border-white/10">
                            {((pharmacy as any).matchedMedicinesCount === prescription.lines.length) ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-md">
                                <CheckCircle2 className="size-3.5" />
                                <span className="font-medium">Tiene todos los medicamentos ({prescription.lines.length})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-md">
                                <AlertCircle className="size-3.5" />
                                <span className="font-medium">Tiene {(pharmacy as any).matchedMedicinesCount || 0} de {prescription.lines.length} medicamentos</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}"""

content = content.replace(search_str, replace_str)

with open(file_path, 'w') as f:
    f.write(content)
