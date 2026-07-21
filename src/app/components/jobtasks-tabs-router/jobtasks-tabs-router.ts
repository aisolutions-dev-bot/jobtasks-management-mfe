import { Component, OnInit, OnDestroy, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RemoteComponent } from '../remote-component';
import { environment } from '../../../environments/environment';
import { IAuthService } from '../../models/auth';

@Component({
    selector: 'jobtasks-tabs-router',
    standalone: true,
    imports: [CommonModule, RemoteComponent],
    templateUrl: './jobtasks-tabs-router.html',
    styleUrl: './jobtasks-tabs-router.scss',
})
export class JobTasksTabsRouter implements OnInit, OnDestroy {
    private readonly MODULE_ID = 'mod24';
    uiMfeUrl = environment.uiMfeUrl;

    private cdr = inject(ChangeDetectorRef);

    private baseTabs: Record<string, { label: string; icon?: string; accessCode: string }> = {
        '/job-tasks/board': {
            label: 'Task Board',
            accessCode: 'a2401',
        },
        '/job-tasks/release': {
            label: 'Task Release',
            accessCode: 'a2402',
        },
    };

    tabs: Record<string, { label: string; icon?: string }> = {};
    activeRoute = '';
    private sub?: Subscription;

    constructor(
        private router: Router,
        @Inject('AUTH_SERVICE') public authService: IAuthService,
    ) {}

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.fetchUserRole();
            await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
        } catch {}

        const accesses = this.authService.groupAuthorityAccesses();

        // Filter tabs by RBAC — if no accesses returned (local dev), show all tabs
        if (accesses.length === 0) {
            this.tabs = Object.fromEntries(
                Object.entries(this.baseTabs).map(([k, v]) => [k, { label: v.label, icon: v.icon }])
            );
        } else {
            this.tabs = Object.fromEntries(
                Object.entries(this.baseTabs)
                    .filter(([_, tab]) =>
                        accesses.some((a) => a.accessCode === tab.accessCode && a.accessValue)
                    )
                    .map(([k, v]) => [k, { label: v.label, icon: v.icon }])
            );
        }

        this.setActiveRoute(this.router.url);

        this.sub = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((event) => {
                this.setActiveRoute(event.urlAfterRedirects);
            });

        this.cdr.detectChanges();
    }

    private setActiveRoute(url: string): void {
        const matchingRoute = Object.keys(this.tabs)
            .filter((tabRoute) => url.startsWith(tabRoute))
            .sort((a, b) => b.length - a.length)[0];
        this.activeRoute = matchingRoute || url;
    }

    handleTabChange(event: Record<string, any>) {
        const newRoute = event['tabChange'];
        this.activeRoute = newRoute;
        this.router.navigateByUrl(newRoute);
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
}
