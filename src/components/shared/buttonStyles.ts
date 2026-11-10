const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const shared = `inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;

export const btn = {
  primary: `${shared} bg-brand-700 px-3.5 py-2 text-white shadow-sm hover:bg-brand-800`,
  secondary: `${shared} bg-white px-3.5 py-2 text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50`,
  danger: `${shared} bg-red-600 px-3.5 py-2 text-white shadow-sm hover:bg-red-700`,
  success: `${shared} bg-emerald-600 px-3.5 py-2 text-white shadow-sm hover:bg-emerald-700`,
  ghost: `${shared} px-2.5 py-1.5 text-brand-700 hover:bg-brand-50`,
};

export const inputClass =
  'block w-full rounded-md border-0 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

export const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
