export const euro=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value);
export const compact=(value:number)=>new Intl.NumberFormat('it-IT',{notation:'compact',maximumFractionDigits:1}).format(value);
export const dateLabel=(value:string)=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00'));
