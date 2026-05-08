export function getRiskBadgeClasses(riskLevel) {
  switch (riskLevel) {
    case "NONE":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300";
    case "LOW":
      return "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-800 ring-yellow-500/20 dark:text-yellow-300";
    case "HIGH":
      return "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300";
    case "CRITICAL":
      return "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300";
    default:
      return "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300";
  }
}

export function getPiiTypeBadgeClasses(type) {
  switch (type) {
    case "NAME":
      return "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300";
    case "PHONE":
      return "bg-purple-500/10 text-purple-700 ring-purple-500/20 dark:text-purple-300";
    case "EMAIL":
      return "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300";
    case "ADDRESS":
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300";
    case "RRN":
      return "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300";
    case "CARD":
      return "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300";
    case "SECRET":
      return "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300";
    case "ACCOUNT":
      return "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300";
    default:
      return "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300";
  }
}
