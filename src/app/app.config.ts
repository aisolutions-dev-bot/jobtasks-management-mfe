import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient }                      from '@angular/common/http';
import { provideAnimations }                      from '@angular/platform-browser/animations';
import { LucideAngularModule, Plus, Calendar, Search, X, Check, Code2, LifeBuoy, HelpCircle,
         MessageSquare, FileText, Bug, ChevronDown, Clock, ArrowRight, Trash2,
         CheckCircle2, Circle, PauseCircle, AlertTriangle, Inbox, Send,
         SlidersHorizontal, Sparkles, TrendingUp, ChevronRight,
        Filter, Loader,
         Filter, Loader }                                                   from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Plus, Calendar, Search, X, Check, Code2, LifeBuoy, HelpCircle,
        MessageSquare, FileText, Bug, ChevronDown, Clock, ArrowRight, Trash2,
        CheckCircle2, Circle, PauseCircle, AlertTriangle, Inbox, Send,
        SlidersHorizontal, Sparkles, TrendingUp, ChevronRight,
        Filter, Loader,
      }),
    ),
  ],
};
