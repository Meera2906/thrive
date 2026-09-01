import { HeartPulse } from "lucide-react";

export default function HospitalLoader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative w-48 h-24 overflow-hidden flex items-center justify-center">
        {/* Background streak lines */}
        <div className="absolute inset-0 w-full h-full">
          <div className="loader-streak animate-lf1 top-[20%] w-[40px]" />
          <div className="loader-streak animate-lf2 top-[45%] w-[60px]" />
          <div className="loader-streak animate-lf3 top-[70%] w-[35px]" />
        </div>
        
        {/* Speeder body (HeartPulse) */}
        <div className="animate-speeder relative z-10 text-brand-dark drop-shadow-md">
          <HeartPulse size={48} strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-bold text-brand-dark mb-1">
          Checking in on your patients
        </h3>
        <p className="text-sm text-slate-500 mb-4 max-w-[200px] mx-auto leading-tight">
          Gathering the latest health records securely...
        </p>
        
        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-brand-muted rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-brand animate-loader-bar rounded-full" />
        </div>
      </div>
    </div>
  );
}
